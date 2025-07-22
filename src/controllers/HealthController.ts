import { Request, Response } from 'express';
import os from 'os';
import { config } from '@config/index';
import DatabaseHelper from '../databaseHelper';
import logger from '@config/logger';

export class HealthController {
  /**
   * Basic health check
   */
  async check(req: Request, res: Response): Promise<Response> {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
    });
  }

  /**
   * Detailed health check with all services
   */
  async detailed(req: Request, res: Response): Promise<Response> {
    const healthChecks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      version: process.env.npm_package_version || '2.0.0',
      services: {} as any,
      system: {} as any,
    };

    // Check database
    try {
      const startTime = Date.now();
      await DatabaseHelper.executeSpSelect('SELECT 1', []);
      const responseTime = Date.now() - startTime;
      
      healthChecks.services.database = {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      healthChecks.services.database = {
        status: 'unhealthy',
        error: 'Connection failed',
      };
      healthChecks.status = 'degraded';
    }

    // Check Redis if configured
    if (config.redis) {
      healthChecks.services.redis = {
        status: 'not_implemented',
        message: 'Redis health check not implemented',
      };
    }

    // System information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    healthChecks.system = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
        used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
        free: `${Math.round(freeMemory / 1024 / 1024)}MB`,
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model,
        usage: process.cpuUsage(),
      },
      load: os.loadavg(),
    };

    // Set appropriate status code
    const statusCode = healthChecks.status === 'healthy' ? 200 : 503;

    return res.status(statusCode).json(healthChecks);
  }

  /**
   * Readiness probe for Kubernetes
   */
  async readiness(req: Request, res: Response): Promise<Response> {
    try {
      // Check if database is ready
      await DatabaseHelper.executeSpSelect('SELECT 1', []);
      
      return res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Readiness check failed:', error);
      return res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Database connection not ready',
      });
    }
  }

  /**
   * Liveness probe for Kubernetes
   */
  async liveness(req: Request, res: Response): Promise<Response> {
    return res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
    });
  }
}