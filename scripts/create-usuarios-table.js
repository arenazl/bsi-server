const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createUsuariosTable() {
  let connection;
  
  try {
    // Conexión a la base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'mysql-2b58b593-santafesino-e8e9.e.aivencloud.com',
      port: process.env.DB_PORT || 10665,
      user: process.env.DB_USER || 'avnadmin',
      password: process.env.DB_PASSWORD || 'AVNS_bHRQdtKaVs8wVx69sHD',
      database: process.env.DB_DATABASE || 'defaultdb'
    });

    console.log('Conectado a la base de datos');

    // Eliminar tabla si existe
    await connection.query('DROP TABLE IF EXISTS usuarios');
    console.log('Tabla usuarios eliminada (si existía)');

    // Crear tabla usuarios
    await connection.query(`
      CREATE TABLE usuarios (
        id int NOT NULL AUTO_INCREMENT,
        email varchar(255) NOT NULL,
        password_hash varchar(255) NOT NULL,
        nombre varchar(100) NOT NULL,
        apellido varchar(100) NOT NULL,
        telefono varchar(20) DEFAULT NULL,
        fecha_nacimiento date DEFAULT NULL,
        genero enum('M','F','Otro') DEFAULT NULL,
        activo tinyint(1) DEFAULT '1',
        email_verificado tinyint(1) DEFAULT '0',
        token_verificacion varchar(100) DEFAULT NULL,
        fecha_creacion timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ultimo_login timestamp NULL DEFAULT NULL,
        refresh_token varchar(500) DEFAULT NULL,
        token_expiry timestamp NULL DEFAULT NULL,
        rol varchar(50) DEFAULT 'user',
        es_super_usuario tinyint(1) DEFAULT '0',
        PRIMARY KEY (id),
        UNIQUE KEY idx_email (email),
        KEY idx_token_verificacion (token_verificacion),
        KEY idx_refresh_token (refresh_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    
    console.log('✅ Tabla usuarios creada exitosamente');

    // Crear password hash para el admin
    const adminPassword = 'admin123'; // CAMBIAR ESTO EN PRODUCCIÓN
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Insertar usuario admin
    await connection.query(`
      INSERT INTO usuarios (email, password_hash, nombre, apellido, activo, email_verificado, rol, es_super_usuario)
      VALUES (?, ?, 'Admin', 'BSI', 1, 1, 'admin', 1)
    `, ['admin@bsi.com', hashedPassword]);

    console.log('✅ Usuario admin creado:');
    console.log('   Email: admin@bsi.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  IMPORTANTE: Cambiar la contraseña en producción');

    // Verificar la estructura
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'usuarios'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\nEstructura de la tabla usuarios:');
    console.table(columns);

    // Verificar usuarios creados
    const [users] = await connection.query('SELECT id, email, nombre, apellido, rol, es_super_usuario FROM usuarios');
    console.log('\nUsuarios en la tabla:');
    console.table(users);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
createUsuariosTable().catch(console.error);