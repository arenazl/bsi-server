-- Actualización de Stored Procedures para tabla Organismo
-- Fecha: 2025-07-25
-- Descripción: Actualiza los SP para usar nombres de columnas sin acentos

-- =============================================
-- SP: ORGANISMO_OBTENER_LISTA
-- =============================================
DROP PROCEDURE IF EXISTS ORGANISMO_OBTENER_LISTA;

DELIMITER $$
CREATE PROCEDURE ORGANISMO_OBTENER_LISTA()
BEGIN
    SELECT 
        ID_Organismo,
        Nombre,
        Nombre_Corto,
        CUIT,
        Direccion_Calle,
        Direccion_Numero,
        Direccion_Localidad,
        Direccion_Codigo_Postal,
        Sucursal_Bapro,
        Tipo_Organismo,
        Tipo_Estado,
        Fecha_Alta,
        Fecha_Baja,
        Fecha_Modificacion
    FROM Organismo
    WHERE Tipo_Estado = 1
    ORDER BY Nombre;
END$$
DELIMITER ;

-- =============================================
-- SP: ORGANISMO_OBTENER_POR_ID
-- =============================================
DROP PROCEDURE IF EXISTS ORGANISMO_OBTENER_POR_ID;

DELIMITER $$
CREATE PROCEDURE ORGANISMO_OBTENER_POR_ID(
    IN p_id_organismo INT
)
BEGIN
    SELECT 
        ID_Organismo,
        Nombre,
        Nombre_Corto,
        CUIT,
        Direccion_Calle,
        Direccion_Numero,
        Direccion_Localidad,
        Direccion_Codigo_Postal,
        Sucursal_Bapro,
        Tipo_Organismo,
        Tipo_Estado,
        Fecha_Alta,
        Fecha_Baja,
        Fecha_Modificacion
    FROM Organismo
    WHERE ID_Organismo = p_id_organismo;
END$$
DELIMITER ;

-- =============================================
-- SP: ORGANISMO_CREAR
-- =============================================
DROP PROCEDURE IF EXISTS ORGANISMO_CREAR;

DELIMITER $$
CREATE PROCEDURE ORGANISMO_CREAR(
    IN p_Nombre VARCHAR(255),
    IN p_Nombre_Corto VARCHAR(22),
    IN p_CUIT VARCHAR(11),
    IN p_Direccion_Calle VARCHAR(255),
    IN p_Direccion_Numero VARCHAR(10),
    IN p_Direccion_Localidad VARCHAR(100),
    IN p_Direccion_Codigo_Postal VARCHAR(4),
    IN p_Sucursal_Bapro VARCHAR(50),
    IN p_Tipo_Organismo INT,
    IN p_Tipo_Estado INT
)
BEGIN
    INSERT INTO Organismo (
        Nombre,
        Nombre_Corto,
        CUIT,
        Direccion_Calle,
        Direccion_Numero,
        Direccion_Localidad,
        Direccion_Codigo_Postal,
        Sucursal_Bapro,
        Tipo_Organismo,
        Tipo_Estado,
        Fecha_Alta
    ) VALUES (
        p_Nombre,
        p_Nombre_Corto,
        p_CUIT,
        p_Direccion_Calle,
        p_Direccion_Numero,
        p_Direccion_Localidad,
        p_Direccion_Codigo_Postal,
        p_Sucursal_Bapro,
        p_Tipo_Organismo,
        p_Tipo_Estado,
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as ID_Organismo;
END$$
DELIMITER ;

-- =============================================
-- SP: ORGANISMO_ACTUALIZAR
-- =============================================
DROP PROCEDURE IF EXISTS ORGANISMO_ACTUALIZAR;

DELIMITER $$
CREATE PROCEDURE ORGANISMO_ACTUALIZAR(
    IN p_id_organismo INT,
    IN p_Nombre VARCHAR(255),
    IN p_Nombre_Corto VARCHAR(22),
    IN p_CUIT VARCHAR(11),
    IN p_Direccion_Calle VARCHAR(255),
    IN p_Direccion_Numero VARCHAR(10),
    IN p_Direccion_Localidad VARCHAR(100),
    IN p_Direccion_Codigo_Postal VARCHAR(4),
    IN p_Sucursal_Bapro VARCHAR(50),
    IN p_Tipo_Organismo INT,
    IN p_Tipo_Estado INT
)
BEGIN
    UPDATE Organismo SET
        Nombre = p_Nombre,
        Nombre_Corto = p_Nombre_Corto,
        CUIT = p_CUIT,
        Direccion_Calle = p_Direccion_Calle,
        Direccion_Numero = p_Direccion_Numero,
        Direccion_Localidad = p_Direccion_Localidad,
        Direccion_Codigo_Postal = p_Direccion_Codigo_Postal,
        Sucursal_Bapro = p_Sucursal_Bapro,
        Tipo_Organismo = p_Tipo_Organismo,
        Tipo_Estado = p_Tipo_Estado,
        Fecha_Modificacion = NOW()
    WHERE ID_Organismo = p_id_organismo;
    
    SELECT ROW_COUNT() as affected_rows;
END$$
DELIMITER ;

-- =============================================
-- SP: ORGANISMO_ELIMINAR
-- =============================================
DROP PROCEDURE IF EXISTS ORGANISMO_ELIMINAR;

DELIMITER $$
CREATE PROCEDURE ORGANISMO_ELIMINAR(
    IN p_id_organismo INT
)
BEGIN
    -- Soft delete: solo marca como inactivo
    UPDATE Organismo SET
        Tipo_Estado = 0,
        Fecha_Baja = NOW(),
        Fecha_Modificacion = NOW()
    WHERE ID_Organismo = p_id_organismo;
    
    SELECT ROW_COUNT() as affected_rows;
END$$
DELIMITER ;