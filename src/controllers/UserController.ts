import { Request, Response } from 'express';
import { DatabaseService } from '@services/DatabaseService';
import ResponseHelper from '@utils/responseHelper';
// import bcrypt from 'bcryptjs'; // Removido - sistema legacy usa passwords en texto plano

/**
 * ARCHIVO CORREGIDO - CAMBIOS REALIZADOS:
 * ========================================
 * 1. Cambiado 'id' por 'ID_USER' en todos los métodos para coincidir con la BD
 * 2. Actualizados los nombres de Stored Procedures para coincidir con los existentes:
 *    - GetAllUsers → USUARIOS_OBTENER_TODOS
 *    - GetUserById → USUARIOS_OBTENER
 *    - InsertUser → USUARIOS_CREAR
 *    - UpdateUser → USUARIOS_ACTUALIZAR
 *    - DeleteUser → USUARIOS_ELIMINAR
 * 
 * NOTA: GetUserContracts se mantiene igual - verificar si existe en BD
 */

export class UserController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  /**
   * @swagger
   * /api/usuarios:
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
      // CORREGIDO: Cambiado GetAllUsers → USUARIOS_OBTENER_TODOS
      const result = await this.databaseService.executeStoredProcedure('USUARIOS_OBTENER_TODOS', {});

      ResponseHelper.success(res, result);
    } catch (error) {
      console.error('Error al listar usuarios:', error);
      ResponseHelper.error(res, 'Error al obtener usuarios');
    }
  };

  /**
   * @swagger
   * /api/usuarios/{id}:
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

      // CORREGIDO: 
      // 1. Cambiado GetUserById → USUARIOS_OBTENER
      // 2. Cambiado 'id' → 'ID_USER' (parámetro esperado por el SP)
      const result = await this.databaseService.executeStoredProcedure('USUARIOS_OBTENER', {
        ID_USER: parseInt(id)
      });

      if (!result || result.length === 0) {
        ResponseHelper.error(res, 'Usuario no encontrado', 404);
        return;
      }

      ResponseHelper.success(res, result[0]);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      ResponseHelper.error(res, 'Error al obtener usuario');
    }
  };

  /**
   * @swagger
   * /api/usuarios:
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
      const { ID_Organismo, User_Name, CUIL, Apellido, Nombre, Telefono, Email, Cargo_Funcion, Perfil, Tipo_Estado } = req.body;

      const params = {
        p_ID_Organismo: ID_Organismo,
        p_User_Name: User_Name,
        p_CUIL: CUIL,
        p_Apellido: Apellido,
        p_Nombre: Nombre,
        p_Telefono: Telefono,
        p_Email: Email,
        p_Cargo_Funcion: Cargo_Funcion,
        p_Perfil: Perfil,
        p_Tipo_Estado: Tipo_Estado,
      };
      
      // NO hacer hash - el sistema legacy usa passwords en texto plano
      // Mantener compatibilidad con sp_login_user

      // CORREGIDO: Cambiado InsertUser → USUARIOS_CREAR

      const result = await this.databaseService.executeSpJsonReturn('USUARIOS_CREAR', params);

      ResponseHelper.success(res, result, 'Usuario creado exitosamente');
    } catch (error) {
      console.error('Error al crear usuario:', error);
      ResponseHelper.error(res, 'Error al crear usuario');
    }
  };

  /**
   * @swagger
   * /api/usuarios/{id}:
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
      const { ID_Organismo, User_Name, CUIL, Apellido, Nombre, Telefono, Email, Cargo_Funcion, Perfil, Tipo_Estado } = req.body;

      const params = {
        p_ID_USER: parseInt(id),
        p_ID_Organismo: ID_Organismo,
        p_User_Name: User_Name,
        p_CUIL: CUIL,
        p_Apellido: Apellido,
        p_Nombre: Nombre,
        p_Telefono: Telefono,
        p_Email: Email,
        p_Cargo_Funcion: Cargo_Funcion,
        p_Perfil: Perfil,
        p_Tipo_Estado: Tipo_Estado
      };

      // NO hacer hash - el sistema legacy usa passwords en texto plano
      // Mantener compatibilidad con sp_login_user

      // CORREGIDO: Cambiado UpdateUser → USUARIOS_ACTUALIZAR

      const result = await this.databaseService.executeSpJsonReturn('USUARIOS_ACTUALIZAR', params);

      ResponseHelper.success(res, result);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      ResponseHelper.error(res, 'Error al actualizar usuario');
    }
  };

  /**
   * @swagger
   * /api/usuarios/{id}:
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

      // CORREGIDO: 
      // 1. Cambiado DeleteUser → USUARIOS_ELIMINAR
      // 2. Cambiado 'id' → 'ID_USER' (parámetro esperado por el SP)
      const result = await this.databaseService.executeSpJsonReturn('USUARIOS_ELIMINAR', {
        ID_USER: parseInt(id)
      });

      ResponseHelper.success(res, { mensaje: 'Usuario eliminado exitosamente', result });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      ResponseHelper.error(res, 'Error al eliminar usuario');
    }
  };

  /**
   * @swagger
   * /api/usuarios/{id}/contratos:
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

    //Todavia no esta implementado el SP en la base de datos

    try {
      const { id } = req.params;

      // NOTA: Este SP (GetUserContracts) no fue encontrado en los scripts SQL revisados
      // Verificar si existe en la BD o si debe cambiarse por otro nombre
      // Posible alternativa: crear un nuevo SP o usar una consulta diferente
      const result = await this.databaseService.executeStoredProcedure('GetUserContracts', {
        userId: parseInt(id)
      });

      ResponseHelper.success(res, result);
    } catch (error) {
      console.error('Error al obtener contratos del usuario:', error);
      ResponseHelper.error(res, 'Error al obtener contratos');
    }
  };
}
