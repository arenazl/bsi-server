# Guía de Deployment BSI

## 🚀 Backend - Heroku

### Pre-requisitos
1. Cuenta en Heroku
2. Heroku CLI instalado
3. Git configurado

### Pasos para deploy

#### 1. Crear app en Heroku
```bash
heroku create bsi-backend-prod
```

#### 2. Configurar variables de entorno
```bash
# Base de datos Aiven
heroku config:set DB_PRIMARY_HOST=mysql-aiven-arenazl.e.aivencloud.com
heroku config:set DB_PRIMARY_USER=avnadmin
heroku config:set DB_PRIMARY_PASSWORD=CAMBIAR_PASSWORD_REAL
heroku config:set DB_PRIMARY_NAME=defaultdb
heroku config:set DB_PRIMARY_PORT=23108
heroku config:set DB_PRIMARY_SSL_CA=./src/DB/crt/ca.pem

# JWT (Generar nuevos secrets!)
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# CORS - Cambiar por tu dominio de Netlify
heroku config:set CORS_ORIGIN=https://bsi-app.netlify.app

# Producción
heroku config:set NODE_ENV=production
```

#### 3. Agregar buildpack si usas archivos estáticos
```bash
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-nodejs
```

#### 4. Deploy
```bash
git add .
git commit -m "Preparar para producción"
git push heroku main
```

#### 5. Verificar logs
```bash
heroku logs --tail
```

#### 6. Escalar dynos si es necesario
```bash
heroku ps:scale web=1
```

---

## 🌐 Frontend - Netlify

### Pre-requisitos
1. Cuenta en Netlify
2. Repositorio en GitHub/GitLab

### Opción A: Deploy desde GitHub (Recomendado)

1. **En Netlify Dashboard:**
   - New site from Git
   - Conectar GitHub
   - Seleccionar repositorio
   - Branch: `main`
   - Build command: `npm run build`
   - Publish directory: `dist/bsi`

2. **Variables de entorno (si las necesitas):**
   - Site settings → Environment variables
   - Agregar las que necesites

### Opción B: Deploy manual con CLI

1. **Instalar Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Build local:**
```bash
cd bsi-front
npm install
npm run build
```

3. **Deploy:**
```bash
netlify deploy --prod --dir=dist/bsi
```

### Configurar dominio personalizado
1. Domain settings → Add custom domain
2. Configurar DNS según instrucciones

---

## 📋 Checklist Pre-Deploy

### Backend
- [ ] Todas las dependencias en `package.json`
- [ ] `engines` especifica versión de Node
- [ ] `Procfile` existe con: `web: npm start`
- [ ] Build funciona: `npm run build`
- [ ] Variables de entorno configuradas en Heroku
- [ ] Certificado SSL (ca.pem) incluido en build
- [ ] CORS apunta al dominio de Netlify

### Frontend
- [ ] `environment.prod.ts` apunta a Heroku
- [ ] Build de producción funciona: `npm run build`
- [ ] `netlify.toml` configurado
- [ ] `_redirects` para Angular routing
- [ ] Sin credenciales hardcodeadas

### Base de datos
- [ ] Migraciones ejecutadas en producción
- [ ] Usuarios y permisos configurados
- [ ] Backup antes de deploy

---

## 🔧 Comandos útiles

### Heroku
```bash
# Ver apps
heroku apps

# Ver config
heroku config

# Reiniciar
heroku restart

# Logs
heroku logs --tail

# Ejecutar comando
heroku run npm run migrate

# Bash
heroku run bash
```

### Netlify
```bash
# Status
netlify status

# Deploy preview
netlify deploy

# Deploy producción
netlify deploy --prod

# Ver sitio
netlify open
```

---

## 🚨 Troubleshooting

### Error: "Application error" en Heroku
1. Verificar logs: `heroku logs --tail`
2. Verificar PORT: Heroku asigna el puerto automáticamente
3. Verificar build: `heroku run bash` y luego `ls build/`

### Error: "Page not found" en Netlify
1. Verificar `_redirects` existe
2. Verificar `netlify.toml` tiene las redirecciones
3. Build directory correcto: `dist/bsi`

### CORS errors
1. Verificar `CORS_ORIGIN` en Heroku
2. Debe ser exactamente el dominio de Netlify (sin / al final)
3. Ejemplo: `https://bsi-app.netlify.app`

---

## 📊 Monitoreo

### Heroku
- Metrics: Ver en dashboard
- Agregar New Relic o Datadog para más detalle

### Netlify
- Analytics: Disponible en plan Pro
- Ver build logs en dashboard

### Aiven (Base de datos)
- Dashboard de Aiven para métricas
- Configurar alertas