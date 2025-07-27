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
      multipleStatements: true // Permitir múltiples sentencias
    };

    // Crear conexión
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conexión establecida');

    // Primero verificar si el SP existe y eliminarlo
    console.log('🔍 Verificando stored procedure existente...');
    try {
      await connection.execute('DROP PROCEDURE IF EXISTS sp_get_navigation_config');
      console.log('✓ Stored procedure anterior eliminado');
    } catch (e) {
      // Ignorar si no existe
    }

    // Crear stored procedure usando query en lugar de execute
    console.log('🔧 Creando stored procedure sp_get_navigation_config...');
    
    const createProcedureSQL = `
    CREATE PROCEDURE sp_get_navigation_config(
      IN p_modulo VARCHAR(50),
      IN p_idUsuario INT,
      IN p_idOrganismo INT
    )
    BEGIN
      -- Por ahora retornamos toda la configuración del módulo
      -- En el futuro se puede filtrar por permisos del usuario
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
    
    // Usar query en lugar de execute para stored procedures
    await connection.query(createProcedureSQL);
    console.log('✅ Stored procedure creado exitosamente');

    // Probar el stored procedure
    console.log('\n🧪 Probando stored procedure con módulo "pagos"...');
    const [results] = await connection.execute('CALL sp_get_navigation_config(?, ?, ?)', ['pagos', 1, 1]);
    
    console.log('📑 Resultados de prueba:');
    if (results && results[0]) {
      results[0].forEach(row => {
        console.log(`   - ${row.titulo} (${row.ruta})`);
      });
    }

    console.log('\n✅ ¡Stored procedure creado y probado exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
createStoredProcedure();