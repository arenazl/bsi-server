#!/bin/bash

echo "🧹 Limpiando referencias a v2 en el código..."

# Limpiar directorio build
echo "📦 Limpiando directorio build..."
rm -rf ./build/*

# Buscar y reemplazar en archivos TypeScript
echo "🔍 Buscando referencias a v2 en archivos .ts..."

# Reemplazar /api/v2 con /api
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's|/api/v2|/api|g' {} \;

# Reemplazar V2 con nada en nombres de clases/imports
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/RoutesV2/Routes/g' {} \;
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/routesV2/routes/g' {} \;

# Reemplazar referencias a carpetas -v2
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/@routes-v2/@routes/g' {} \;
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/@services-v2/@services/g' {} \;
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/@controllers-v2/@controllers/g' {} \;

# Reemplazar mensajes y comentarios
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/API V2/API/g' {} \;
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/Rutas V2/Rutas/g' {} \;
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/v2\.0/2.0/g' {} \;

# Reemplazar swaggerSpecV2
find . -type f -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" -exec sed -i 's/swaggerSpecV2/swaggerSpec/g' {} \;

echo "✅ Limpieza completada"

# Mostrar archivos que aún contienen v2 (para revisión manual)
echo ""
echo "📋 Archivos que aún contienen 'v2' (revisar manualmente):"
grep -r "v2\|V2" --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build . | grep -v "2.0" | head -10

echo ""
echo "🔧 Recuerda:"
echo "1. Ejecutar 'npm run build' para recompilar"
echo "2. Revisar que no haya rutas rotas"
echo "3. Actualizar el frontend si es necesario"