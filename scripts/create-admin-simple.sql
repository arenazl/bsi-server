-- Script para crear un usuario admin simple
-- Opción 1: Si ya tenés una tabla de usuarios existente, 
-- actualizamos un usuario para que sea super admin

-- Buscar y actualizar el primer usuario como super admin
UPDATE defaultdb.T_Usuarios 
SET es_admin = 1, es_super_usuario = 1
WHERE ID_User = 1;

-- O si preferís crear uno nuevo con credenciales conocidas:
-- INSERT INTO defaultdb.T_Usuarios (Nombre, Password, es_admin, es_super_usuario)
-- VALUES ('admin', 'admin123', 1, 1);

-- Mostrar el usuario actualizado
SELECT ID_User, Nombre, es_admin, es_super_usuario 
FROM defaultdb.T_Usuarios 
WHERE ID_User = 1 OR Nombre = 'admin';