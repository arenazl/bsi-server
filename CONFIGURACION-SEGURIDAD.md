# 🔐 Configuración de Seguridad - BSI Server

## ⚠️ IMPORTANTE: Migración de keys.ts completada

El archivo `keys.ts` ha sido **MIGRADO A .env** por razones de seguridad. Este archivo **NO DEBE** volver a contener credenciales hardcodeadas.

## 📋 Setup Inicial

### 1. Configurar Variables de Entorno

```bash
# Copiar el template
cp .env.example .env

# Editar con tus credenciales reales
nano .env
```

### 2. Variables Críticas que DEBES configurar:

#### 🗄️ Bases de Datos
- `DB_PRIMARY_*` - Base de datos principal (Aiven Cloud)
- `DB_NUCLEO_*` - Base de datos núcleo local
- `DB_NUCLEO_ONLINE_*` - Base de datos núcleo online

#### 🔑 JWT y Autenticación
```bash
# Generar secrets fuertes (mínimo 32 caracteres)
JWT_SECRET=tu-super-secreto-jwt-de-al-menos-32-caracteres
JWT_REFRESH_SECRET=tu-super-secreto-refresh-de-al-menos-32-caracteres
```

#### 📧 Email
```bash
# Configurar Gmail con App Password
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password-de-gmail
```

#### 🚀 APIs Externas
```bash
META_API_TOKEN=tu-token-de-meta
OPENAI_API_KEY=tu-api-key-de-openai
AWS_ACCESS_KEY_ID=tu-access-key-de-aws
AWS_SECRET_ACCESS_KEY=tu-secret-key-de-aws
```

## 🏗️ Estructura de Configuración

```
src/config/
├── index.ts              # ✅ Configuración principal (usa .env)
└── logger.ts             # ✅ Configuración de logs

DEPRECADO:
├── keys.ts               # ❌ YA NO USAR - Migrado a .env
```

## 🔍 Cómo acceder a la configuración

```typescript
import { config } from '@config/index';

// Bases de datos
const primaryDB = config.database.primary;
const nucleoDB = config.database.nucleo;

// APIs externas
const openaiKey = config.apis.openai.apiKey;
const metaToken = config.apis.meta.token;

// Email
const emailConfig = config.email;
```

## 🚫 Reglas de Seguridad

### ✅ PERMITIDO:
- Usar variables de entorno con `process.env.VARIABLE`
- Configuración tipada en `config/index.ts`
- Valores por defecto para desarrollo
- Documentación sin credenciales reales

### ❌ PROHIBIDO:
- Hardcodear credenciales en código TypeScript
- Hacer commit de archivos `.env` con datos reales
- Compartir tokens/passwords en Slack/email
- Usar credenciales de producción en desarrollo

## 🔄 Ambientes

| Archivo | Uso | Estado |
|---------|-----|--------|
| `.env` | Desarrollo local | ✅ Configurado |
| `.env.example` | Template para equipo | ✅ Creado |
| `.env.production` | Producción | 🔄 Crear cuando sea necesario |
| `.env.staging` | Staging | 🔄 Crear cuando sea necesario |

## 🆘 Rotación de Credenciales

Si `keys.ts` fue commiteado con credenciales reales:

1. **Cambiar TODAS las passwords/tokens expuestos**
2. **Rotar JWT secrets**
3. **Verificar logs de acceso en servicios externos**
4. **Informar al equipo sobre el compromiso**

## 📞 Contacto

Para dudas de configuración, contactar al equipo de desarrollo.

---
**Última actualización**: $(date)
**Estado**: ✅ Migración completada - keys.ts -> .env