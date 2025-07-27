import { Router } from 'express';
import { AuthController } from '@controllers/AuthController';
import { authenticateToken } from '@middleware/auth';
import { asyncHandler } from '@utils/asyncHandler';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de sesiones
 */

// Rutas públicas (sin autenticación)
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);
router.post('/logout', asyncHandler(authController.logout));
router.get('/me', asyncHandler(authController.getCurrentUser));

export default router;