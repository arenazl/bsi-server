-- Script para crear tabla de configuración de navegación
-- Base de datos: defaultdev

-- Eliminar tabla si existe
DROP TABLE IF EXISTS BSI_CONFIGURACION_MODULOS;

-- Crear tabla de configuración de módulos
CREATE TABLE BSI_CONFIGURACION_MODULOS (
    IdConfiguracion INT AUTO_INCREMENT PRIMARY KEY,
    modulo VARCHAR(50) NOT NULL,
    ruta VARCHAR(200) NOT NULL,
    componente VARCHAR(100) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    requiereAutenticacion BOOLEAN DEFAULT TRUE,
    metadatos JSON,
    fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_modulo (modulo),
    INDEX idx_activo (activo)
);

-- Insertar configuración inicial
INSERT INTO BSI_CONFIGURACION_MODULOS (modulo, ruta, componente, titulo, descripcion, orden, metadatos) VALUES
-- Módulo de Pagos
('pagos', '/pagos/procesar', 'ProcesarPagosComponent', 'Procesar Pagos', 'Procesamiento de pagos múltiples', 1, 
    JSON_OBJECT(
        'tipoModulo', 'PAG',
        'requiereContrato', true,
        'permisos', JSON_ARRAY('PAG_PROCESAR', 'PAG_VER')
    )
),
('pagos', '/pagos/consultar', 'ConsultarPagosComponent', 'Consultar Pagos', 'Consulta de pagos procesados', 2, 
    JSON_OBJECT(
        'tipoModulo', 'PAG',
        'requiereContrato', true,
        'permisos', JSON_ARRAY('PAG_CONSULTAR')
    )
),
('pagos', '/pagos/archivo', 'GenerarArchivoComponent', 'Generar Archivo', 'Generación de archivos de pago', 3, 
    JSON_OBJECT(
        'tipoModulo', 'PAG',
        'requiereContrato', true,
        'permisos', JSON_ARRAY('PAG_ARCHIVO')
    )
),
-- Módulo de Nómina
('nomina', '/nomina/importar', 'ImportarNominaComponent', 'Importar Nómina', 'Importación de archivos de nómina', 1, 
    JSON_OBJECT(
        'tipoModulo', 'NOM',
        'requiereContrato', true,
        'permisos', JSON_ARRAY('NOM_IMPORTAR')
    )
),
('nomina', '/nomina/verificar', 'VerificarNominaComponent', 'Verificar Nómina', 'Verificación de datos de nómina', 2, 
    JSON_OBJECT(
        'tipoModulo', 'NOM',
        'requiereContrato', true,
        'permisos', JSON_ARRAY('NOM_VERIFICAR')
    )
),
('nomina', '/nomina/editar', 'EditarNominaComponent', 'Editar Nómina', 'Edición de registros de nómina', 3, 
    JSON_OBJECT(
        'tipoModulo', 'NOM',
        'requiereContrato', true,
        'permisos', JSON_ARRAY('NOM_EDITAR')
    )
),
-- Módulo de Cuentas
('cuentas', '/cuentas/importar', 'ImportarCuentasComponent', 'Importar Cuentas', 'Importación de cuentas bancarias', 1, 
    JSON_OBJECT(
        'tipoModulo', 'CUE',
        'requiereContrato', true,
        'permisos', JSON_ARRAY('CUE_IMPORTAR')
    )
),
('cuentas', '/cuentas/validar', 'ValidarCuentasComponent', 'Validar Cuentas', 'Validación de CBU y datos bancarios', 2, 
    JSON_OBJECT(
        'tipoModulo', 'CUE',
        'requiereContrato', true,
        'permisos', JSON_ARRAY('CUE_VALIDAR')
    )
);

-- Crear stored procedure para obtener configuración
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_get_navigation_config$$

CREATE PROCEDURE sp_get_navigation_config(
    IN p_modulo VARCHAR(50),
    IN p_idUsuario INT,
    IN p_idOrganismo INT
)
BEGIN
    -- Por ahora retornamos toda la configuración del módulo
    -- En el futuro se puede filtrar por permisos del usuario
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
        metadatos
    FROM BSI_CONFIGURACION_MODULOS
    WHERE modulo = p_modulo
        AND activo = TRUE
    ORDER BY orden ASC;
END$$

DELIMITER ;

-- Verificar que la tabla se creó correctamente
SELECT 'Tabla BSI_CONFIGURACION_MODULOS creada exitosamente' AS mensaje;
SELECT COUNT(*) AS total_registros FROM BSI_CONFIGURACION_MODULOS;