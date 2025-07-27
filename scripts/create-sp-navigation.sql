-- Stored Procedure para obtener configuración de navegación
-- Base de datos: defaultdev

DELIMITER $$

-- Eliminar si existe
DROP PROCEDURE IF EXISTS sp_get_navigation_config$$

-- Crear stored procedure
CREATE PROCEDURE sp_get_navigation_config(
    IN p_modulo VARCHAR(50),
    IN p_idUsuario INT,
    IN p_idOrganismo INT
)
BEGIN
    -- Declarar variables para manejo de errores
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- En caso de error, devolver conjunto vacío
        SELECT 
            0 as IdConfiguracion,
            '' as modulo,
            '' as ruta,
            '' as componente,
            'Error' as titulo,
            'Error al obtener configuración' as descripcion,
            0 as orden,
            FALSE as activo,
            TRUE as requiereAutenticacion,
            '{}' as metadatos;
    END;

    -- Consulta principal
    -- Por ahora retornamos toda la configuración del módulo activo
    -- En el futuro se puede agregar validación de permisos por usuario
    SELECT 
        IdConfiguracion,
        modulo,
        ruta,
        componente,
        titulo,
        descripcion,
        orden,
        activo,
        requiereAutenticacion,
        IFNULL(metadatos, '{}') as metadatos
    FROM BSI_CONFIGURACION_MODULOS
    WHERE modulo = p_modulo
        AND activo = TRUE
    ORDER BY orden ASC;
    
END$$

DELIMITER ;