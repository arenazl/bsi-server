const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupRolesSystem() {
  let connection;
  
  try {
    // Conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'mysql-2b58b593-santafesino-e8e9.e.aivencloud.com',
      port: process.env.DB_PORT || 10665,
      user: process.env.DB_USER || 'avnadmin',
      password: process.env.DB_PASSWORD || 'AVNS_bHRQdtKaVs8wVx69sHD',
      database: process.env.DB_DATABASE || 'defaultdb',
      multipleStatements: true
    });

    console.log('🔗 Conectado a la base de datos');

    // 1. Crear tabla de roles
    console.log('\n📋 Creando tabla de roles...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nombre VARCHAR(50) UNIQUE NOT NULL,
        descripcion VARCHAR(200),
        activo BOOLEAN DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla roles creada');

    // 2. Insertar roles básicos
    console.log('\n📝 Insertando roles básicos...');
    const roles = [
      ['super_admin', 'Administrador con acceso total al sistema'],
      ['admin', 'Administrador de organismo'],
      ['supervisor', 'Supervisor con permisos de lectura y edición'],
      ['operador', 'Operador con permisos básicos'],
      ['consulta', 'Usuario de solo consulta']
    ];

    for (const [nombre, descripcion] of roles) {
      try {
        await connection.query(
          'INSERT IGNORE INTO roles (nombre, descripcion) VALUES (?, ?)',
          [nombre, descripcion]
        );
        console.log(`  - Rol '${nombre}' creado`);
      } catch (err) {
        console.log(`  - Rol '${nombre}' ya existe`);
      }
    }

    // 3. Crear tabla de relación usuario-rol
    console.log('\n🔗 Creando tabla usuario_roles...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuario_roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        id_usuario INT NOT NULL,
        id_rol INT NOT NULL,
        fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        asignado_por INT,
        UNIQUE KEY unique_usuario_rol (id_usuario, id_rol)
      )
    `);
    console.log('✅ Tabla usuario_roles creada');

    // 4. Buscar usuarios existentes
    console.log('\n👥 Buscando usuarios existentes...');
    const [usuarios] = await connection.query(`
      SELECT ID_User, Nombre, Apellido 
      FROM T_Usuarios 
      WHERE Estado = 1 
      LIMIT 10
    `);

    if (usuarios.length === 0) {
      console.log('⚠️  No se encontraron usuarios activos');
      return;
    }

    console.log(`\nUsuarios encontrados:`);
    usuarios.forEach((u, idx) => {
      console.log(`${idx + 1}. [ID: ${u.ID_User}] ${u.Nombre} ${u.Apellido || ''}`);
    });

    // 5. Preguntar a qué usuario asignar rol admin
    console.log('\n❓ ¿A qué usuario querés asignarle el rol admin?');
    console.log('Por ahora, asignaré el rol al primer usuario de la lista...');

    const selectedUser = usuarios[0];
    console.log(`\n✨ Asignando rol 'admin' a: ${selectedUser.Nombre}`);

    // Obtener ID del rol admin
    const [[roleAdmin]] = await connection.query(
      'SELECT id FROM roles WHERE nombre = ?',
      ['admin']
    );

    // Asignar rol
    await connection.query(
      'INSERT IGNORE INTO usuario_roles (id_usuario, id_rol) VALUES (?, ?)',
      [selectedUser.ID_User, roleAdmin.id]
    );
    console.log('✅ Rol asignado exitosamente');

    // 6. Verificar asignación
    console.log('\n🔍 Verificando roles asignados...');
    const [userRoles] = await connection.query(`
      SELECT 
        u.ID_User,
        u.Nombre,
        GROUP_CONCAT(r.nombre) as roles
      FROM T_Usuarios u
      LEFT JOIN usuario_roles ur ON u.ID_User = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id
      WHERE u.ID_User = ?
      GROUP BY u.ID_User
    `, [selectedUser.ID_User]);

    console.log('Usuario con roles:', userRoles[0]);

    // 7. Crear vista para facilitar consultas
    console.log('\n👁️ Creando vista v_usuarios_con_roles...');
    await connection.query(`
      CREATE OR REPLACE VIEW v_usuarios_con_roles AS
      SELECT 
        u.ID_User,
        u.Nombre,
        u.Apellido,
        u.ID_Organismo,
        GROUP_CONCAT(r.nombre) as roles,
        MAX(CASE WHEN r.nombre = 'super_admin' THEN 1 ELSE 0 END) as es_super_admin,
        MAX(CASE WHEN r.nombre IN ('super_admin', 'admin') THEN 1 ELSE 0 END) as es_admin
      FROM T_Usuarios u
      LEFT JOIN usuario_roles ur ON u.ID_User = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id AND r.activo = 1
      GROUP BY u.ID_User
    `);
    console.log('✅ Vista creada');

    console.log('\n🎉 Sistema de roles configurado exitosamente!');
    console.log('\n📌 Próximos pasos:');
    console.log('1. Actualizar el SP de login para que devuelva los roles');
    console.log('2. El usuario', selectedUser.Nombre, 'ahora tiene rol admin');
    console.log('3. Podés asignar más roles ejecutando:');
    console.log(`   INSERT INTO usuario_roles (id_usuario, id_rol) VALUES (ID_USER, ID_ROL);`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
setupRolesSystem().catch(console.error);