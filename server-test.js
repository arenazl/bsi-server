const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// CORS básico con configuración de .env
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true,
}));

// Body parsing
app.use(express.json());

// Rutas básicas
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'BSI Server is running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '2.0.0',
    message: 'BSI API Health Check',
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/v2/auth/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'V2 Auth endpoint working',
    timestamp: new Date().toISOString() 
  });
});

// Endpoint para probar configuración migrada
app.get('/api/config-test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Configuration migrated from keys.ts to .env',
    environment: process.env.NODE_ENV || 'development',
    databases: {
      primary: {
        host: process.env.DB_PRIMARY_HOST || 'not-configured',
        name: process.env.DB_PRIMARY_NAME || 'not-configured'
      },
      nucleo: {
        host: process.env.DB_NUCLEO_HOST || 'not-configured',
        name: process.env.DB_NUCLEO_NAME || 'not-configured'
      }
    },
    features: {
      swagger: process.env.ENABLE_SWAGGER === 'true',
      audit: process.env.ENABLE_AUDIT === 'true'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                    BSI Test Server                             ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on: http://localhost:${port}               ║
║  📚 Test endpoints available                                   ║
║  ✅ Ready for frontend connection                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;