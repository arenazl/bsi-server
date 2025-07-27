const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createStoredProcedure() {
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
      },
      multipleStatements: true
    };

    // Crear conexión
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conexión establecida');

    // Eliminar SP si existe
    console.log('🗑️  Eliminando stored procedure anterior si existe...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_get_navigation_config');
    console.log('✓ Limpieza completada');

    // Crear el stored procedure
    console.log('🔧 Creando stored procedure...');
    
    const spSQL = `
CREATE PROCEDURE sp_get_navigation_config(
    IN p_modulo VARCHAR(50),
    IN p_idUsuario INT,
    IN p_idOrganismo INT
)
BEGIN
    SELECT 
        IdConfiguracion,
        modulo,
        ruta,
        componente,
        titulo,
        descripcion,
        orden,
        activo,
        requiereAutenticacion,
        metadatos
    FROM BSI_CONFIGURACION_MODULOS
    WHERE modulo = p_modulo
        AND activo = TRUE
    ORDER BY orden ASC;
END`;

    await connection.query(spSQL);
    console.log('✅ Stored procedure creado exitosamente');

    // Verificar que se creó
    console.log('\n🔍 Verificando stored procedure...');
    const [procedures] = await connection.query(
      "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = 'sp_get_navigation_config'",
      [process.env.DB_PRIMARY_NAME]
    );
    
    if (procedures.length > 0) {
      console.log('✅ Stored procedure verificado en la base de datos');
      
      // Probar el SP
      console.log('\n🧪 Ejecutando prueba con módulo "pagos"...');
      const [results] = await connection.query('CALL sp_get_navigation_config("pagos", 1, 1)');
      
      if (results && results.length > 0) {
        console.log('📑 Resultados:');
        results.forEach(row => {
          console.log(`   - ${row.titulo} (${row.ruta})`);
        });
      }
    }

    console.log('\n✅ ¡Proceso completado exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
createStoredProcedure();