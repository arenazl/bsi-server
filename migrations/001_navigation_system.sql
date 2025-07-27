-- =============================================
-- Autor: Sistema BSI
-- Fecha: 2024-12-24
-- Descripción: Creación de tablas para navegación dinámica
-- =============================================

-- 1. CREAR TABLA DE CONFIGURACIÓN DE MÓDULOS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BSI_CONFIGURACION_MODULOS' AND xtype='U')
BEGIN
    CREATE TABLE BSI_CONFIGURACION_MODULOS (
        ID_Config INT PRIMARY KEY IDENTITY(1,1),
        Codigo_Modulo VARCHAR(50) NOT NULL,
        Id_Modalidad INT NULL, -- NULL = aplica a todas las modalidades
        Nombre_Accion VARCHAR(100) NOT NULL,
        Tipo_Pantalla VARCHAR(20) NOT NULL,
        Ruta_Template VARCHAR(200) NOT NULL,
        Icono VARCHAR(50),
        Orden INT DEFAULT 0,
        Condicion_Mostrar VARCHAR(500) NULL,
        Activo BIT DEFAULT 1,
        Fecha_Alta DATETIME DEFAULT GETDATE(),
        Usuario_Alta VARCHAR(50) DEFAULT SYSTEM_USER
    );

    -- Crear índices
    CREATE INDEX IX_BSI_CONFIG_MODULOS_Codigo ON BSI_CONFIGURACION_MODULOS(Codigo_Modulo);
    CREATE INDEX IX_BSI_CONFIG_MODULOS_Modalidad ON BSI_CONFIGURACION_MODULOS(Id_Modalidad);
END
GO

-- 2. INSERTAR CONFIGURACIÓN INICIAL PARA MÓDULO PAGOS
INSERT INTO BSI_CONFIGURACION_MODULOS (Codigo_Modulo, Id_Modalidad, Nombre_Accion, Tipo_Pantalla, Ruta_Template, Icono, Orden)
VALUES 
    -- Acciones generales para todos los tipos de pago
    ('pagos', NULL, 'Importar', 'import', '/xslImport/NOMINA/{contratoId}', 'fa-upload', 1),
    ('pagos', NULL, 'Verificar', 'verify', '/xslVerified/NOMINA/{contratoId}', 'fa-check-circle', 2),
    
    -- Acciones específicas por modalidad (ejemplo)
    ('pagos', 1, 'Generar Archivo', 'editable', '/xslEditabletable/{contratoId}', 'fa-file-export', 3), -- Solo HABERES
    ('pagos', 2, 'Autorizar Pagos', 'custom', '/autorizar-pagos/{contratoId}', 'fa-stamp', 3); -- Solo PROVEEDORES
GO

-- 3. STORED PROCEDURE PARA OBTENER CONFIGURACIÓN
IF EXISTS (SELECT * FROM sysobjects WHERE name='sp_get_navigation_config' AND xtype='P')
    DROP PROCEDURE sp_get_navigation_config
GO

CREATE PROCEDURE sp_get_navigation_config
    @moduleCode VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Variables para respuesta estándar
    DECLARE @estado INT = 1;
    DECLARE @descripcion VARCHAR(500) = 'Configuración obtenida correctamente';
    DECLARE @data NVARCHAR(MAX);
    
    BEGIN TRY
        -- Obtener datos en formato JSON
        SET @data = (
            SELECT 
                Nombre_Accion as actionName,
                Tipo_Pantalla as screenType,
                Ruta_Template as routeTemplate,
                Icono as icon,
                Orden as [order],
                Condicion_Mostrar as showCondition,
                Id_Modalidad as modalityId
            FROM BSI_CONFIGURACION_MODULOS
            WHERE Codigo_Modulo = @moduleCode
            AND Activo = 1
            ORDER BY Orden
            FOR JSON PATH
        );
        
        -- Si no hay datos
        IF @data IS NULL
        BEGIN
            SET @estado = 0;
            SET @descripcion = 'No se encontró configuración para el módulo: ' + @moduleCode;
            SET @data = '[]';
        END
        
    END TRY
    BEGIN CATCH
        SET @estado = 0;
        SET @descripcion = ERROR_MESSAGE();
        SET @data = '[]';
    END CATCH
    
    -- Devolver respuesta estándar
    SELECT 
        @estado as estado,
        @descripcion as descripcion,
        @data as data;
END
GO

-- 4. CONFIGURACIÓN PARA OTROS MÓDULOS
INSERT INTO BSI_CONFIGURACION_MODULOS (Codigo_Modulo, Id_Modalidad, Nombre_Accion, Tipo_Pantalla, Ruta_Template, Icono, Orden)
VALUES 
    -- Módulo Nóminas
    ('nominas', NULL, 'Cargar Nómina', 'import', '/xslImport/NOMINA/{contratoId}', 'fa-users', 1),
    ('nominas', NULL, 'Verificar Nómina', 'verify', '/xslVerified/NOMINA/{contratoId}', 'fa-user-check', 2),
    ('nominas', NULL, 'Editar Nómina', 'editable', '/xslEditabletable/{contratoId}', 'fa-user-edit', 3),
    
    -- Módulo Cuentas
    ('cuentas', NULL, 'Importar Cuentas', 'import', '/xslImport/CUENTA/{contratoId}', 'fa-university', 1),
    ('cuentas', NULL, 'Validar CBU', 'verify', '/xslVerified/CUENTA/{contratoId}', 'fa-check-double', 2),
    ('cuentas', NULL, 'Gestionar Cuentas', 'editable', '/xslEditabletable/{contratoId}', 'fa-credit-card', 3);
GO

-- 5. TABLA DE AUDITORÍA DE NAVEGACIÓN (OPCIONAL)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BSI_NAVEGACION_LOG' AND xtype='U')
BEGIN
    CREATE TABLE BSI_NAVEGACION_LOG (
        ID_Log INT PRIMARY KEY IDENTITY(1,1),
        ID_Usuario INT NOT NULL,
        Codigo_Modulo VARCHAR(50),
        ID_Contrato INT,
        Accion VARCHAR(100),
        Fecha_Acceso DATETIME DEFAULT GETDATE(),
        IP_Address VARCHAR(50),
        User_Agent VARCHAR(500)
    );

    CREATE INDEX IX_BSI_NAV_LOG_Usuario ON BSI_NAVEGACION_LOG(ID_Usuario);
    CREATE INDEX IX_BSI_NAV_LOG_Fecha ON BSI_NAVEGACION_LOG(Fecha_Acceso);
END
GO

-- 6. SP PARA REGISTRAR ACCESOS
IF EXISTS (SELECT * FROM sysobjects WHERE name='sp_log_navigation_access' AND xtype='P')
    DROP PROCEDURE sp_log_navigation_access
GO

CREATE PROCEDURE sp_log_navigation_access
    @userId INT,
    @moduleCode VARCHAR(50),
    @contractId INT = NULL,
    @action VARCHAR(100),
    @ipAddress VARCHAR(50) = NULL,
    @userAgent VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO BSI_NAVEGACION_LOG (ID_Usuario, Codigo_Modulo, ID_Contrato, Accion, IP_Address, User_Agent)
    VALUES (@userId, @moduleCode, @contractId, @action, @ipAddress, @userAgent);
END
GO

PRINT 'Migración de navegación dinámica completada exitosamente';