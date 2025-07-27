-- Tabla de Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion VARCHAR(200),
  activo BOOLEAN DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion) VALUES
('super_admin', 'Administrador con acceso total al sistema'),
('admin', 'Administrador de organismo'),
('supervisor', 'Supervisor con permisos de lectura y edición'),
('operador', 'Operador con permisos básicos'),
('consulta', 'Usuario de solo consulta');

-- Tabla de relación Usuario-Rol (muchos a muchos)
CREATE TABLE IF NOT EXISTS usuario_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  id_rol INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  asignado_por INT,
  FOREIGN KEY (id_usuario) REFERENCES T_Usuarios(ID_User),
  FOREIGN KEY (id_rol) REFERENCES roles(id),
  UNIQUE KEY unique_usuario_rol (id_usuario, id_rol)
);

-- Vista para facilitar consultas
CREATE VIEW v_usuarios_con_roles AS
SELECT 
  u.ID_User,
  u.Nombre,
  u.Apellido,
  u.ID_Organismo,
  GROUP_CONCAT(r.nombre) as roles,
  MAX(CASE WHEN r.nombre = 'super_admin' THEN 1 ELSE 0 END) as es_super_admin
FROM T_Usuarios u
LEFT JOIN usuario_roles ur ON u.ID_User = ur.id_usuario
LEFT JOIN roles r ON ur.id_rol = r.id
WHERE r.activo = 1
GROUP BY u.ID_User;

-- Stored Procedure actualizado para login
DROP PROCEDURE IF EXISTS sp_login_user_with_roles;

DELIMITER $$
CREATE PROCEDURE sp_login_user_with_roles(
  IN p_nombre VARCHAR(100),
  IN p_password VARCHAR(100)
)
BEGIN
  DECLARE v_user_id INT;
  
  -- Verificar credenciales
  SELECT ID_User INTO v_user_id
  FROM T_Usuarios
  WHERE Nombre = p_nombre 
  AND Password = p_password
  AND Estado = 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Retornar usuario con sus roles
    SELECT 
      u.ID_User,
      u.Nombre,
      u.Apellido,
      u.ID_Organismo,
      o.Nombre as Nombre_Organismo,
      GROUP_CONCAT(r.nombre) as roles,
      MAX(CASE WHEN r.nombre = 'super_admin' THEN 1 ELSE 0 END) as isSuperUser,
      -- Otros permisos específicos
      MAX(CASE WHEN r.nombre IN ('super_admin', 'admin') THEN 1 ELSE 0 END) as canAccessAdmin,
      MAX(CASE WHEN r.nombre IN ('super_admin', 'admin', 'supervisor') THEN 1 ELSE 0 END) as canEdit,
      MAX(CASE WHEN r.nombre != 'consulta' THEN 1 ELSE 0 END) as canCreate
    FROM T_Usuarios u
    LEFT JOIN Organismo o ON u.ID_Organismo = o.ID_Organismo
    LEFT JOIN usuario_roles ur ON u.ID_User = ur.id_usuario
    LEFT JOIN roles r ON ur.id_rol = r.id AND r.activo = 1
    WHERE u.ID_User = v_user_id
    GROUP BY u.ID_User;
  ELSE
    -- Usuario no válido
    SELECT 0 as estado, 'Credenciales inválidas' as mensaje;
  END IF;
END$$
DELIMITER ;