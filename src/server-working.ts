import 'module-alias/register';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

import { WorkingApp } from './app-working';
import logger from '@config/logger';

// Manejo de errores básicos
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Iniciar servidor con configuración migrada
async function startWorkingServer() {
  try {
    logger.info('🚀 Starting BSI Server with migrated configuration...');
    const app = new WorkingApp();
    app.listen();
  } catch (error) {
    logger.error('Error starting working server:', error);
    process.exit(1);
  }
}

startWorkingServer();