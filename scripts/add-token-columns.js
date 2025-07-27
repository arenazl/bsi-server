const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function addTokenColumns() {
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

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../database/migrations/add_token_to_users.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Dividir el contenido en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`Ejecutando statement ${i + 1}/${statements.length}...`);
        const [results] = await connection.query(statement);
        
        // Si es un SELECT, mostrar el resultado
        if (statement.includes('SELECT') && results.length > 0) {
          console.log('Resultado:', results[0]);
        }
      } catch (error) {
        console.error(`Error en statement ${i + 1}:`, error.message);
        // Continuar con el siguiente statement
      }
    }

    console.log('\n✅ Migración de columnas de token completada');

    // Verificar la estructura de la tabla
    console.log('\nEstructura actual de la tabla Users:');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
      AND table_name = 'Users'
      ORDER BY ORDINAL_POSITION
    `);

    console.table(columns);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar la función
addTokenColumns().catch(console.error);