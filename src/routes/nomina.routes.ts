import { Router } from 'express';
import nominaController from '../controllers/NominaController';

const router = Router();

/**
 * @swagger
 * /api/nominas/metadata/{tipoMetadata}:
 *   get:
 *     summary: Obtener metadata para UI de nóminas
 *     description: Obtiene la configuración de metadatos necesaria para renderizar la interfaz de usuario de nóminas
 *     tags: [Nominas]
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
router.get('/metadata/:tipoMetadata', nominaController.obtenerMetadata.bind(nominaController));

/**
 * @swagger
 * /api/nominas/procesar:
 *   post:
 *     summary: Procesar archivo TXT de nómina
 *     description: Procesa un archivo TXT con datos de nómina siguiendo el formato específico del sistema. El archivo debe contener registros con CUIL, Nombre, CBU e Importe separados por pipes (|)
 *     tags: [Nominas]
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
 *                 description: 'Archivo TXT con formato: NOMINA-USERID-ORGANISOID-CONTRATOID-CONCEPTO-FECHAPAGO.txt'
 *               validarSolo:
 *                 type: boolean
 *                 default: false
 *                 description: 'Solo validar el archivo sin procesarlo'
 *     responses:
 *       200:
 *         description: Nómina procesada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NominaValidationResponse'
 *       400:
 *         description: Error en validación o procesamiento
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
 *                   example: 'Error en formato de archivo: se esperaban 4 columnas separadas por |'
 *                 sugerencias:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Verificar separador de columnas (|)', 'Validar formato CUIL (11 dígitos)', 'Validar formato CBU (22 dígitos)']
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       413:
 *         description: Archivo demasiado grande
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/procesar', nominaController.procesar.bind(nominaController));

/**
 * @swagger
 * /api/nominas/procesar-excel:
 *   post:
 *     summary: Procesar archivo Excel de nómina
 *     description: Procesa un archivo Excel (.xlsx o .xls) con datos de nómina. El archivo debe tener las columnas CUIL, Nombre, CBU e Importe
 *     tags: [Nominas]
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
 *                 description: 'Archivo Excel con formato: NOMINA-USERID-ORGANISOID-CONTRATOID-CONCEPTO-FECHAPAGO.xlsx'
 *               hoja:
 *                 type: string
 *                 default: 'Hoja1'
 *                 description: 'Nombre de la hoja a procesar'
 *               filaInicio:
 *                 type: integer
 *                 default: 2
 *                 description: 'Fila donde empiezan los datos (después del encabezado)'
 *     responses:
 *       200:
 *         description: Excel procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NominaValidationResponse'
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
 *                   example: 'Error en archivo Excel: columna CUIL no encontrada'
 *                 columnasEncontradas:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Nombre', 'CBU', 'Importe']
 *                 columnasRequeridas:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['CUIL', 'Nombre', 'CBU', 'Importe']
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/procesar-excel', nominaController.procesarExcel.bind(nominaController));

/**
 * @swagger
 * /api/nominas/validar-insertar:
 *   post:
 *     summary: Validar e insertar datos de nómina desde JSON
 *     description: Valida e inserta un conjunto de registros de nómina proporcionados en formato JSON
 *     tags: [Nominas]
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
 *               validarSolo:
 *                 type: boolean
 *                 default: false
 *                 description: 'Solo validar sin insertar en base de datos'
 *     responses:
 *       201:
 *         description: Datos validados e insertados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NominaValidationResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/validar-insertar', nominaController.validarInsertar.bind(nominaController));

/**
 * @swagger
 * /api/nominas:
 *   get:
 *     summary: Listar nóminas con filtros
 *     description: Obtiene una lista paginada de nóminas con filtros opcionales por organismo, contrato, estado, etc.
 *     tags: [Nominas]
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
 *         description: Estado de la nómina
 *         required: false
 *         schema:
 *           type: string
 *           enum: [VALIDADO, ERROR, PROCESADO]
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
 *         description: Lista de nóminas obtenida exitosamente
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
 *                   example: 'Nóminas obtenidas exitosamente'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Nomina'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 resumen:
 *                   type: object
 *                   properties:
 *                     totalRegistros:
 *                       type: integer
 *                       example: 150
 *                     importeTotal:
 *                       type: number
 *                       format: decimal
 *                       example: 22500000.75
 *                     registrosPorEstado:
 *                       type: object
 *                       properties:
 *                         VALIDADO:
 *                           type: integer
 *                           example: 148
 *                         ERROR:
 *                           type: integer
 *                           example: 2
 *                         PROCESADO:
 *                           type: integer
 *                           example: 0
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', nominaController.listar.bind(nominaController));

/**
 * @swagger
 * /api/nominas/{id}:
 *   get:
 *     summary: Obtener resumen de nómina específica
 *     description: Obtiene el resumen detallado de una nómina específica incluyendo estadísticas y registros relacionados
 *     tags: [Nominas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la nómina
 *         schema:
 *           type: string
 *           example: '123'
 *       - name: incluirRegistros
 *         in: query
 *         description: Incluir registros individuales en la respuesta
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: soloErrores
 *         in: query
 *         description: Solo incluir registros con errores
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Resumen de nómina obtenido exitosamente
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
 *                   example: 'Resumen de nómina obtenido exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     nomina:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 123
 *                         contrato:
 *                           type: string
 *                           example: 'CONT001'
 *                         concepto:
 *                           type: string
 *                           example: 'SUELDO'
 *                         fechaPago:
 *                           type: string
 *                           format: date
 *                           example: '2024-01-15'
 *                         estado:
 *                           type: string
 *                           example: 'PROCESADO'
 *                         fechaProceso:
 *                           type: string
 *                           format: date-time
 *                           example: '2024-01-15T10:30:00Z'
 *                         organismo:
 *                           $ref: '#/components/schemas/Organismo'
 *                     estadisticas:
 *                       type: object
 *                       properties:
 *                         totalRegistros:
 *                           type: integer
 *                           example: 150
 *                         registrosValidados:
 *                           type: integer
 *                           example: 148
 *                         registrosConError:
 *                           type: integer
 *                           example: 2
 *                         importeTotal:
 *                           type: number
 *                           format: decimal
 *                           example: 22500000.75
 *                         importePromedio:
 *                           type: number
 *                           format: decimal
 *                           example: 150000.50
 *                     registros:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Nomina'
 *                       description: 'Solo incluido si incluirRegistros=true'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id', nominaController.obtenerResumen.bind(nominaController));

export default router;