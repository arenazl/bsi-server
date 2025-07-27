-- Script para MySQL/MariaDB para eliminar acentos de las columnas
-- Fecha: 2025-07-25

-- Tabla Organismo
ALTER TABLE Organismo 
CHANGE COLUMN `Dirección_Calle` `Direccion_Calle` VARCHAR(255);

ALTER TABLE Organismo 
CHANGE COLUMN `Dirección_Numero` `Direccion_Numero` VARCHAR(10);

ALTER TABLE Organismo 
CHANGE COLUMN `Dirección_Localidad` `Direccion_Localidad` VARCHAR(100);

ALTER TABLE Organismo 
CHANGE COLUMN `Dirección_Codigo_Postal` `Direccion_Codigo_Postal` VARCHAR(4);

-- Verificar que las columnas mantengan sus tipos de datos y restricciones originales
-- Ajustar los tipos de datos según sea necesario