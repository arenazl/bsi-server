import { Router } from 'express';
import pagoController from '../controllers/PagoController';

const router = Router();

/**
 * @swagger
 * /api/pagos/metadata/{tipoMetadata}:
 *   get:
 *     summary: Obtener metadata para UI de pagos
 *     description: Obtiene la configuración de metadatos necesaria para renderizar la interfaz de usuario de pagos
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tipoMetadata
 *         in: path
 *         required: true
 *         description: Tipo de metadata a obtener
 *         schema:
 *           type: string
 *           enum: [LIST, GRID, FORM, DETAIL]
 *           example: LIST
 *       - name: contrato
 *         in: query
 *         description: ID del contrato para filtrar metadata específica
 *         required: false
 *         schema:
 *           type: string
 *           example: 'CONT001'
 *     responses:
 *       200:
 *         description: Metadata obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Metadata obtenida exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/MetadataUI'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/metadata/:tipoMetadata', pagoController.obtenerMetadata.bind(pagoController));

/**
 * @swagger
 * /api/pagos/procesar-excel:
 *   post:
 *     summary: Procesar archivo Excel de pagos
 *     description: Procesa un archivo Excel con datos de pagos. El archivo debe contener las columnas necesarias para generar pagos bancarios
 *     tags: [Pagos]
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
 *                 description: 'Archivo Excel con formato: PAGO-USERID-ORGANISOID-CONTRATOID-CONCEPTO-FECHAPAGO.xlsx'
 *               hoja:
 *                 type: string
 *                 default: 'Hoja1'
 *                 description: 'Nombre de la hoja a procesar'
 *               generarArchivoSalida:
 *                 type: boolean
 *                 default: true
 *                 description: 'Generar automáticamente archivo de salida para el banco'
 *     responses:
 *       200:
 *         description: Excel de pagos procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: integer
 *                   enum: [0, 1]
 *                   example: 1
 *                   description: '1 = éxito, 0 = error'
 *                 descripcion:
 *                   type: string
 *                   example: 'Pagos procesados correctamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagoId:
 *                       type: integer
 *                       example: 456
 *                     totalBeneficiarios:
 *                       type: integer
 *                       example: 150
 *                     importeTotal:
 *                       type: number
 *                       format: decimal
 *                       example: 22500000.75
 *                     archivoGenerado:
 *                       type: string
 *                       example: 'PAGO_CONT001_20240115.txt'
 *                       nullable: true
 *       400:
 *         description: Error en procesamiento del Excel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: integer
 *                   example: 0
 *                 descripcion:
 *                   type: string
 *                   example: 'Error en archivo Excel: columnas requeridas no encontradas'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/procesar-excel', pagoController.procesarExcel.bind(pagoController));

/**
 * @swagger
 * /api/pagos/validar-insertar:
 *   post:
 *     summary: Validar e insertar datos de pago desde JSON
 *     description: Valida e inserta un conjunto de registros de pago proporcionados en formato JSON
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registros
 *               - contrato
 *               - concepto
 *               - fechaPago
 *             properties:
 *               registros:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - cuil
 *                     - nombre
 *                     - cbu
 *                     - importe
 *                   properties:
 *                     cuil:
 *                       type: string
 *                       pattern: '^[0-9]{11}$'
 *                       example: '20123456789'
 *                     nombre:
 *                       type: string
 *                       example: 'Juan Pérez'
 *                     cbu:
 *                       type: string
 *                       pattern: '^[0-9]{22}$'
 *                       example: '1234567890123456789012'
 *                     importe:
 *                       type: number
 *                       format: decimal
 *                       example: 150000.50
 *               contrato:
 *                 type: string
 *                 example: 'CONT001'
 *               concepto:
 *                 type: string
 *                 example: 'SUELDO'
 *               fechaPago:
 *                 type: string
 *                 format: date
 *                 example: '2024-01-15'
 *               generarArchivo:
 *                 type: boolean
 *                 default: false
 *                 description: 'Generar automáticamente archivo de salida'
 *     responses:
 *       201:
 *         description: Datos validados e insertados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: integer
 *                   example: 1
 *                 descripcion:
 *                   type: string
 *                   example: 'Pagos validados e insertados correctamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     pagoId:
 *                       type: integer
 *                       example: 456
 *                     totalRegistros:
 *                       type: integer
 *                       example: 150
 *                     registrosValidados:
 *                       type: integer
 *                       example: 148
 *                     registrosConError:
 *                       type: integer
 *                       example: 2
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/validar-insertar', pagoController.validarInsertar.bind(pagoController));

/**
 * @swagger
 * /api/pagos/generar-archivo:
 *   post:
 *     summary: Generar archivo de salida para pagos
 *     description: Genera un archivo de salida en formato bancario para procesar los pagos seleccionados
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PagoGenerarArchivoRequest'
 *     responses:
 *       200:
 *         description: Archivo generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Archivo generado exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     nombreArchivo:
 *                       type: string
 *                       example: 'PAGO_CONT001_20240115.txt'
 *                     rutaArchivo:
 *                       type: string
 *                       example: '/uploads/generated/PAGO_CONT001_20240115.txt'
 *                     tamano:
 *                       type: integer
 *                       example: 1024576
 *                       description: 'Tamaño del archivo en bytes'
 *                     cantidadRegistros:
 *                       type: integer
 *                       example: 150
 *                     importeTotal:
 *                       type: number
 *                       format: decimal
 *                       example: 22500000.75
 *                     formato:
 *                       type: string
 *                       example: 'TXT'
 *                     fechaGeneracion:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:30:00Z'
 *       400:
 *         description: Error en generación del archivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'No se encontraron pagos para el ID especificado'
 *               error:
 *                 code: 'NO_PAYMENTS_FOUND'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/generar-archivo', pagoController.generarArchivo.bind(pagoController));

/**
 * @swagger
 * /api/pagos/enviar-ftp:
 *   post:
 *     summary: Enviar archivo de pago por FTP
 *     description: Envía un archivo de pagos generado al servidor FTP del banco para su procesamiento
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pagoId
 *               - nombreArchivo
 *             properties:
 *               pagoId:
 *                 type: string
 *                 example: '456'
 *                 description: 'ID del pago a enviar'
 *               nombreArchivo:
 *                 type: string
 *                 example: 'PAGO_CONT001_20240115.txt'
 *                 description: 'Nombre del archivo a enviar'
 *               servidorFtp:
 *                 type: string
 *                 example: 'ftp.banco.com'
 *                 description: 'Servidor FTP (opcional, usa configuración por defecto)'
 *               confirmarEnvio:
 *                 type: boolean
 *                 default: true
 *                 description: 'Confirmar recepción del archivo'
 *     responses:
 *       200:
 *         description: Archivo enviado exitosamente por FTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Archivo enviado exitosamente por FTP'
 *                 data:
 *                   type: object
 *                   properties:
 *                     nombreArchivo:
 *                       type: string
 *                       example: 'PAGO_CONT001_20240115.txt'
 *                     servidorFtp:
 *                       type: string
 *                       example: 'ftp.banco.com'
 *                     fechaEnvio:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:30:00Z'
 *                     estadoTransmision:
 *                       type: string
 *                       example: 'ENVIADO'
 *                     numeroTransaccion:
 *                       type: string
 *                       example: 'TX20240115103000456'
 *       400:
 *         description: Error en envío FTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Error de conexión FTP'
 *               error:
 *                 code: 'FTP_CONNECTION_ERROR'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/enviar-ftp', pagoController.enviarFtp.bind(pagoController));

/**
 * @swagger
 * /api/pagos:
 *   get:
 *     summary: Listar pagos con filtros
 *     description: Obtiene una lista paginada de pagos con filtros opcionales por organismo, contrato, estado, etc.
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: organismo
 *         in: query
 *         description: ID del organismo
 *         required: false
 *         schema:
 *           type: string
 *           example: '1'
 *       - name: contrato
 *         in: query
 *         description: ID o código del contrato
 *         required: false
 *         schema:
 *           type: string
 *           example: 'CONT001'
 *       - name: estado
 *         in: query
 *         description: Estado del pago
 *         required: false
 *         schema:
 *           type: string
 *           enum: [PENDIENTE, PROCESADO, ENVIADO, ERROR]
 *       - name: concepto
 *         in: query
 *         description: Concepto del pago
 *         required: false
 *         schema:
 *           type: string
 *           example: 'SUELDO'
 *       - name: fechaDesde
 *         in: query
 *         description: Fecha desde para filtrar
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: '2024-01-01'
 *       - name: fechaHasta
 *         in: query
 *         description: Fecha hasta para filtrar
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: '2024-12-31'
 *     responses:
 *       200:
 *         description: Lista de pagos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Pagos obtenidos exitosamente'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pago'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 resumen:
 *                   type: object
 *                   properties:
 *                     totalPagos:
 *                       type: integer
 *                       example: 25
 *                     importeTotal:
 *                       type: number
 *                       format: decimal
 *                       example: 562500000.75
 *                     pagosPorEstado:
 *                       type: object
 *                       properties:
 *                         PENDIENTE:
 *                           type: integer
 *                           example: 5
 *                         PROCESADO:
 *                           type: integer
 *                           example: 15
 *                         ENVIADO:
 *                           type: integer
 *                           example: 5
 *                         ERROR:
 *                           type: integer
 *                           example: 0
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', pagoController.listar.bind(pagoController));

/**
 * @swagger
 * /api/pagos/estado:
 *   get:
 *     summary: Obtener estado general de pagos
 *     description: Obtiene un resumen del estado general del sistema de pagos
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: organismoId
 *         in: query
 *         description: ID del organismo (opcional para filtrar)
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Estado general obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Estado general obtenido exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     resumenGeneral:
 *                       type: object
 *                       properties:
 *                         totalPagos:
 *                           type: integer
 *                           example: 150
 *                         importeTotalPendiente:
 *                           type: number
 *                           format: decimal
 *                           example: 112500000.50
 *                         importeTotalProcesado:
 *                           type: number
 *                           format: decimal
 *                           example: 450000000.25
 *                     estadoPorContrato:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           contrato:
 *                             type: string
 *                             example: 'CONT001'
 *                           totalPagos:
 *                             type: integer
 *                             example: 50
 *                           importeTotal:
 *                             type: number
 *                             format: decimal
 *                             example: 187500000.25
 *                           estado:
 *                             type: string
 *                             example: 'PROCESADO'
 *                     ultimaActividad:
 *                       type: string
 *                       format: date-time
 *                       example: '2024-01-15T10:30:00Z'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/estado', pagoController.obtenerEstado.bind(pagoController));

/**
 * @swagger
 * /api/pagos/{id}:
 *   get:
 *     summary: Obtener detalle de un pago específico
 *     description: Obtiene el detalle completo de un pago específico incluyendo beneficiarios y estado de procesamiento
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del pago
 *         schema:
 *           type: string
 *           example: '456'
 *       - name: incluirBeneficiarios
 *         in: query
 *         description: Incluir lista de beneficiarios
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: limiteBeneficiarios
 *         in: query
 *         description: Límite de beneficiarios a mostrar
 *         required: false
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *     responses:
 *       200:
 *         description: Detalle del pago obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Detalle del pago obtenido exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     pago:
 *                       $ref: '#/components/schemas/Pago'
 *                     estadisticas:
 *                       type: object
 *                       properties:
 *                         totalBeneficiarios:
 *                           type: integer
 *                           example: 150
 *                         importePromedio:
 *                           type: number
 *                           format: decimal
 *                           example: 150000.50
 *                         beneficiariosProcesados:
 *                           type: integer
 *                           example: 148
 *                         beneficiariosConError:
 *                           type: integer
 *                           example: 2
 *                     archivos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nombreArchivo:
 *                             type: string
 *                             example: 'PAGO_CONT001_20240115.txt'
 *                           fechaGeneracion:
 *                             type: string
 *                             format: date-time
 *                           tamano:
 *                             type: integer
 *                           estadoEnvio:
 *                             type: string
 *                             enum: [GENERADO, ENVIADO, CONFIRMADO, ERROR]
 *                     beneficiarios:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cuil:
 *                             type: string
 *                             example: '20123456789'
 *                           nombre:
 *                             type: string
 *                             example: 'Juan Pérez'
 *                           cbu:
 *                             type: string
 *                             example: '1234567890123456789012'
 *                           importe:
 *                             type: number
 *                             format: decimal
 *                             example: 150000.50
 *                           estado:
 *                             type: string
 *                             enum: [VALIDADO, ERROR, PROCESADO]
 *                       description: 'Solo incluido si incluirBeneficiarios=true'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', pagoController.obtenerDetalle.bind(pagoController));

export default router;