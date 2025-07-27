import { Router } from 'express';
import { CuentaController } from '@controllers/CuentaController';
import { authenticateToken } from '@middleware/auth';
import { asyncHandler } from '@utils/asyncHandler';
import multer from 'multer';

const router = Router();
const cuentaController = new CuentaController();

// Configuración de multer para upload de archivos
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * @swagger
 * tags:
 *   name: Cuentas
 *   description: Gestión de cuentas bancarias y altas masivas
 */

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener metadata para diferentes tipos de UI
router.get('/metadata/:tipoMetadata', asyncHandler(cuentaController.obtenerMetadata));

// Procesar archivo Excel de cuentas
router.post('/procesar-excel', upload.single('file'), asyncHandler(cuentaController.procesarExcel));

// Validar e insertar datos de cuentas desde JSON
router.post('/validar-insertar', asyncHandler(cuentaController.validarInsertar));

// Listar cuentas con filtros opcionales
router.get('/', asyncHandler(cuentaController.listar));

// Obtener detalle de cuenta específica
router.get('/:id', asyncHandler(cuentaController.obtener));

// Generar archivo de alta masiva
router.post('/generar-alta-masiva', asyncHandler(cuentaController.generarAltaMasiva));

// Obtener estado de procesamiento
router.get('/estado/:id', asyncHandler(cuentaController.obtenerEstado));

export default router;