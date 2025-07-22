# BSI API Server v2.0

API profesional con TypeScript, Express, autenticación JWT, auditoría completa y documentación Swagger.

## 🚀 Características

- **TypeScript** con modo estricto y paths aliases
- **Arquitectura limpia** con separación de capas
- **Autenticación JWT** con refresh tokens
- **Logging profesional** con Winston y Morgan
- **Auditoría completa** de todas las operaciones
- **Documentación Swagger** interactiva
- **Validación robusta** con Zod
- **Manejo de errores** centralizado con notificaciones por email
- **Health checks** para Kubernetes
- **Rate limiting** configurable
- **CORS** y seguridad con Helmet
- **Testing** con Jest

## 📋 Requisitos

- Node.js >= 18.0.0
- MySQL >= 5.7
- npm o yarn

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone <repo-url>
cd bsi-server
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Ejecutar migraciones de base de datos:
```bash
npm run migrate
```

## 🚀 Desarrollo

```bash
# Desarrollo con hot-reload
npm run dev

# Verificar tipos
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Tests
npm run test
npm run test:watch
npm run test:coverage
```

## 📦 Producción

```bash
# Build
npm run build

# Iniciar servidor
npm start

# Con PM2
pm2 start ecosystem.config.js
```

## 📚 Documentación API

La documentación interactiva está disponible en:
- Desarrollo: http://localhost:3000/api-docs
- Producción: https://api.bsi.com/api-docs

## 🏗️ Estructura del Proyecto

```
src/
├── config/          # Configuraciones
│   ├── index.ts     # Config principal
│   ├── logger.ts    # Winston logger
│   ├── audit.ts     # Sistema de auditoría
│   └── swagger.ts   # Documentación API
├── controllers/     # Controladores
├── middleware/      # Middlewares
│   ├── auth.ts      # Autenticación
│   ├── validate.ts  # Validación
│   ├── audit.ts     # Auditoría
│   └── errorHandler.ts
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
├── models/          # Modelos de datos
├── validators/      # Schemas de validación
├── utils/           # Utilidades
├── types/           # TypeScript types
└── app.ts          # Aplicación principal
```

## 🔒 Seguridad

- JWT tokens con expiración configurable
- Refresh tokens para renovación
- Bcrypt para hashing de contraseñas
- Rate limiting por IP
- Helmet para headers de seguridad
- Validación de entrada con Zod
- Auditoría completa de operaciones

## 📊 Logging y Auditoría

### Logs de Aplicación
- Archivos rotativos diarios
- Niveles: error, warn, info, http, debug
- Formato JSON en producción
- Consola con colores en desarrollo

### Auditoría
- Registro de todas las operaciones
- Tracking de usuarios y IPs
- Logs de seguridad separados
- Retención configurable

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

## 🔍 Health Checks

- `/health` - Check básico
- `/health/detailed` - Check detallado con dependencias
- `/ready` - Readiness probe (Kubernetes)
- `/live` - Liveness probe (Kubernetes)

## 🚦 Variables de Entorno

Ver `.env.example` para todas las variables disponibles.

Variables críticas:
- `NODE_ENV` - Entorno (development/production)
- `PORT` - Puerto del servidor
- `DB_*` - Configuración de base de datos
- `JWT_SECRET` - Secret para JWT
- `JWT_REFRESH_SECRET` - Secret para refresh tokens

## 📈 Monitoreo

La API soporta integración con:
- Sentry (errores)
- New Relic (performance)
- ElasticSearch (logs)
- Prometheus (métricas)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

MIT License - ver archivo LICENSE para detalles