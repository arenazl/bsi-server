const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function updateMenuStructure() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    
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

    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conexión establecida\n');

    // Actualizar "Administración Backoffice" a "Administración Usuarios"
    console.log('🔧 Actualizando menú de Administración...');
    
    // Primero actualizar el padre
    await connection.execute(`
      UPDATE BSI_CONFIGURACION_MODULOS 
      SET titulo = 'Administración Usuarios',
          descripcion = 'Gestioná el alta y las cargas de los usuario'
      WHERE titulo = 'Administración Backoffice'
    `);
    
    // Eliminar los items "Municipios" y "Contratos" (hijos de Administración)
    await connection.execute(`
      DELETE FROM BSI_CONFIGURACION_MODULOS 
      WHERE titulo IN ('Municipios', 'Contratos')
        AND padre_id IN (
          SELECT IdConfiguracion 
          FROM (SELECT IdConfiguracion FROM BSI_CONFIGURACION_MODULOS WHERE titulo = 'Administración Usuarios') as temp
        )
    `);
    
    console.log('✅ Estructura del menú actualizada');
    
    // Verificar la estructura actualizada
    console.log('\n📊 ESTRUCTURA ACTUALIZADA:\n');
    const [items] = await connection.execute(`
      SELECT 
        n.titulo,
        n.descripcion,
        n.activo,
        n.padre_id,
        p.titulo as padre_titulo,
        JSON_EXTRACT(n.metadatos, '$.nivel') as nivel
      FROM BSI_CONFIGURACION_MODULOS n
      LEFT JOIN BSI_CONFIGURACION_MODULOS p ON n.padre_id = p.IdConfiguracion
      WHERE JSON_EXTRACT(n.metadatos, '$.nivel') = 2
         OR (JSON_EXTRACT(n.metadatos, '$.nivel') = 3 
             AND p.titulo = 'Administración Usuarios')
      ORDER BY n.orden
    `);
    
    items.forEach(item => {
      if (item.nivel == 2) {
        console.log(`\n${item.activo ? '✓' : '✗'} ${item.titulo}`);
        console.log(`   ${item.descripcion}`);
      } else {
        console.log(`   └─ ${item.titulo}`);
      }
    });

    console.log('\n✅ Actualización completada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateMenuStructure();