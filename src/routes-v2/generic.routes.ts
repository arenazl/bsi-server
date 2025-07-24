import { Router } from 'express';
import { GenericController } from '@controllers-v2/GenericController';
import { authenticateToken } from '@middleware/auth';
import { asyncHandler } from '@utils/asyncHandler';

const router = Router();
const genericController = new GenericController();

/**
 * @swagger
 * tags:
 *   name: Generic
 *   description: Endpoints genéricos para ejecución de stored procedures
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Ejecutar stored procedure de selección
router.post('/execute-select', asyncHandler(genericController.postSelectGenericSP));

// Ejecutar stored procedure de inserción
router.post('/execute-insert', asyncHandler(genericController.postInsertGenericSP));

// Obtener metadata para UI
router.get('/metadata/:tipomodulo/:tipometada/:contrato', asyncHandler(genericController.getMetadataUI));

// Obtener resumen de UI
router.get('/resumen/:tipomodulo/:id', asyncHandler(genericController.getUIResumen));

export default router;