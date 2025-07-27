import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from '@config/index';
import logger from '@config/logger';
import { swaggerSpec } from '@config/swagger';
import { devLogger } from '@middleware/devLogger';
import { requestLogger } from '@middleware/requestLogger';
import { auditMiddleware } from '@middleware/audit';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { Routes } from '@routes/index';
import path from 'path';
import fs from 'fs';

export class App {
  public app: Application;
  private routes: Routes;

  constructor() {
    this.app = express();
    this.routes = new Routes(this.app);
    
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
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow any localhost origin
        if (config.isDevelopment && origin.includes('localhost')) {
          return callback(null, true);
        }
        
        // Otherwise check against configured origins
        const allowedOrigins = Array.isArray(config.security.corsOrigin) 
          ? config.security.corsOrigin 
          : [config.security.corsOrigin];
          
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
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
      // Usar el logger formateado en desarrollo
      this.app.use(devLogger.middleware());
    } else {
      // Morgan para producción
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.http(message.trim())
        }
      }));
    }

    // Custom request logger para auditoría
    if (!config.isDevelopment) {
      this.app.use(requestLogger);
    }

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

    // Swagger Documentation
    if (config.features.swagger !== false) {
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'BSI API Documentation',
        customfavIcon: '/favicon.ico'
      }));
      
      // Endpoint para obtener el spec JSON
      this.app.get('/api-docs.json', (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
      });

      logger.info('📚 Swagger documentation available at /api-docs');
    }

    // Inicializar todas las rutas
    this.routes.init();
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
║                                                                ║
║  💾 Database Connection:                                       ║
║  🏢 Host: ${config.database.primary.host.padEnd(52)}║
║  🗄️  Database: ${config.database.primary.database.padEnd(48)}║
║  👤 User: ${config.database.primary.user.padEnd(52)}║
║  🔌 Port: ${config.database.primary.port.toString().padEnd(52)}║
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