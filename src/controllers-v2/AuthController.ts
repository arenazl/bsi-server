import { Request, Response } from 'express';
import { DatabaseService } from '@services-v2/DatabaseService';
import ResponseHelper from '@utils/responseHelper';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '@config/index';

export class AuthController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
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
        ResponseHelper.error(res, spResult?.descripcion || 'Credenciales inválidas', 401);
        return;
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
    } catch (error) {
      console.error('Error en login:', error);
      ResponseHelper.error(res, 'Error al iniciar sesión');
    }
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
      // En una implementación real, aquí podrías invalidar el token
      // guardándolo en una blacklist en Redis o base de datos
      
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

      // Obtener datos del usuario
      const result = await this.databaseService.executeStoredProcedure('GetUserById', {
        id: userId
      });

      if (!result || result.length === 0) {
        ResponseHelper.error(res, 'Usuario no encontrado', 404);
        return;
      }

      ResponseHelper.success(res, result[0]);
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      ResponseHelper.error(res, 'Error al obtener datos del usuario');
    }
  };
}