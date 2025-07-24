import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';

/**
 * Clase para manejar las rutas de la API v1 (Legacy)
 * Mantiene compatibilidad con el sistema anterior mientras se migra a v2
 */
export class Routes {
  private app: Application;
  private apiPrefix = '/api';

  constructor(app: Application) {
    this.app = app;
  }

  public init(): void {
    console.log('🔧 Inicializando rutas Legacy (v1)...');

    // Swagger básico para v1 (si existe)
    try {
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup({
        openapi: '3.0.0',
        info: {
          title: 'BSI API v1 (Legacy)',
          version: '1.0.0',
          description: 'API Legacy - En proceso de migración a v2'
        },
        paths: {}
      }, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'BSI API v1 Legacy Documentation',
      }));
    } catch (error) {
      console.log('⚠️  Swagger v1 no disponible');
    }

    // Ruta de salud básica para v1
    this.app.get(`${this.apiPrefix}/health`, (req, res) => {
      res.json({ 
        status: 'ok', 
        version: '1.0.0',
        message: 'Legacy API - Migrating to v2',
        timestamp: new Date().toISOString() 
      });
    });

    // Middleware para avisar sobre rutas legacy
    this.app.use(`${this.apiPrefix}/*`, (req, res, next) => {
      console.log(`⚠️  Legacy API call: ${req.method} ${req.originalUrl}`);
      next();
    });

    console.log('✅ Rutas Legacy (v1) configuradas:');
    console.log(`   - ${this.apiPrefix}/health`);
    console.log(`   - ${this.apiPrefix}/* (Legacy routes with warnings)`);
  }
}