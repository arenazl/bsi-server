#!/bin/bash

echo "🔄 Renombrando carpetas v2..."

# 1. Renombrar carpetas
mv src/controllers-v2 src/controllers
mv src/routes-v2 src/routes  
mv src/services-v2 src/services

echo "✅ Carpetas renombradas"

# 2. Actualizar imports en archivos TypeScript
echo "🔄 Actualizando imports..."

# Buscar y reemplazar imports
find src -type f -name "*.ts" -exec sed -i \
  -e 's/@controllers-v2/@controllers/g' \
  -e 's/@routes-v2/@routes/g' \
  -e 's/@services-v2/@services/g' \
  -e 's/from '\''\.\.\/controllers-v2/from '\''\.\.\/controllers/g' \
  -e 's/from '\''\.\.\/routes-v2/from '\''\.\.\/routes/g' \
  -e 's/from '\''\.\.\/services-v2/from '\''\.\.\/services/g' \
  -e 's/from '\''\.\/controllers-v2/from '\''\.\/controllers/g' \
  -e 's/from '\''\.\/routes-v2/from '\''\.\/routes/g' \
  -e 's/from '\''\.\/services-v2/from '\''\.\/services/g' \
  {} +

echo "✅ Imports actualizados"

# 3. Actualizar rutas de API
echo "🔄 Actualizando rutas de API..."

# Cambiar /api/v2 a /api
find src -type f -name "*.ts" -exec sed -i \
  -e 's/\/api\/v2/\/api/g' \
  -e 's/apiPrefix = '\''\/api\/v2'\''/apiPrefix = '\''\/api'\''/g' \
  {} +

echo "✅ Rutas actualizadas"

# 4. Actualizar tsconfig paths
echo "🔄 Actualizando tsconfig.json..."

sed -i \
  -e 's/"@controllers-v2\/\*"/"@controllers\/\*"/g' \
  -e 's/"@routes-v2\/\*"/"@routes\/\*"/g' \
  -e 's/"@services-v2\/\*"/"@services\/\*"/g' \
  -e 's/"src\/controllers-v2\/\*"/"src\/controllers\/\*"/g' \
  -e 's/"src\/routes-v2\/\*"/"src\/routes\/\*"/g' \
  -e 's/"src\/services-v2\/\*"/"src\/services\/\*"/g' \
  tsconfig.json

echo "✅ tsconfig.json actualizado"

echo "✨ Refactoring completado!"
echo ""
echo "⚠️  Próximos pasos:"
echo "1. Verificar que no haya errores de compilación: npm run build"
echo "2. Actualizar el frontend para usar /api en lugar de /api/v2"
echo "3. Ejecutar las pruebas: npm test"