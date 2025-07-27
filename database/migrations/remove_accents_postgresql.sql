-- Script para PostgreSQL para eliminar acentos de las columnas
-- Fecha: 2025-07-25

-- Tabla Organismo
ALTER TABLE "Organismo" 
RENAME COLUMN "Dirección_Calle" TO "Direccion_Calle";

ALTER TABLE "Organismo" 
RENAME COLUMN "Dirección_Numero" TO "Direccion_Numero";

ALTER TABLE "Organismo" 
RENAME COLUMN "Dirección_Localidad" TO "Direccion_Localidad";

ALTER TABLE "Organismo" 
RENAME COLUMN "Dirección_Codigo_Postal" TO "Direccion_Codigo_Postal";

-- PostgreSQL es sensible a mayúsculas/minúsculas si se usan comillas dobles
-- Ajustar según la configuración actual de la base de datos