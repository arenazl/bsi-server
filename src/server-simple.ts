import 'module-alias/register';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

import { SimpleApp } from './app-simple';

// Manejo de errores básicos
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Iniciar servidor simple
async function startSimpleServer() {
  try {
    console.log('🚀 Starting BSI Server in SIMPLE mode...');
    const app = new SimpleApp();
    app.listen(3000);
  } catch (error) {
    console.error('Error starting simple server:', error);
    process.exit(1);
  }
}

startSimpleServer();