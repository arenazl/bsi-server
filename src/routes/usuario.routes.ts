import { Router } from 'express';
import { UserController } from '@controllers/UserController';
import { authenticateToken } from '@middleware/auth';
import { authorize } from '@middleware/authorize';
import { asyncHandler } from '@utils/asyncHandler';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios del sistema
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Listar todos los usuarios (requiere permisos de admin)
router.get('/', authorize(['admin']), asyncHandler(userController.listar));

// Obtener usuario por ID
router.get('/:id', asyncHandler(userController.obtenerPorId));

// Crear nuevo usuario (requiere permisos de admin)
router.post('/', authorize(['admin']), asyncHandler(userController.crear));

// Actualizar usuario
router.put('/:id', authorize(['admin']), asyncHandler(userController.actualizar));

// Eliminar usuario (requiere permisos de admin)
router.delete('/:id', authorize(['admin']), asyncHandler(userController.eliminar));

// Obtener contratos del usuario
router.get('/:id/contratos', asyncHandler(userController.obtenerContratos));

export default router;