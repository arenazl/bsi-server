-- Script para eliminar acentos de las columnas en la base de datos BSI
-- Fecha: 2025-07-25
-- Descripción: Actualiza los nombres de columnas para eliminar caracteres especiales y acentos

-- Tabla Organismo
ALTER TABLE Organismo 
RENAME COLUMN Dirección_Calle TO Direccion_Calle;

ALTER TABLE Organismo 
RENAME COLUMN Dirección_Numero TO Direccion_Numero;

ALTER TABLE Organismo 
RENAME COLUMN Dirección_Localidad TO Direccion_Localidad;

ALTER TABLE Organismo 
RENAME COLUMN Dirección_Codigo_Postal TO Direccion_Codigo_Postal;

-- Verificar si existen otras columnas con acentos en otras tablas
-- y agregarlas aquí según sea necesario

-- Ejemplo para futuras tablas que puedan tener acentos:
-- ALTER TABLE Contratos650 
-- RENAME COLUMN Descripción TO Descripcion;

-- ALTER TABLE usuarios 
-- RENAME COLUMN Función TO Funcion;

-- Nota: Este script debe ejecutarse una sola vez
-- Verificar la sintaxis específica según el motor de base de datos utilizado (MySQL, PostgreSQL, SQL Server, etc.)