import { Router } from 'express';
import { HealthController } from '@controllers/HealthController';
import { asyncHandler } from '@utils/asyncHandler';

const router = Router();
const healthController = new HealthController();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', asyncHandler(healthController.check));

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with dependencies
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         responseTime:
 *                           type: number
 *                 system:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         used:
 *                           type: number
 *                         free:
 *                           type: number
 *                         percentage:
 *                           type: number
 *                     cpu:
 *                       type: object
 *                       properties:
 *                         cores:
 *                           type: number
 *                         usage:
 *                           type: number
 */
router.get('/health/detailed', asyncHandler(healthController.detailed));

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness probe for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', asyncHandler(healthController.readiness));

/**
 * @swagger
 * /live:
 *   get:
 *     summary: Liveness probe for Kubernetes
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', asyncHandler(healthController.liveness));

export default router;