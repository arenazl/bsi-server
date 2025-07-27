-- Script para SQL Server para eliminar acentos de las columnas
-- Fecha: 2025-07-25

-- Tabla Organismo
EXEC sp_rename 'Organismo.Dirección_Calle', 'Direccion_Calle', 'COLUMN';
EXEC sp_rename 'Organismo.Dirección_Numero', 'Direccion_Numero', 'COLUMN';
EXEC sp_rename 'Organismo.Dirección_Localidad', 'Direccion_Localidad', 'COLUMN';
EXEC sp_rename 'Organismo.Dirección_Codigo_Postal', 'Direccion_Codigo_Postal', 'COLUMN';

-- Verificar si existen otras columnas con acentos
-- Nota: En SQL Server, los nombres de columnas con caracteres especiales 
-- deben estar entre corchetes [Nombre_Columna] si causan problemas