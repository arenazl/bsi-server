import { Router } from 'express';
import archivoController from '../controllers/ArchivoController';

const router = Router();

/**
 * @swagger
 * /api/archivos/subir:
 *   post:
 *     summary: Sube archivo de cualquier tipo
 *     tags: [Archivos]
 *     consumes:
 *       - multipart/form-data
 */
router.post('/subir', archivoController.subir.bind(archivoController));

/**
 * @swagger
 * /api/archivos/validar-insertar:
 *   post:
 *     summary: Valida e inserta archivo según tipo de módulo
 *     tags: [Archivos]
 *     consumes:
 *       - multipart/form-data
 */
router.post('/validar-insertar', archivoController.validarInsertar.bind(archivoController));

/**
 * @swagger
 * /api/archivos/POST_VALIDATE_INSERT:
 *   post:
 *     summary: Valida e inserta archivo según tipo de módulo (ruta legacy)
 *     tags: [Archivos]
 *     consumes:
 *       - multipart/form-data
 */
router.post('/POST_VALIDATE_INSERT', archivoController.validarInsertar.bind(archivoController));

/**
 * @swagger
 * /api/archivos/{id}/descargar:
 *   get:
 *     summary: Descarga archivo procesado
 *     tags: [Archivos]
 */
router.get('/:id/descargar', archivoController.descargar.bind(archivoController));

/**
 * @swagger
 * /api/archivos/{id}/estado:
 *   get:
 *     summary: Obtiene estado de procesamiento
 *     tags: [Archivos]
 */
router.get('/:id/estado', archivoController.obtenerEstado.bind(archivoController));

/**
 * @swagger
 * /api/archivos/historial:
 *   get:
 *     summary: Lista historial de archivos
 *     tags: [Archivos]
 */
router.get('/historial', archivoController.historial.bind(archivoController));

/**
 * @swagger
 * /api/archivos/estadisticas:
 *   get:
 *     summary: Obtiene estadísticas de archivos
 *     tags: [Archivos]
 */
router.get('/estadisticas', archivoController.estadisticas.bind(archivoController));

/**
 * @swagger
 * /api/archivos/{id}/reprocesar:
 *   post:
 *     summary: Reprocesa archivo que falló
 *     tags: [Archivos]
 */
router.post('/:id/reprocesar', archivoController.reprocesar.bind(archivoController));

/**
 * @swagger
 * /api/archivos/{id}:
 *   delete:
 *     summary: Elimina archivo (lógicamente)
 *     tags: [Archivos]
 */
router.delete('/:id', archivoController.eliminar.bind(archivoController));

export default router;