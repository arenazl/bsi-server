import 'module-alias/register';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

import { App } from './app';
import logger from '@config/logger';

// Manejo de errores no capturados
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Iniciar servidor
async function startServer() {
  try {
    const app = new App();
    app.listen();
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();