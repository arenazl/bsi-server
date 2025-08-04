import { Router } from 'express';
import GenericController from '@controllers/GenericController';
import { authenticateToken } from '@middleware/auth';
import { asyncHandler } from '@utils/asyncHandler';

const router = Router();
const genericController = GenericController;

/**
 * @swagger
 * tags:
 *   name: Generic
 *   description: Endpoints genéricos para ejecución de stored procedures
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

/**
 * @swagger
 * /api/generic/execute-select:
 *   post:
 *     summary: Ejecutar stored procedure de selección
 *     description: Ejecuta un stored procedure de consulta (SELECT) de forma genérica
 *     tags: [Generic]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoredProcedureRequest'
 *     responses:
 *       200:
 *         description: Stored procedure ejecutado exitosamente
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
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/execute-select', asyncHandler(genericController.postSelectGenericSP));

/**
 * @swagger
 * /api/generic/execute-insert:
 *   post:
 *     summary: Ejecutar stored procedure de inserción
 *     description: Ejecuta un stored procedure de modificación (INSERT/UPDATE/DELETE) de forma genérica
 *     tags: [Generic]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoredProcedureRequest'
 *     responses:
 *       200:
 *         description: Stored procedure ejecutado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 affectedRows:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/execute-insert', asyncHandler(genericController.postInsertGenericSP));

/**
 * @swagger
 * /api/generic/metadata/{tipomodulo}/{tipometada}/{contrato}:
 *   get:
 *     summary: Obtener metadata para UI
 *     description: Obtiene configuración de metadatos para renderizar interfaces de usuario dinámicas
 *     tags: [Generic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tipomodulo
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NOMINA, PAGO, CUENTA]
 *       - name: tipometada
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [LIST, GRID, FORM, DETAIL]
 *       - name: contrato
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metadata obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetadataUI'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/metadata/:tipomodulo/:tipometada/:contrato', asyncHandler(genericController.getMetadataUI));

/**
 * @swagger
 * /api/generic/resumen/{tipomodulo}/{id}:
 *   get:
 *     summary: Obtener resumen de UI
 *     description: Obtiene un resumen de datos para mostrar en interfaces de usuario
 *     tags: [Generic]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tipomodulo
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NOMINA, PAGO, CUENTA]
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resumen obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: 'Datos del resumen (estructura variable según el módulo)'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/resumen/:tipomodulo/:id', asyncHandler(genericController.getUIResumen));

export default router;