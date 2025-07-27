import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { Routes } from '@routes/index';

export class SimpleApp {
  public app: Application;
  private routes: Routes;

  constructor() {
    this.app = express();
    this.routes = new Routes(this.app);
    
    // Configurar middlewares básicos
    this.configureBasicMiddlewares();
    
    // Configurar rutas
    this.configureRoutes();
  }

  private configureBasicMiddlewares(): void {
    // CORS básico
    this.app.use(cors({
      origin: 'http://localhost:4200',
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private configureRoutes(): void {
    // Health check simple
    this.app.get('/ping', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Server is running'
      });
    });

    // API v1 health
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        version: '1.0.0',
        message: 'Legacy API - Simple version',
        timestamp: new Date().toISOString() 
      });
    });

    // Inicializar rutas V2
    this.routes.init();

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  public listen(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                    BSI API Server v2.0 (SIMPLE)               ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on: http://localhost:${port}               ║
║  📚 Environment: development                                   ║
║  ⚠️  Running in SIMPLE mode (reduced features)                ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  }
}