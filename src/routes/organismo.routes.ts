import { Router } from 'express';
import organismoController from '../controllers/OrganismoController';

const router = Router();

/**
 * @swagger
 * /api/organismos:
 *   get:
 *     summary: Lista todos los organismos/municipios
 *     description: Obtiene una lista paginada de organismos con filtros opcionales
 *     tags: [Organismos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: tipo
 *         in: query
 *         schema:
 *           type: string
 *           enum: [MUNICIPIO, PROVINCIA, NACION, PRIVADO]
 *       - name: activo
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de organismos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Organismo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', organismoController.listar.bind(organismoController));

/**
 * @swagger
 * /api/organismos:
 *   post:
 *     summary: Crear nuevo organismo
 *     description: Crea un nuevo organismo en el sistema
 *     tags: [Organismos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganismoRequest'
 *     responses:
 *       201:
 *         description: Organismo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organismo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', organismoController.crear.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}:
 *   get:
 *     summary: Obtener detalle de organismo
 *     tags: [Organismos]
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
 *         description: Organismo obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Organismo'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', organismoController.obtenerDetalle.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}:
 *   put:
 *     summary: Actualizar organismo
 *     tags: [Organismos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganismoRequest'
 *     responses:
 *       200:
 *         description: Organismo actualizado exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/:id', organismoController.actualizar.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}:
 *   delete:
 *     summary: Desactivar organismo
 *     tags: [Organismos]
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
 *         description: Organismo desactivado exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id', organismoController.desactivar.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}/archivos:
 *   get:
 *     summary: Listar archivos del organismo
 *     tags: [Organismos]
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
 *         description: Archivos obtenidos exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/archivos', organismoController.listarArchivos.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}/contratos:
 *   get:
 *     summary: Listar contratos del organismo
 *     tags: [Organismos]
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
 *         description: Contratos obtenidos exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/contratos', organismoController.listarContratos.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}/usuarios:
 *   get:
 *     summary: Listar usuarios del organismo
 *     tags: [Organismos]
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
 *         description: Usuarios obtenidos exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/usuarios', organismoController.listarUsuarios.bind(organismoController));

/**
 * @swagger
 * /api/organismos/{id}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas del organismo
 *     tags: [Organismos]
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
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id/estadisticas', organismoController.obtenerEstadisticas.bind(organismoController));

/**
 * @swagger
 * /api/organismos/contratos/{id}:
 *   post:
 *     summary: Obtener un contrato específico por ID
 *     tags: [Organismos]
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
 *         description: Contrato obtenido exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/contratos/:id', organismoController.obtenerContratoPorId.bind(organismoController));

/**
 * @swagger
 * /api/organismos/combo/{tipoModulo}:
 *   get:
 *     summary: Obtener lista para combos/dropdowns
 *     description: Obtiene una lista simplificada de organismos para uso en componentes de selección
 *     tags: [Organismos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: tipoModulo
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NOMINA, PAGO, CUENTA]
 *     responses:
 *       200:
 *         description: Lista para combo obtenida exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/combo/:tipoModulo', organismoController.obtenerListaParaCombo.bind(organismoController));

export default router;