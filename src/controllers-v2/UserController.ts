import { Request, Response } from 'express';
import { DatabaseService } from '@services-v2/DatabaseService';
import { ResponseHelper } from '@utils/responseHelper';
// import bcrypt from 'bcryptjs'; // Removido - sistema legacy usa passwords en texto plano

export class UserController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * @swagger
   * /api/v2/usuarios:
   *   get:
   *     summary: Obtener lista de usuarios
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de usuarios
   */
  public listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.databaseService.executeStoredProcedure('GetAllUsers', {});
      
      responseHelper.success(res, result);
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      responseHelper.error(res, 'Error al obtener usuarios');
    }
  };

  /**
   * @swagger
   * /api/v2/usuarios/{id}:
   *   get:
   *     summary: Obtener usuario por ID
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Datos del usuario
   *       404:
   *         description: Usuario no encontrado
   */
  public obtenerPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.databaseService.executeStoredProcedure('GetUserById', {
        id: parseInt(id)
      });

      if (!result || result.length === 0) {
        responseHelper.error(res, 'Usuario no encontrado', 404);
        return;
      }

      responseHelper.success(res, result[0]);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      responseHelper.error(res, 'Error al obtener usuario');
    }
  };

  /**
   * @swagger
   * /api/v2/usuarios:
   *   post:
   *     summary: Crear nuevo usuario
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nombre
   *               - apellido
   *               - email
   *               - password
   *               - id_organismo
   *             properties:
   *               nombre:
   *                 type: string
   *               apellido:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               id_organismo:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Usuario creado exitosamente
   */
  public crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData = req.body;

      // NO hacer hash - el sistema legacy usa passwords en texto plano
      // Mantener compatibilidad con sp_login_user

      const result = await this.databaseService.executeJsonInsert('InsertUser', userData);

      responseHelper.success(res, result, 201);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      responseHelper.error(res, 'Error al crear usuario');
    }
  };

  /**
   * @swagger
   * /api/v2/usuarios/{id}:
   *   put:
   *     summary: Actualizar usuario
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               nombre:
   *                 type: string
   *               apellido:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               id_organismo:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Usuario actualizado exitosamente
   */
  public actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userData = {
        ...req.body,
        id: parseInt(id)
      };

      // NO hacer hash - el sistema legacy usa passwords en texto plano
      // Mantener compatibilidad con sp_login_user

      const result = await this.databaseService.executeJsonInsert('UpdateUser', userData);

      responseHelper.success(res, result);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      responseHelper.error(res, 'Error al actualizar usuario');
    }
  };

  /**
   * @swagger
   * /api/v2/usuarios/{id}:
   *   delete:
   *     summary: Eliminar usuario
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Usuario eliminado exitosamente
   */
  public eliminar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.databaseService.executeSpJsonReturn('DeleteUser', {
        id: parseInt(id)
      });

      responseHelper.success(res, { mensaje: 'Usuario eliminado exitosamente', result });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      responseHelper.error(res, 'Error al eliminar usuario');
    }
  };

  /**
   * @swagger
   * /api/v2/usuarios/{id}/contratos:
   *   get:
   *     summary: Obtener contratos del usuario
   *     tags: [Usuarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de contratos del usuario
   */
  public obtenerContratos = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.databaseService.executeStoredProcedure('GetUserContracts', {
        userId: parseInt(id)
      });

      responseHelper.success(res, result);
    } catch (error) {
      console.error('Error al obtener contratos del usuario:', error);
      responseHelper.error(res, 'Error al obtener contratos');
    }
  };
}