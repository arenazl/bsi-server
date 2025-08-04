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

/**
 * @swagger
 * /api/cuentas/metadata/{tipoMetadata}:
 *   get:
 *     summary: Obtener metadata para UI de cuentas
 *     description: Obtiene la configuración de metadatos para la interfaz de gestión de cuentas bancarias
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tipoMetadata
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [LIST, GRID, FORM, DETAIL]
 *     responses:
 *       200:
 *         description: Metadata obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetadataUI'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/metadata/:tipoMetadata', asyncHandler(cuentaController.obtenerMetadata));

/**
 * @swagger
 * /api/cuentas/procesar-excel:
 *   post:
 *     summary: Procesar archivo Excel de cuentas
 *     description: Procesa un archivo Excel con datos de cuentas bancarias para alta masiva
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 'Archivo Excel con formato: CUENTA-USERID-ORGANISOID-CONTRATOID-ROTULO-ENTE.xlsx'
 *     responses:
 *       200:
 *         description: Excel procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: integer
 *                   enum: [0, 1]
 *                   example: 1
 *                 descripcion:
 *                   type: string
 *                   example: 'Cuentas procesadas correctamente'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/procesar-excel', upload.single('file'), asyncHandler(cuentaController.procesarExcel));

/**
 * @swagger
 * /api/cuentas/validar-insertar:
 *   post:
 *     summary: Validar e insertar datos de cuentas desde JSON
 *     description: Valida e inserta datos de cuentas bancarias proporcionados en formato JSON
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cuentas
 *             properties:
 *               cuentas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cuil:
 *                       type: string
 *                       pattern: '^[0-9]{11}$'
 *                     cbu:
 *                       type: string
 *                       pattern: '^[0-9]{22}$'
 *                     nombre:
 *                       type: string
 *                     banco:
 *                       type: string
 *                     tipoCuenta:
 *                       type: string
 *                       enum: [CAJA_AHORRO, CUENTA_CORRIENTE]
 *     responses:
 *       201:
 *         description: Cuentas validadas e insertadas exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/validar-insertar', asyncHandler(cuentaController.validarInsertar));

/**
 * @swagger
 * /api/cuentas:
 *   get:
 *     summary: Listar cuentas con filtros
 *     description: Obtiene una lista paginada de cuentas bancarias
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: estado
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ACTIVA, INACTIVA, BLOQUEADA]
 *       - name: banco
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de cuentas obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Cuenta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', asyncHandler(cuentaController.listar));

/**
 * @swagger
 * /api/cuentas/{id}:
 *   get:
 *     summary: Obtener detalle de cuenta específica
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cuenta obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cuenta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', asyncHandler(cuentaController.obtener));

/**
 * @swagger
 * /api/cuentas/generar-alta-masiva:
 *   post:
 *     summary: Generar archivo de alta masiva
 *     description: Genera un archivo para realizar alta masiva de cuentas en el banco
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cuentaIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               formato:
 *                 type: string
 *                 enum: [TXT, CSV, EXCEL]
 *                 default: TXT
 *     responses:
 *       200:
 *         description: Archivo generado exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/generar-alta-masiva', asyncHandler(cuentaController.generarAltaMasiva));

/**
 * @swagger
 * /api/cuentas/estado/{id}:
 *   get:
 *     summary: Obtener estado de procesamiento
 *     description: Obtiene el estado actual de procesamiento de una cuenta
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cuenta:
 *                   $ref: '#/components/schemas/Cuenta'
 *                 estado:
 *                   type: string
 *                 fechaUltmaActualizacion:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/estado/:id', asyncHandler(cuentaController.obtenerEstado));

export default router;