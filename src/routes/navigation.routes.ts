import { Router } from 'express';
import { NavigationController } from '@controllers/NavigationController';
import { authenticateToken } from '@middleware/auth';
import { asyncHandler } from '@utils/asyncHandler';

const router = Router();
const navigationController = new NavigationController();

/**
 * @swagger
 * tags:
 *   name: Navigation
 *   description: Sistema de navegación dinámica
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener menú principal
router.get('/menu', asyncHandler(navigationController.getMainMenu));

// Obtener configuración de pagos múltiples
router.get('/pagos-multiples', asyncHandler(navigationController.getPagosMultiplesConfig));

// Obtener árbol de navegación completo
router.get('/tree', asyncHandler(navigationController.getNavigationTree));

// Obtener configuración de un módulo específico
router.get('/config/:module', asyncHandler(navigationController.getModuleConfig));

// Registrar acceso a una pantalla
router.post('/log', asyncHandler(navigationController.logAccess));

export default router;