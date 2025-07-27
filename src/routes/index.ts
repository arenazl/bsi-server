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
import navigationRoutes from './navigation.routes';

export class Routes {
  private app: Application;
  private apiPrefix = '/api';

  constructor(app: Application) {
    this.app = app;
  }

  public init(): void {
    console.log('🚀 Inicializando rutas API...');

    // Rutas orientadas al negocio
    this.app.use(`${this.apiPrefix}/auth`, authRoutes);
    this.app.use(`${this.apiPrefix}/usuarios`, usuarioRoutes);
    this.app.use(`${this.apiPrefix}/nominas`, nominaRoutes);
    this.app.use(`${this.apiPrefix}/pagos`, pagoRoutes);
    this.app.use(`${this.apiPrefix}/archivos`, archivoRoutes);
    this.app.use(`${this.apiPrefix}/organismos`, organismoRoutes);
    this.app.use(`${this.apiPrefix}/generic`, genericRoutes);
    this.app.use(`${this.apiPrefix}/cuentas`, cuentaRoutes);
    this.app.use(`${this.apiPrefix}/navigation`, navigationRoutes);

    console.log('✅ Rutas API cargadas:');
    console.log(`   - ${this.apiPrefix}/auth`);
    console.log(`   - ${this.apiPrefix}/usuarios`);
    console.log(`   - ${this.apiPrefix}/nominas`);
    console.log(`   - ${this.apiPrefix}/pagos`);
    console.log(`   - ${this.apiPrefix}/archivos`);
    console.log(`   - ${this.apiPrefix}/organismos`);
    console.log(`   - ${this.apiPrefix}/generic`);
    console.log(`   - ${this.apiPrefix}/cuentas`);
    console.log(`   - ${this.apiPrefix}/navigation`);
  }
}