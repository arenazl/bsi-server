import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from '@config/index';
import logger from '@config/logger';
import { requestLogger } from '@middleware/requestLogger';
import { auditMiddleware } from '@middleware/audit';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { Routes } from '@routes/index';
import { RoutesV2 } from '@routes-v2/index';
import path from 'path';
import fs from 'fs';

export class App {
  public app: Application;
  private routes: Routes;
  private routesV2: RoutesV2;

  constructor() {
    this.app = express();
    this.routes = new Routes(this.app);
    this.routesV2 = new RoutesV2(this.app);
    
    // Crear directorios necesarios
    this.createRequiredDirectories();
    
    // Configurar middlewares
    this.configureMiddlewares();
    
    // Configurar rutas
    this.configureRoutes();
    
    // Configurar manejo de errores
    this.configureErrorHandling();
  }

  private createRequiredDirectories(): void {
    const dirs = [
      config.logging.dir,
      path.join(config.logging.dir, 'audit'),
      config.upload.uploadDir,
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Directory created: ${dir}`);
      }
    });
  }

  private configureMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet({
      contentSecurityPolicy: config.isProduction,
      crossOriginEmbedderPolicy: !config.isDevelopment
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.security.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = req.headers['x-request-id'] as string || 
                `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Logging middlewares
    if (config.isDevelopment) {
      // Morgan para desarrollo con formato personalizado
      this.app.use(morgan('dev', {
        stream: {
          write: (message: string) => logger.http(message.trim())
        }
      }));
    }

    // Custom request logger con formato bonito
    this.app.use(requestLogger);

    // Audit middleware - TEMPORALMENTE DESHABILITADO
    // TODO: Restaurar cuando se arregle audit.ts
    // if (config.features.audit) {
    //   this.app.use(auditMiddleware);
    // }

    // Trust proxy
    this.app.set('trust proxy', true);

    // Static files
    this.app.use('/uploads', express.static(config.upload.uploadDir));
  }

  private configureRoutes(): void {
    // Health check simple (sin autenticación)
    this.app.get('/ping', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        requestId: req.id 
      });
    });

    // Inicializar todas las rutas
    this.routes.init();
    
    // Inicializar rutas V2
    this.routesV2.init();
  }

  private configureErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  public listen(port?: number): void {
    const appPort = port || config.port;
    
    this.app.listen(appPort, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                    BSI API Server v2.0                         ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on: http://localhost:${appPort}               ║
║  📚 API Docs: http://localhost:${appPort}/api-docs               ║
║  🔍 Environment: ${config.env.padEnd(45)}║
║  📁 Logs directory: ${config.logging.dir.padEnd(42)}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);

      // Log configuración activa
      logger.info('Configuration:', {
        environment: config.env,
        features: config.features,
        database: {
          primaryHost: config.database.primary.host,
          primaryDatabase: config.database.primary.database,
          nucleoHost: config.database.nucleo.host,
          nucleoDatabase: config.database.nucleo.database,
        },
        security: {
          cors: config.security.corsOrigin,
          rateLimit: config.rateLimit.enabled,
        },
      });
    });
  }
}