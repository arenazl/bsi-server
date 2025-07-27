-- Crear tabla usuarios para autenticación con JWT
-- Esta tabla es para el sistema de login, diferente a la tabla Users del panel admin

DROP TABLE IF EXISTS usuarios;

CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('M','F','Otro') DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `email_verificado` tinyint(1) DEFAULT '0',
  `token_verificacion` varchar(100) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `refresh_token` varchar(500) DEFAULT NULL,
  `token_expiry` timestamp NULL DEFAULT NULL,
  `rol` varchar(50) DEFAULT 'user',
  `es_super_usuario` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_email` (`email`),
  KEY `idx_token_verificacion` (`token_verificacion`),
  KEY `idx_refresh_token` (`refresh_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insertar un usuario super admin de prueba
-- Password: admin123 (deberás cambiarla)
INSERT INTO usuarios (email, password_hash, nombre, apellido, activo, email_verificado, rol, es_super_usuario)
VALUES ('admin@bsi.com', '$2b$10$YourHashedPasswordHere', 'Admin', 'BSI', 1, 1, 'admin', 1);