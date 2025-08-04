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

/**
 * @swagger
 * /api/navigation/menu:
 *   get:
 *     summary: Obtener menú principal
 *     description: Obtiene el menú principal del sistema según los permisos del usuario
 *     tags: [Navigation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menú obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MenuItem'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/menu', asyncHandler(navigationController.getMainMenu));

/**
 * @swagger
 * /api/navigation/pagos-multiples:
 *   get:
 *     summary: Obtener configuración de pagos múltiples
 *     tags: [Navigation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración obtenida exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pagos-multiples', asyncHandler(navigationController.getPagosMultiplesConfig));

/**
 * @swagger
 * /api/navigation/tree:
 *   get:
 *     summary: Obtener árbol de navegación completo
 *     description: Obtiene la estructura completa de navegación con permisos
 *     tags: [Navigation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Árbol de navegación obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NavigationTree'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/tree', asyncHandler(navigationController.getNavigationTree));

/**
 * @swagger
 * /api/navigation/config/{module}:
 *   get:
 *     summary: Obtener configuración de un módulo específico
 *     tags: [Navigation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: module
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Configuración del módulo obtenida exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/config/:module', asyncHandler(navigationController.getModuleConfig));

/**
 * @swagger
 * /api/navigation/log:
 *   post:
 *     summary: Registrar acceso a una pantalla
 *     description: Registra el acceso del usuario a una pantalla específica para auditoría
 *     tags: [Navigation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pantalla:
 *                 type: string
 *               accion:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Acceso registrado exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/log', asyncHandler(navigationController.logAccess));

export default router;