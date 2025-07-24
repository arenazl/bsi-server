import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from '@config/index';
import logger from '@config/logger';

export class WorkingApp {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddlewares(): void {
    // CORS configuration
    this.app.use(cors({
      origin: config.security.corsOrigin,
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private configureRoutes(): void {
    // Health checks
    this.app.get('/ping', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'BSI Server is running with migrated config'
      });
    });

    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        version: '2.0.0',
        environment: config.env,
        timestamp: new Date().toISOString() 
      });
    });

    // Config test endpoint
    this.app.get('/api/config-test', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        environment: config.env,
        databases: {
          primary: {
            host: config.database.primary.host,
            database: config.database.primary.database,
            hasSSL: !!config.database.primary.ssl
          },
          nucleo: {
            host: config.database.nucleo.host,
            database: config.database.nucleo.database
          }
        },
        features: config.features,
        email: {
          host: config.email.host,
          port: config.email.port,
          hasAuth: !!config.email.auth.user
        }
      });
    });

    // Basic V2 routes
    this.app.get('/api/v2/status', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        version: 'v2',
        message: 'API V2 with migrated configuration'
      });
    });
  }

  private configureErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Error handler
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      logger.error('Server Error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    });
  }

  public listen(port?: number): void {
    const appPort = port || config.port;
    
    this.app.listen(appPort, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║              BSI Server v2.0 - Config Migrated                ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on: http://localhost:${appPort}               ║
║  📊 Environment: ${config.env.padEnd(43)}║
║  🔒 Config migrated from keys.ts to .env                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);

      // Log configuración activa (sin passwords)
      logger.info('Configuration loaded:', {
        environment: config.env,
        databases: {
          primary: config.database.primary.host,
          nucleo: config.database.nucleo.host,
          nucleoOnline: config.database.nucleoOnline.host
        },
        security: {
          cors: config.security.corsOrigin,
          jwtConfigured: !!config.jwt.secret,
        },
      });
    });
  }
}