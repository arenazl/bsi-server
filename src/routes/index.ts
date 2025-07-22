import { Router, Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@config/swagger';

// Import all route modules
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import fileRoutes from './file.routes';
import metadataRoutes from './metadata.routes';
import healthRoutes from './health.routes';

export class Routes {
  private app: Application;
  private apiPrefix = '/api/v1';

  constructor(app: Application) {
    this.app = app;
  }

  public init(): void {
    // API Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Health check routes (no prefix needed)
    this.app.use('/', healthRoutes);

    // API v1 routes
    this.app.use(`${this.apiPrefix}/auth`, authRoutes);
    this.app.use(`${this.apiPrefix}/users`, userRoutes);
    this.app.use(`${this.apiPrefix}/files`, fileRoutes);
    this.app.use(`${this.apiPrefix}/metadata`, metadataRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
        path: req.originalUrl
      });
    });
  }
}