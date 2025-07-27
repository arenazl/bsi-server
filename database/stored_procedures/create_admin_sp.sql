-- Stored Procedures para el Panel de Administración BSI
-- Fecha: 2025-07-25
-- Descripción: Crea los SP necesarios para la gestión de Organismos, Contratos y Usuarios

-- =============================================
-- ORGANISMOS
-- =============================================

-- SP: ORGANISMO_OBTENER_LISTA
-- Obtiene lista de todos los organismos
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
    ORDER BY Nombre;
END$$
DELIMITER ;

-- SP: ORGANISMO_OBTENER_POR_ID
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

-- SP: ORGANISMO_CREAR
DROP PROCEDURE IF EXISTS ORGANISMO_CREAR;

DELIMITER $$
CREATE PROCEDURE ORGANISMO_CREAR(
    IN p_Nombre VARCHAR(100),
    IN p_Nombre_Corto VARCHAR(22),
    IN p_CUIT CHAR(11),
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
        CURDATE()
    );
    
    SELECT LAST_INSERT_ID() as ID_Organismo;
END$$
DELIMITER ;

-- SP: ORGANISMO_ACTUALIZAR
DROP PROCEDURE IF EXISTS ORGANISMO_ACTUALIZAR;

DELIMITER $$
CREATE PROCEDURE ORGANISMO_ACTUALIZAR(
    IN p_id_organismo INT,
    IN p_Nombre VARCHAR(100),
    IN p_Nombre_Corto VARCHAR(22),
    IN p_CUIT CHAR(11),
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
        Fecha_Modificacion = CURDATE()
    WHERE ID_Organismo = p_id_organismo;
    
    SELECT ROW_COUNT() as affected_rows;
END$$
DELIMITER ;

-- SP: ORGANISMO_ELIMINAR
DROP PROCEDURE IF EXISTS ORGANISMO_ELIMINAR;

DELIMITER $$
CREATE PROCEDURE ORGANISMO_ELIMINAR(
    IN p_id_organismo INT
)
BEGIN
    -- Soft delete: solo marca como inactivo
    UPDATE Organismo SET
        Tipo_Estado = 0,
        Fecha_Baja = CURDATE(),
        Fecha_Modificacion = CURDATE()
    WHERE ID_Organismo = p_id_organismo;
    
    SELECT ROW_COUNT() as affected_rows;
END$$
DELIMITER ;

-- =============================================
-- CONTRATOS
-- =============================================

-- SP: CONTRATOS_OBTENER_POR_ORGANISMO
DROP PROCEDURE IF EXISTS CONTRATOS_OBTENER_POR_ORGANISMO;

DELIMITER $$
CREATE PROCEDURE CONTRATOS_OBTENER_POR_ORGANISMO(
    IN p_id_organismo INT
)
BEGIN
    SELECT 
        Contrato_ID,
        ID_Organismo,
        Informacion_Discrecional,
        Id_Modalidad,
        Rotulo,
        Ente,
        Cuenta_Debito,
        Tipo_Estado,
        Fecha_Alta,
        Fecha_Baja,
        indicativo
    FROM Contratos650
    WHERE ID_Organismo = p_id_organismo
    ORDER BY Fecha_Alta DESC;
END$$
DELIMITER ;

-- SP: CONTRATO_CREAR
DROP PROCEDURE IF EXISTS CONTRATO_CREAR;

DELIMITER $$
CREATE PROCEDURE CONTRATO_CREAR(
    IN p_ID_Organismo INT,
    IN p_Id_Modalidad INT,
    IN p_Rotulo VARCHAR(10),
    IN p_Ente VARCHAR(4),
    IN p_Cuenta_Debito VARCHAR(14),
    IN p_Informacion_Discrecional VARCHAR(20),
    IN p_Tipo_Estado INT
)
BEGIN
    INSERT INTO Contratos650 (
        ID_Organismo,
        Id_Modalidad,
        Rotulo,
        Ente,
        Cuenta_Debito,
        Informacion_Discrecional,
        Tipo_Estado,
        Fecha_Alta
    ) VALUES (
        p_ID_Organismo,
        p_Id_Modalidad,
        p_Rotulo,
        p_Ente,
        p_Cuenta_Debito,
        p_Informacion_Discrecional,
        p_Tipo_Estado,
        CURDATE()
    );
    
    SELECT LAST_INSERT_ID() as Contrato_ID;
END$$
DELIMITER ;

-- SP: CONTRATO_ACTUALIZAR
DROP PROCEDURE IF EXISTS CONTRATO_ACTUALIZAR;

DELIMITER $$
CREATE PROCEDURE CONTRATO_ACTUALIZAR(
    IN p_contrato_id INT,
    IN p_ID_Organismo INT,
    IN p_Id_Modalidad INT,
    IN p_Rotulo VARCHAR(10),
    IN p_Ente VARCHAR(4),
    IN p_Cuenta_Debito VARCHAR(14),
    IN p_Informacion_Discrecional VARCHAR(20),
    IN p_Tipo_Estado INT
)
BEGIN
    UPDATE Contratos650 SET
        ID_Organismo = p_ID_Organismo,
        Id_Modalidad = p_Id_Modalidad,
        Rotulo = p_Rotulo,
        Ente = p_Ente,
        Cuenta_Debito = p_Cuenta_Debito,
        Informacion_Discrecional = p_Informacion_Discrecional,
        Tipo_Estado = p_Tipo_Estado
    WHERE Contrato_ID = p_contrato_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$
DELIMITER ;

-- SP: CONTRATO_ELIMINAR
DROP PROCEDURE IF EXISTS CONTRATO_ELIMINAR;

DELIMITER $$
CREATE PROCEDURE CONTRATO_ELIMINAR(
    IN p_contrato_id INT
)
BEGIN
    -- Soft delete
    UPDATE Contratos650 SET
        Tipo_Estado = 0,
        Fecha_Baja = CURDATE()
    WHERE Contrato_ID = p_contrato_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$
DELIMITER ;