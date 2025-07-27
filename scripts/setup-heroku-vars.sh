#!/bin/bash

# Script para configurar variables en Heroku
# Uso: ./scripts/setup-heroku-vars.sh

echo "📦 Configurando variables de Heroku..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde la raíz del proyecto"
    exit 1
fi

# Verificar que Heroku CLI está instalado
if ! command -v heroku &> /dev/null; then
    echo "❌ Error: Heroku CLI no está instalado"
    echo "Instalar desde: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Variables de base de datos
heroku config:set \
    NODE_ENV=production \
    DB_PRIMARY_HOST=mysql-aiven-arenazl.e.aivencloud.com \
    DB_PRIMARY_USER=avnadmin \
    DB_PRIMARY_NAME=defaultdb \
    DB_PRIMARY_PORT=23108 \
    DB_PRIMARY_SSL_CA=./src/DB/crt/ca.pem \
    --app tu-app-name

# JWT Secrets (CAMBIAR ESTOS!)
heroku config:set \
    JWT_SECRET="$(openssl rand -base64 32)" \
    JWT_REFRESH_SECRET="$(openssl rand -base64 32)" \
    JWT_EXPIRES_IN=15m \
    JWT_REFRESH_EXPIRES_IN=7d \
    --app tu-app-name

# CORS para Netlify
heroku config:set \
    CORS_ORIGIN=https://tu-app.netlify.app \
    --app tu-app-name

# Features de producción
heroku config:set \
    LOG_LEVEL=info \
    ENABLE_SWAGGER=false \
    ENABLE_AUDIT=true \
    ENABLE_RATE_LIMIT=true \
    --app tu-app-name

echo "✅ Variables configuradas!"
echo ""
echo "Para ver todas las variables:"
echo "heroku config --app tu-app-name"
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Cambiar 'tu-app-name' por el nombre real de tu app"
echo "2. Actualizar CORS_ORIGIN con tu dominio de Netlify"
echo "3. NO incluir la contraseña de la BD en este script"