const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testStoredProcedure() {
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

    // Probar el stored procedure con diferentes módulos
    const modulos = ['pagos', 'nomina', 'cuentas'];
    
    for (const modulo of modulos) {
      console.log(`\n📊 Probando módulo: ${modulo}`);
      
      try {
        // Usar execute con parámetros
        const [results] = await connection.execute(
          'CALL sp_get_navigation_config(?, ?, ?)', 
          [modulo, 1, 1]
        );
        
        if (results && results[0] && results[0].length > 0) {
          console.log(`✅ Configuraciones encontradas para ${modulo}:`);
          results[0].forEach(row => {
            console.log(`   - ${row.titulo}`);
            console.log(`     Ruta: ${row.ruta}`);
            console.log(`     Componente: ${row.componente}`);
          });
        } else {
          console.log(`⚠️  No se encontraron configuraciones para ${modulo}`);
        }
      } catch (error) {
        console.error(`❌ Error al probar ${modulo}:`, error.message);
      }
    }
    
    // También mostrar todas las configuraciones en la tabla
    console.log('\n📑 Todas las configuraciones en la tabla:');
    const [allConfigs] = await connection.execute(
      'SELECT modulo, titulo, ruta, activo FROM BSI_CONFIGURACION_MODULOS ORDER BY modulo, orden'
    );
    
    allConfigs.forEach(config => {
      console.log(`   - [${config.modulo}] ${config.titulo} - Activo: ${config.activo ? 'Sí' : 'No'}`);
    });

    console.log('\n✅ Pruebas completadas');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
testStoredProcedure();