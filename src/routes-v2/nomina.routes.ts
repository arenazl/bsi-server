import { Router } from 'express';
import nominaController from '../controllers-v2/NominaController';

const router = Router();

/**
 * @swagger
 * /nominas/hello:
 *   get:
 *     summary: Endpoint de prueba
 *     tags: [Nominas]
 *     responses:
 *       200:
 *         description: Mensaje de prueba
 */
// router.get('/hello', nominaController.hello.bind(nominaController)); // Method doesn't exist

/**
 * @swagger
 * /nominas/metadata/{tipoMetadata}:
 *   get:
 *     summary: Obtiene metadata para renderizar UI de nóminas
 *     tags: [Nominas]
 *     parameters:
 *       - in: path
 *         name: tipoMetadata
 *         required: true
 *         schema:
 *           type: string
 *           enum: [LIST, GRID, FORM, DETAIL]
 *     responses:
 *       200:
 *         description: Metadata para renderizar UI
 */
router.get('/metadata/:tipoMetadata', nominaController.obtenerMetadata.bind(nominaController));

/**
 * @swagger
 * /nominas/procesar:
 *   post:
 *     summary: Procesa archivo TXT de nómina
 *     description: Procesa un archivo TXT con formato específico de nómina municipal. El nombre del archivo debe seguir el formato NOMINA-CONTRATO-CONCEPTO-FECHAPAGO.txt
 *     tags: [Nominas]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Archivo TXT de nómina con formato NOMINA-CONTRATO-CONCEPTO-FECHAPAGO.txt
 *     responses:
 *       200:
 *         description: Nómina procesada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: number
 *                   example: 1
 *                 descripcion:
 *                   type: string
 *                   example: "Nómina procesada correctamente"
 *                 data:
 *                   type: object
 *       400:
 *         description: Error en validación o procesamiento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estado:
 *                   type: number
 *                   example: 0
 *                 descripcion:
 *                   type: string
 *                   example: "Error en formato de archivo"
 */
router.post('/procesar', nominaController.procesar.bind(nominaController));

/**
 * @swagger
 * /nominas/procesar-excel:
 *   post:
 *     summary: Procesa archivo Excel de nómina
 *     tags: [Nominas]
 *     consumes:
 *       - multipart/form-data
 */
router.post('/procesar-excel', nominaController.procesarExcel.bind(nominaController));

/**
 * @swagger
 * /nominas/validar-insertar:
 *   post:
 *     summary: Valida e inserta datos de nómina desde JSON
 *     tags: [Nominas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
router.post('/validar-insertar', nominaController.validarInsertar.bind(nominaController));

/**
 * @swagger
 * /nominas:
 *   get:
 *     summary: Lista nóminas con filtros opcionales
 *     tags: [Nominas]
 *     parameters:
 *       - in: query
 *         name: organismo
 *         schema:
 *           type: string
 *       - in: query
 *         name: contrato
 *         schema:
 *           type: string
 */
router.get('/', nominaController.listar.bind(nominaController));

/**
 * @swagger
 * /nominas/{id}:
 *   get:
 *     summary: Obtiene resumen de una nómina específica
 *     tags: [Nominas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', nominaController.obtenerResumen.bind(nominaController));

export default router;