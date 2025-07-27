const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createNavigationTable() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos defaultdev...');
    
    // Configuración de conexión
    const connectionConfig = {
      host: process.env.DB_PRIMARY_HOST,
      port: parseInt(process.env.DB_PRIMARY_PORT),
      user: process.env.DB_PRIMARY_USER,
      password: process.env.DB_PRIMARY_PASSWORD,
      database: process.env.DB_PRIMARY_NAME,
      ssl: {
        ca: fs.readFileSync(path.resolve(__dirname, '../src/DB/crt/ca.pem'))
      }
    };

    // Crear conexión
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conexión establecida');

    // Verificar si la tabla ya existe
    console.log('\n📊 Verificando tabla existente...');
    const [tables] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'BSI_CONFIGURACION_MODULOS'",
      [process.env.DB_PRIMARY_NAME]
    );
    
    if (tables[0].count > 0) {
      console.log('✅ La tabla BSI_CONFIGURACION_MODULOS ya existe');
      
      // Mostrar registros actuales
      const [registros] = await connection.execute('SELECT modulo, titulo, ruta FROM BSI_CONFIGURACION_MODULOS ORDER BY modulo, orden');
      console.log('\n📑 Configuraciones existentes:');
      registros.forEach(reg => {
        console.log(`   - ${reg.modulo}: ${reg.titulo} (${reg.ruta})`);
      });
    } else {
      console.log('❌ La tabla no existe. Ejecuta primero el script create-navigation-db.js');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
createNavigationTable();