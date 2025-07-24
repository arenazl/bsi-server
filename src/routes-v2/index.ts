import { Application } from 'express';
// import swaggerUi from 'swagger-ui-express';
// import { swaggerSpecV2 } from '@config/swagger';

// Rutas v2 orientadas al negocio
import nominaRoutes from './nomina.routes';
import pagoRoutes from './pago.routes';
import archivoRoutes from './archivo.routes';
import organismoRoutes from './organismo.routes';
import authRoutes from './auth.routes';
import usuarioRoutes from './usuario.routes';
import genericRoutes from './generic.routes';
import cuentaRoutes from './cuenta.routes';

export class RoutesV2 {
  private app: Application;
  private apiPrefix = '/api/v2';

  constructor(app: Application) {
    this.app = app;
  }

  public init(): void {
    console.log('🚀 Inicializando rutas V2 orientadas al negocio...');

    // API Documentation V2 - Temporarily disabled
    // this.app.use('/api-docs-v2', swaggerUi.serve, swaggerUi.setup(swaggerSpecV2, {
    //   customCss: '.swagger-ui .topbar { display: none }',
    //   customSiteTitle: 'BSI API v2 Documentation',
    // }));

    // Rutas V2 orientadas al negocio
    this.app.use(`${this.apiPrefix}/auth`, authRoutes);
    this.app.use(`${this.apiPrefix}/usuarios`, usuarioRoutes);
    this.app.use(`${this.apiPrefix}/nominas`, nominaRoutes);
    this.app.use(`${this.apiPrefix}/pagos`, pagoRoutes);
    this.app.use(`${this.apiPrefix}/archivos`, archivoRoutes);
    this.app.use(`${this.apiPrefix}/organismos`, organismoRoutes);
    this.app.use(`${this.apiPrefix}/generic`, genericRoutes);
    this.app.use(`${this.apiPrefix}/cuentas`, cuentaRoutes);

    console.log('✅ Rutas V2 cargadas:');
    console.log(`   - ${this.apiPrefix}/auth`);
    console.log(`   - ${this.apiPrefix}/usuarios`);
    console.log(`   - ${this.apiPrefix}/nominas`);
    console.log(`   - ${this.apiPrefix}/pagos`);
    console.log(`   - ${this.apiPrefix}/archivos`);
    console.log(`   - ${this.apiPrefix}/organismos`);
    console.log(`   - ${this.apiPrefix}/generic`);
    console.log(`   - ${this.apiPrefix}/cuentas`);
  }
}