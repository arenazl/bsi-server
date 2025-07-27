import { Router } from 'express';
import organismoController from '../controllers/OrganismoController';

const router = Router();

/**
 * @swagger
 * /api/organismos:
 *   get:
 *     summary: Lista todos los organismos/municipios
 *     tags: [Organismos]
 */
router.get('/', organismoController.listar.bind(organismoController));

/**
 * @swagger
 * /api/organismos:
 *   post:
 *     summary: Crea nuevo organismo
 *     tags: [Organismos]
 */
router.post('/', organismoController.crear.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}:
 *   get:
 *     summary: Obtiene detalle de organismo
 *     tags: [Organismos]
 */
router.get('/:id', organismoController.obtenerDetalle.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}:
 *   put:
 *     summary: Actualiza organismo
 *     tags: [Organismos]
 */
router.put('/:id', organismoController.actualizar.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}:
 *   delete:
 *     summary: Desactiva organismo
 *     tags: [Organismos]
 */
router.delete('/:id', organismoController.desactivar.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}/archivos:
 *   get:
 *     summary: Lista archivos del organismo
 *     tags: [Organismos]
 */
router.get('/:id/archivos', organismoController.listarArchivos.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}/contratos:
 *   get:
 *     summary: Lista contratos del organismo
 *     tags: [Organismos]
 */
router.get('/:id/contratos', organismoController.listarContratos.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}/usuarios:
 *   get:
 *     summary: Lista usuarios del organismo
 *     tags: [Organismos]
 */
router.get('/:id/usuarios', organismoController.listarUsuarios.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}/estadisticas:
 *   get:
 *     summary: Obtiene estadísticas del organismo
 *     tags: [Organismos]
 */
router.get('/:id/estadisticas', organismoController.obtenerEstadisticas.bind(organismoController));

/**
 * @swagger
 * /api/organismos/contratos/{id}:
 *   post:
 *     summary: Obtiene un contrato específico por ID
 *     tags: [Organismos]
 */
router.post('/contratos/:id', organismoController.obtenerContratoPorId.bind(organismoController));

/**
 * @swagger
 * /api/organismos/combo/{tipoModulo}:
 *   get:
 *     summary: Obtiene lista para combos/dropdowns
 *     tags: [Organismos]
 */
router.get('/combo/:tipoModulo', organismoController.obtenerListaParaCombo.bind(organismoController));

export default router;