# Scripts de Migración - Eliminación de Acentos

Este directorio contiene scripts SQL para actualizar la base de datos y eliminar acentos de los nombres de columnas.

## Archivos disponibles:

1. **remove_accents_from_columns.sql** - Script genérico con la estructura básica
2. **remove_accents_mysql.sql** - Script específico para MySQL/MariaDB
3. **remove_accents_sqlserver.sql** - Script específico para SQL Server
4. **remove_accents_postgresql.sql** - Script específico para PostgreSQL

## Columnas afectadas:

### Tabla Organismo:
- `Dirección_Calle` → `Direccion_Calle`
- `Dirección_Numero` → `Direccion_Numero`
- `Dirección_Localidad` → `Direccion_Localidad`
- `Dirección_Codigo_Postal` → `Direccion_Codigo_Postal`

## Instrucciones de uso:

1. **Hacer backup de la base de datos antes de ejecutar cualquier script**
2. Identificar el motor de base de datos que está usando (MySQL, SQL Server, PostgreSQL, etc.)
3. Ejecutar el script correspondiente a su motor de base de datos
4. Verificar que las columnas se hayan renombrado correctamente
5. Actualizar cualquier stored procedure que reference estas columnas

## Notas importantes:

- Estos scripts deben ejecutarse una sola vez
- Después de ejecutar los scripts, verificar que la aplicación funcione correctamente
- Si existen stored procedures que referencian estas columnas, también deben actualizarse
- Los tipos de datos y restricciones de las columnas deben mantenerse

## Verificación post-migración:

Ejecutar las siguientes consultas para verificar los cambios:

```sql
-- Verificar estructura de la tabla Organismo
DESCRIBE Organismo;  -- MySQL
-- o
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Organismo';
```