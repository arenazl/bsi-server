import { Router } from 'express';
import archivoController from '../controllers/ArchivoController';

const router = Router();

/**
 * @swagger
 * /api/archivos/subir:
 *   post:
 *     summary: Subir archivo al sistema
 *     description: Sube un archivo al sistema para ser procesado. Acepta archivos TXT, CSV, Excel (.xlsx, .xls)
 *     tags: [Archivos]
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
 *                 description: 'Archivo a subir (TXT, CSV, Excel). Nombre debe seguir formato: TIPO-USERID-ORGANISOID-CONTRATOID-CONCEPTO-FECHA.ext'
 *               tipoModulo:
 *                 type: string
 *                 enum: [NOMINA, PAGO, CUENTA]
 *                 description: 'Tipo de módulo (opcional, se detecta automáticamente del nombre)'
 *     responses:
 *       200:
 *         description: Archivo subido exitosamente
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
 *                   example: 'Archivo subido exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/Archivo'
 *       400:
 *         description: Error en el archivo o formato inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Formato de archivo no válido'
 *               error:
 *                 code: 'INVALID_FILE_FORMAT'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       413:
 *         description: Archivo demasiado grande
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/subir', archivoController.subir.bind(archivoController));

/**
 * @swagger
 * /api/archivos/validar-insertar:
 *   post:
 *     summary: Validar e insertar archivo según tipo de módulo
 *     description: Valida y procesa un archivo previamente subido según su tipo de módulo (NOMINA, PAGO, CUENTA)
 *     tags: [Archivos]
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
 *                 description: 'Archivo a procesar'
 *               contrato:
 *                 type: string
 *                 description: 'ID del contrato (opcional, se extrae del nombre)'
 *               organismo:
 *                 type: string
 *                 description: 'ID del organismo (opcional, se extrae del nombre)'
 *     responses:
 *       200:
 *         description: Archivo validado e insertado exitosamente
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
 *                   example: 'Archivo procesado correctamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     archivoId:
 *                       type: integer
 *                       example: 123
 *                     registrosProcesados:
 *                       type: integer
 *                       example: 150
 *                     registrosConError:
 *                       type: integer
 *                       example: 2
 *                     errores:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           linea:
 *                             type: integer
 *                             example: 5
 *                           error:
 *                             type: string
 *                             example: 'CBU inválido'
 *       400:
 *         description: Error en validación del archivo
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
 *                   example: 'Error en formato de archivo'
 *                 sugerencias:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Verificar formato NOMINA', 'Revisar estructura de columnas']
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/validar-insertar', archivoController.validarInsertar.bind(archivoController));

/**
 * @swagger
 * /api/archivos/POST_VALIDATE_INSERT:
 *   post:
 *     summary: Validar e insertar archivo (ruta legacy)
 *     description: Ruta legacy para compatibilidad con versiones anteriores. Equivalente a /validar-insertar
 *     tags: [Archivos]
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
 *     responses:
 *       200:
 *         description: Archivo procesado exitosamente
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
 *                   example: 'Archivo procesado correctamente'
 *       400:
 *         description: Error en procesamiento
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/POST_VALIDATE_INSERT', archivoController.validarInsertar.bind(archivoController));

/**
 * @swagger
 * /api/archivos/{id}/descargar:
 *   get:
 *     summary: Descargar archivo procesado
 *     description: Descarga un archivo que ha sido procesado por el sistema
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del archivo a descargar
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       200:
 *         description: Archivo descargado exitosamente
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *           text/plain:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Nombre del archivo
 *             schema:
 *               type: string
 *               example: 'attachment; filename="archivo_procesado.txt"'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/descargar', archivoController.descargar.bind(archivoController));

/**
 * @swagger
 * /api/archivos/{id}/estado:
 *   get:
 *     summary: Obtener estado de procesamiento del archivo
 *     description: Consulta el estado actual de procesamiento de un archivo específico
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del archivo
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       200:
 *         description: Estado obtenido exitosamente
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
 *                   example: 'Estado obtenido exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     archivo:
 *                       $ref: '#/components/schemas/Archivo'
 *                     progreso:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 100
 *                       example: 75
 *                       description: 'Porcentaje de progreso del procesamiento'
 *                     tiempoEstimado:
 *                       type: integer
 *                       example: 120
 *                       description: 'Tiempo estimado restante en segundos'
 *                       nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:id/estado', archivoController.obtenerEstado.bind(archivoController));

/**
 * @swagger
 * /api/archivos/historial:
 *   get:
 *     summary: Listar historial de archivos
 *     description: Obtiene el historial paginado de archivos subidos por el usuario o la organización
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: tipoModulo
 *         in: query
 *         description: Filtrar por tipo de módulo
 *         required: false
 *         schema:
 *           type: string
 *           enum: [NOMINA, PAGO, CUENTA]
 *       - name: estado
 *         in: query
 *         description: Filtrar por estado
 *         required: false
 *         schema:
 *           type: string
 *           enum: [SUBIDO, PROCESANDO, PROCESADO, ERROR]
 *       - name: fechaDesde
 *         in: query
 *         description: Filtrar desde fecha (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: '2024-01-01'
 *       - name: fechaHasta
 *         in: query
 *         description: Filtrar hasta fecha (YYYY-MM-DD)
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: '2024-12-31'
 *     responses:
 *       200:
 *         description: Historial obtenido exitosamente
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
 *                   example: 'Historial obtenido exitosamente'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Archivo'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/historial', archivoController.historial.bind(archivoController));

/**
 * @swagger
 * /api/archivos/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de archivos
 *     description: Obtiene estadísticas de procesamiento de archivos por usuario/organización
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: periodo
 *         in: query
 *         description: Período de tiempo para las estadísticas
 *         required: false
 *         schema:
 *           type: string
 *           enum: [dia, semana, mes, trimestre, año]
 *           default: mes
 *       - name: organismoId
 *         in: query
 *         description: ID del organismo (solo administradores)
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *                   example: 'Estadísticas obtenidas exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/ArchivoEstadisticas'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/estadisticas', archivoController.estadisticas.bind(archivoController));

/**
 * @swagger
 * /api/archivos/{id}/reprocesar:
 *   post:
 *     summary: Reprocesar archivo que falló
 *     description: Vuelve a procesar un archivo que falló en su procesamiento inicial
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del archivo a reprocesar
 *         schema:
 *           type: integer
 *           example: 123
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forzarReproceso:
 *                 type: boolean
 *                 default: false
 *                 description: 'Forzar reproceso aunque no haya fallado'
 *               validarSoloErrores:
 *                 type: boolean
 *                 default: false
 *                 description: 'Procesar solo registros que tuvieron errores'
 *     responses:
 *       200:
 *         description: Reprocesamiento iniciado exitosamente
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
 *                   example: 'Reprocesamiento iniciado exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     procesoId:
 *                       type: string
 *                       example: 'proceso_123_20240115'
 *                     estadoAnterior:
 *                       type: string
 *                       example: 'ERROR'
 *                     nuevoEstado:
 *                       type: string
 *                       example: 'PROCESANDO'
 *       400:
 *         description: Archivo no puede ser reprocesado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'El archivo no puede ser reprocesado'
 *               error:
 *                 code: 'CANNOT_REPROCESS'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/reprocesar', archivoController.reprocesar.bind(archivoController));

/**
 * @swagger
 * /api/archivos/{id}:
 *   delete:
 *     summary: Eliminar archivo (lógicamente)
 *     description: Realiza una eliminación lógica del archivo, marcándolo como eliminado pero conservando el registro
 *     tags: [Archivos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del archivo a eliminar
 *         schema:
 *           type: integer
 *           example: 123
 *     responses:
 *       200:
 *         description: Archivo eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: 'Archivo eliminado exitosamente'
 *               data:
 *                 archivoId: 123
 *                 fechaEliminacion: '2024-01-15T10:30:00Z'
 *       400:
 *         description: Archivo no puede ser eliminado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'El archivo está siendo procesado y no puede eliminarse'
 *               error:
 *                 code: 'CANNOT_DELETE_PROCESSING'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id', archivoController.eliminar.bind(archivoController));

export default router;