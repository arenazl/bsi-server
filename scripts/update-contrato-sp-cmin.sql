-- Actualizar stored procedure para usar tabla cmin en lugar de usuarios
DROP PROCEDURE IF EXISTS ObtenerContratoById;

DELIMITER $$

CREATE PROCEDURE ObtenerContratoById(
    IN p_id_user INT,
    IN p_id_organismo INT,
    IN p_id_contrato INT
)
BEGIN
    SELECT 
        c.id,
        c.id_organismo,
        c.codigo,
        c.descripcion,
        c.observaciones,
        c.estado,
        c.fecha_creacion,
        c.fecha_modificacion
    FROM contratos c
    INNER JOIN cmin cm ON cm.id_organismo = c.id_organismo
    WHERE c.id = p_id_contrato 
    AND c.id_organismo = p_id_organismo
    AND cm.id_user = p_id_user;
END$$

DELIMITER ;