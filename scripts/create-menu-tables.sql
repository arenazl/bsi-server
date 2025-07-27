-- Script para crear estructura de menú con dos tablas separadas

-- Tabla para las actividades del menú (las tarjetas)
CREATE TABLE IF NOT EXISTS BSI_MENU_ACTIVIDADES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    habilitado BOOLEAN DEFAULT true,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_titulo (titulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para las opciones del menú (items dentro de cada tarjeta)
CREATE TABLE IF NOT EXISTS BSI_MENU_OPCIONES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actividad_id INT NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    ruta VARCHAR(500) NOT NULL,
    icono VARCHAR(50),
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (actividad_id) REFERENCES BSI_MENU_ACTIVIDADES(id) ON DELETE CASCADE,
    INDEX idx_actividad (actividad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar las actividades del menú
INSERT INTO BSI_MENU_ACTIVIDADES (titulo, descripcion, habilitado, orden) VALUES
('Alta De Cuentas Masiva (Becas)', 'Creá tu archivo de altas de cuentas bancarias', true, 1),
('Pagos Múltiples', 'Generá tus archivos de pagos', true, 2),
('Transferencias Inmediatas', 'Confeccioná tus archivos TIM-BIPI', false, 3),
('Administración Usuarios', 'Gestioná el alta y las cargas de los usuario', true, 4),
('Tableros', 'Administrá los pagos de tus abonados', true, 5),
('Códigos De Barras', 'Elaboramos o actualizamos tus boletas de pago', false, 6),
('Validación De CBU', 'Eliminá los rechazos de las transferencias', false, 7),
('Servicio De Consultoría', 'Disminuí la carga operativa', false, 8),
('Migración De Archivos', 'Optimizá los procesos de migración', false, 9);

-- Insertar las opciones del menú
-- Alta De Cuentas Masiva
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'Archivo de alta de cuentas', '/dinamicModule/altas-masivas', 'fa-file-alt', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Alta De Cuentas Masiva (Becas)';

-- Pagos Múltiples
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'Pagos Múltiples', '/dinamicModule/pagosmultiples', 'fa-file-invoice-dollar', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Pagos Múltiples';

-- Transferencias Inmediatas (2 opciones)
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'el Historial', '/auditoria/0', 'fa-file-signature', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Transferencias Inmediatas';

INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'una Nueva Carga', '/legajo/add/0', 'fa-upload', 2
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Transferencias Inmediatas';

-- Administración Usuarios
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'Usuarios', '/userManagement', 'fa-credit-card', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Administración Usuarios';

-- Tableros
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'Tablero de Pagos', '/dashboard', 'fa-money-check', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Tableros';

-- Códigos De Barras
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'Código de barras', '/seguros', 'fa-barcode', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Códigos De Barras';

-- Validación De CBU
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'Validación de CBU', '/inversiones', 'fa-check-circle', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Validación De CBU';

-- Servicio De Consultoría
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'Servicio de Consultoría', '/movimientos', 'fa-concierge-bell', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Servicio De Consultoría';

-- Migración De Archivos
INSERT INTO BSI_MENU_OPCIONES (actividad_id, descripcion, ruta, icono, orden)
SELECT id, 'Migración de archivos', '/depositos', 'fa-database', 1
FROM BSI_MENU_ACTIVIDADES WHERE titulo = 'Migración De Archivos';

-- Stored Procedure para obtener el menú completo
DELIMITER //
CREATE PROCEDURE sp_obtener_menu_principal()
BEGIN
    SELECT 
        a.id,
        a.titulo AS title,
        a.descripcion AS description,
        a.habilitado AS enabled,
        CONCAT('[',
            GROUP_CONCAT(
                JSON_OBJECT(
                    'description', o.descripcion,
                    'link', o.ruta,
                    'icono', o.icono
                )
                ORDER BY o.orden
            ),
        ']') AS items_json
    FROM BSI_MENU_ACTIVIDADES a
    LEFT JOIN BSI_MENU_OPCIONES o ON a.id = o.actividad_id AND o.activo = true
    WHERE a.activo = true
    GROUP BY a.id, a.titulo, a.descripcion, a.habilitado, a.orden
    ORDER BY a.orden;
END//
DELIMITER ;