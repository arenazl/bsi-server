import { Router } from 'express';
import pagoController from '../controllers-v2/PagoController';

const router = Router();

/**
 * @swagger
 * /api/pagos/metadata/{tipoMetadata}:
 *   get:
 *     summary: Obtiene metadata para renderizar UI de pagos
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: tipoMetadata
 *         required: true
 *         schema:
 *           type: string
 *           enum: [LIST, GRID, FORM, DETAIL]
 */
router.get('/metadata/:tipoMetadata', pagoController.obtenerMetadata.bind(pagoController));

/**
 * @swagger
 * /api/pagos/procesar-excel:
 *   post:
 *     summary: Procesa archivo Excel de pagos
 *     tags: [Pagos]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Archivo Excel de pagos
 */
router.post('/procesar-excel', pagoController.procesarExcel.bind(pagoController));

/**
 * @swagger
 * /api/pagos/validar-insertar:
 *   post:
 *     summary: Valida e inserta datos de pago desde JSON
 *     tags: [Pagos]
 */
router.post('/validar-insertar', pagoController.validarInsertar.bind(pagoController));

/**
 * @swagger
 * /api/pagos/generar-archivo:
 *   post:
 *     summary: Genera archivo de salida para pagos procesados
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pagoId:
 *                 type: string
 *               formato:
 *                 type: string
 *                 default: TXT
 */
router.post('/generar-archivo', pagoController.generarArchivo.bind(pagoController));

/**
 * @swagger
 * /api/pagos/enviar-ftp:
 *   post:
 *     summary: Envía archivo de pago por FTP
 *     tags: [Pagos]
 */
router.post('/enviar-ftp', pagoController.enviarFtp.bind(pagoController));

/**
 * @swagger
 * /api/pagos:
 *   get:
 *     summary: Lista pagos con filtros opcionales
 *     tags: [Pagos]
 */
router.get('/', pagoController.listar.bind(pagoController));

/**
 * @swagger
 * /api/pagos/estado:
 *   get:
 *     summary: Obtiene estado general de pagos
 *     tags: [Pagos]
 */
router.get('/estado', pagoController.obtenerEstado.bind(pagoController));

/**
 * @swagger
 * /api/pagos/{id}:
 *   get:
 *     summary: Obtiene detalle de un pago específico
 *     tags: [Pagos]
 */
router.get('/:id', pagoController.obtenerDetalle.bind(pagoController));

export default router;