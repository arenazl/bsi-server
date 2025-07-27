const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createSuperAdmin() {
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

    // Generar password hash
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si ya existe un usuario admin
    const [existing] = await connection.query(
      'SELECT id FROM Users WHERE username = ? OR email = ?',
      ['admin', 'admin@bsi.com']
    );

    if (existing && existing.length > 0) {
      console.log('⚠️  Ya existe un usuario admin');
      
      // Actualizar para asegurar que sea super usuario
      await connection.query(
        'UPDATE Users SET is_super_user = 1 WHERE username = ? OR email = ?',
        ['admin', 'admin@bsi.com']
      );
      
      console.log('✅ Usuario admin actualizado como super usuario');
    } else {
      // Crear nuevo usuario admin
      await connection.query(`
        INSERT INTO Users (
          username, 
          password, 
          nombre, 
          apellido, 
          email, 
          is_super_user,
          id_organismo,
          activo,
          fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        'admin',
        hashedPassword,
        'Administrador',
        'Sistema',
        'admin@bsi.com',
        1,  // is_super_user = true
        1,  // id_organismo default
        1   // activo = true
      ]);

      console.log('✅ Usuario super admin creado exitosamente');
    }

    // Mostrar información del usuario
    console.log('\n📋 Credenciales del Super Admin:');
    console.log('   Usuario: admin');
    console.log('   Email: admin@bsi.com');
    console.log('   Password: admin123');
    console.log('   Super Usuario: Sí');
    console.log('\n⚠️  IMPORTANTE: Cambiar la contraseña en producción\n');

    // Verificar usuarios existentes
    const [users] = await connection.query(`
      SELECT id, username, email, nombre, apellido, is_super_user 
      FROM Users 
      ORDER BY id DESC 
      LIMIT 5
    `);

    if (users && users.length > 0) {
      console.log('Últimos usuarios en la tabla:');
      console.table(users);
    }

  } catch (error) {
    console.error('Error:', error);
    
    // Si la tabla no existe, intentar con el SP tradicional
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n⚠️  La tabla Users no existe.');
      console.log('Para el sistema de login tradicional, necesitas crear el usuario en la tabla correspondiente.');
      console.log('Contacta al administrador de la base de datos.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
createSuperAdmin().catch(console.error);