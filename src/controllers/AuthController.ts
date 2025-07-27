import { Request, Response } from 'express';
import { DatabaseService } from '@services/DatabaseService';
import ResponseHelper from '@utils/responseHelper';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '@config/index';

export class AuthController {
  private databaseService: DatabaseService;
  private useJwtAuth: boolean;

  constructor() {
    this.databaseService = new DatabaseService();
    // Leer configuración del .env
    this.useJwtAuth = process.env.USE_JWT_AUTH === 'true';
    console.log(`AuthController configurado para usar: ${this.useJwtAuth ? 'JWT con tabla usuarios' : 'SP login tradicional'}`);
  }

  /**
   * @swagger
   * /api/v2/auth/login:
   *   post:
   *     summary: Login de usuario
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nombre
   *               - password
   *             properties:
   *               nombre:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login exitoso
   *       401:
   *         description: Credenciales inválidas
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      if (this.useJwtAuth) {
        await this.loginWithJWT(req, res);
      } else {
        await this.loginWithSP(req, res);
      }
    } catch (error) {
      console.error('Error en login:', error);
      ResponseHelper.error(res, 'Error al iniciar sesión');
    }
  };

  /**
   * Login con JWT usando tabla usuarios
   */
  private loginWithJWT = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Validar entrada
    if (!email || !password) {
      ResponseHelper.error(res, 'Email y contraseña son requeridos', 400);
      return;
    }

    try {
      // Buscar usuario por email
      const [users] = await this.databaseService.executeQuery(`
        SELECT id, email, password_hash, nombre, apellido, rol, es_super_usuario, activo, email_verificado
        FROM usuarios 
        WHERE email = ? AND activo = 1
      `, [email]);

      if (!users || users.length === 0) {
        ResponseHelper.error(res, 'Credenciales inválidas', 401);
        return;
      }

      const user = users[0];

      // Verificar password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        ResponseHelper.error(res, 'Credenciales inválidas', 401);
        return;
      }

      // Verificar si el email está verificado
      if (!user.email_verificado) {
        ResponseHelper.error(res, 'Por favor verifica tu email antes de iniciar sesión', 403);
        return;
      }

      // Generar tokens JWT
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          isSuperUser: user.es_super_usuario
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as SignOptions
      );

      const refreshToken = jwt.sign(
        { id: user.id },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
      );

      // Actualizar último login y guardar refresh token
      await this.databaseService.executeQuery(`
        UPDATE usuarios 
        SET ultimo_login = NOW(), refresh_token = ?
        WHERE id = ?
      `, [refreshToken, user.id]);

      // Respuesta compatible con el frontend
      const response = {
        estado: 1,
        mensaje: 'Login exitoso',
        datos: {
          ID_User: user.id,
          Nombre: user.nombre,
          Apellido: user.apellido,
          Email: user.email,
          Rol: user.rol,
          isSuperUser: user.es_super_usuario === 1
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error en login JWT:', error);
      ResponseHelper.error(res, 'Error al iniciar sesión', 500);
    }
  };

  /**
   * Login tradicional con stored procedure
   */
  private loginWithSP = async (req: Request, res: Response): Promise<void> => {
    const { nombre, password } = req.body;

    // Llamar al SP de login como en legacy
    const result = await this.databaseService.executeStoredProcedure('sp_login_user', {
      nombre,
      password
    });

    if (!result || result.length === 0) {
      ResponseHelper.error(res, 'Credenciales inválidas', 401);
      return;
    }

    const spResult = result[0];

    // Log para debug
    console.log('Usuario del SP:', spResult);

    // Verificar si el login fue exitoso
    if (!spResult || spResult.estado === 0) {
      // Si falla el SP y es un intento de super usuario, intentar con tabla usuarios
      console.log('Login SP falló, verificando si es super usuario...');

      // Convertir nombre a email para intentar en tabla usuarios
      const email = `${nombre}@bsi.com`;
      req.body.email = email;
      req.body.password = password;

      // Intentar login JWT
      try {
        await this.loginWithJWT(req, res);
        return;
      } catch (jwtError) {
        // Si también falla JWT, devolver error original del SP
        ResponseHelper.error(res, spResult?.descripcion || 'Credenciales inválidas', 401);
        return;
      }
    }

    // Extraer datos del usuario desde el campo data
    const userData = spResult.data;

    // Parsear Contratos si viene como string
    let contratos = [];
    try {
      contratos = typeof userData.Contratos === 'string'
        ? JSON.parse(userData.Contratos)
        : userData.Contratos || [];
    } catch (e) {
      console.error('Error parseando contratos:', e);
      contratos = [];
    }

    // Generar tokens JWT
    const accessToken = jwt.sign(
      {
        id: userData.ID_User,
        nombre: userData.Nombre,
        organismo: userData.ID_Organismo
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    const refreshToken = jwt.sign(
      { id: userData.ID_User },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );

    // Formatear respuesta como el frontend espera
    const response = {
      estado: 1,
      mensaje: 'Login exitoso',
      datos: {
        ID_User: userData.ID_User,
        Nombre: userData.Nombre,
        Apellido: userData.Apellido,
        ID_Organismo: userData.ID_Organismo,
        Nombre_Organismo: userData.Nombre_Organismo || '',
        Cargo_Funcion: userData.Cargo_Funcion || '',
        Contratos: contratos
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };

    // Enviar respuesta directamente sin wrapper adicional
    res.json(response);
  };

  /**
   * @swagger
   * /api/v2/auth/refresh:
   *   post:
   *     summary: Refrescar token de acceso
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refrescado exitosamente
   */
  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        ResponseHelper.error(res, 'Refresh token requerido', 400);
        return;
      }

      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      // Si usamos JWT, verificar que el token esté en la BD
      if (this.useJwtAuth) {
        const [users] = await this.databaseService.executeQuery(`
          SELECT id FROM usuarios WHERE id = ? AND refresh_token = ?
        `, [decoded.id, refreshToken]);

        if (!users || users.length === 0) {
          ResponseHelper.error(res, 'Token inválido', 401);
          return;
        }
      }

      // Generar nuevo access token
      const accessToken = jwt.sign(
        { id: decoded.id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as SignOptions
      );

      ResponseHelper.success(res, { accessToken });
    } catch (error) {
      console.error('Error al refrescar token:', error);
      ResponseHelper.error(res, 'Token inválido', 401);
    }
  };

  /**
   * @swagger
   * /api/v2/auth/logout:
   *   post:
   *     summary: Cerrar sesión
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Sesión cerrada exitosamente
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      // Si usamos JWT, limpiar el refresh token de la BD
      if (this.useJwtAuth && userId) {
        await this.databaseService.executeQuery(`
          UPDATE usuarios SET refresh_token = NULL WHERE id = ?
        `, [userId]);
      }

      ResponseHelper.success(res, { mensaje: 'Sesión cerrada exitosamente' });
    } catch (error) {
      console.error('Error en logout:', error);
      ResponseHelper.error(res, 'Error al cerrar sesión');
    }
  };

  /**
   * @swagger
   * /api/v2/auth/me:
   *   get:
   *     summary: Obtener usuario actual
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Datos del usuario actual
   */
  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        ResponseHelper.error(res, 'Usuario no autenticado', 401);
        return;
      }

      if (this.useJwtAuth) {
        // Obtener de tabla usuarios
        const [users] = await this.databaseService.executeQuery(`
          SELECT id, email, nombre, apellido, rol, es_super_usuario, activo, email_verificado
          FROM usuarios WHERE id = ?
        `, [userId]);

        if (!users || users.length === 0) {
          ResponseHelper.error(res, 'Usuario no encontrado', 404);
          return;
        }

        const user = users[0];
        ResponseHelper.success(res, {
          ID_User: user.id,
          Email: user.email,
          Nombre: user.nombre,
          Apellido: user.apellido,
          Rol: user.rol,
          isSuperUser: user.es_super_usuario === 1
        });
      } else {
        // Usar SP tradicional
        const result = await this.databaseService.executeStoredProcedure('GetUserById', {
          id: userId
        });

        if (!result || result.length === 0) {
          ResponseHelper.error(res, 'Usuario no encontrado', 404);
          return;
        }

        ResponseHelper.success(res, result[0]);
      }
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      ResponseHelper.error(res, 'Error al obtener datos del usuario');
    }
  };
}