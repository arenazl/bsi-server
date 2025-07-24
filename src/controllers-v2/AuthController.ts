import { Request, Response } from 'express';
import { DatabaseService } from '@services-v2/DatabaseService';
import { ResponseHelper } from '@utils/responseHelper';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
        responseHelper.error(res, 'Credenciales inválidas', 401);
        return;
      }

      const user = result[0];

      // Generar tokens JWT
      const accessToken = jwt.sign(
        { 
          id: user.ID_User,
          nombre: user.Nombre,
          organismo: user.ID_Organismo
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      const refreshToken = jwt.sign(
        { id: user.ID_User },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      // Formatear respuesta como el frontend espera
      const response = {
        estado: 1,
        mensaje: 'Login exitoso',
        datos: {
          ID_User: user.ID_User,
          Nombre: user.Nombre,
          Apellido: user.Apellido,
          ID_Organismo: user.ID_Organismo,
          Contratos: user.Contratos || []
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };

      responseHelper.success(res, response);
    } catch (error) {
      console.error('Error en login:', error);
      responseHelper.error(res, 'Error al iniciar sesión');
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
        responseHelper.error(res, 'Refresh token requerido', 400);
        return;
      }

      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      // Generar nuevo access token
      const accessToken = jwt.sign(
        { id: decoded.id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      responseHelper.success(res, { accessToken });
    } catch (error) {
      console.error('Error al refrescar token:', error);
      responseHelper.error(res, 'Token inválido', 401);
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
      
      responseHelper.success(res, { mensaje: 'Sesión cerrada exitosamente' });
    } catch (error) {
      console.error('Error en logout:', error);
      responseHelper.error(res, 'Error al cerrar sesión');
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
        responseHelper.error(res, 'Usuario no autenticado', 401);
        return;
      }

      // Obtener datos del usuario
      const result = await this.databaseService.executeStoredProcedure('GetUserById', {
        id: userId
      });

      if (!result || result.length === 0) {
        responseHelper.error(res, 'Usuario no encontrado', 404);
        return;
      }

      responseHelper.success(res, result[0]);
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      responseHelper.error(res, 'Error al obtener datos del usuario');
    }
  };
}