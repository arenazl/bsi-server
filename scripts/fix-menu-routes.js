const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function fixMenuRoutes() {
  let connection;
  
  try {
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
    console.log('🔌 Conectado a la base de datos\n');

    // Ver la estructura actual
    console.log('📊 ESTRUCTURA ACTUAL:\n');
    const [current] = await connection.execute(`
      SELECT modulo, titulo, ruta, componente, activo
      FROM BSI_CONFIGURACION_MODULOS
      WHERE modulo IN ('main-menu', 'pagos-múltiples', 'alta-de-cuentas-masiva-becas', 
                       'administración-backoffice', 'tableros')
      ORDER BY modulo, orden
    `);
    
    console.log('MODULO | TITULO | RUTA | COMPONENTE');
    console.log('-'.repeat(80));
    current.forEach(row => {
      console.log(`${row.modulo} | ${row.titulo} | ${row.ruta || '(sin ruta)'} | ${row.componente || '(sin comp)'}`);
    });

    console.log('\n\n🔧 CORRECCIÓN NECESARIA:');
    console.log('Los items del menú principal necesitan tener la ruta de su primer hijo');
    console.log('cuando tienen solo 1 hijo, o una ruta de selección cuando tienen varios.\n');

    // Actualizar las rutas de los padres que tienen un solo hijo
    const updates = [
      {
        titulo: 'Alta De Cuentas Masiva (Becas)',
        ruta: '/dinamicModule/altas-masivas',
        componente: 'DinamicModuleComponent'
      },
      {
        titulo: 'Pagos Múltiples', 
        ruta: '/dinamicModule/pagosmultiples',
        componente: 'DinamicModuleComponent'
      },
      {
        titulo: 'Tableros',
        ruta: '/dashboard',
        componente: 'DashboardComponent'
      }
    ];

    console.log('📝 Actualizando rutas de los padres...\n');
    for (const update of updates) {
      await connection.execute(
        `UPDATE BSI_CONFIGURACION_MODULOS 
         SET ruta = ?, componente = ?
         WHERE modulo = 'main-menu' AND titulo = ?`,
        [update.ruta, update.componente, update.titulo]
      );
      console.log(`   ✓ ${update.titulo} → ${update.ruta}`);
    }

    // Para Administración Backoffice que tiene múltiples hijos, 
    // podría ir a una página de selección o al primer hijo
    await connection.execute(
      `UPDATE BSI_CONFIGURACION_MODULOS 
       SET ruta = '/backoffice', componente = 'BackofficeMenuComponent'
       WHERE modulo = 'main-menu' AND titulo = 'Administración Backoffice'`
    );
    console.log(`   ✓ Administración Backoffice → /backoffice (menú de selección)`);

    // Verificar cambios
    console.log('\n\n📊 ESTRUCTURA CORREGIDA:\n');
    const [fixed] = await connection.execute(`
      SELECT modulo, titulo, ruta, componente, activo
      FROM BSI_CONFIGURACION_MODULOS
      WHERE modulo = 'main-menu' AND activo = true
      ORDER BY orden
    `);
    
    console.log('TITULO | RUTA | COMPONENTE');
    console.log('-'.repeat(80));
    fixed.forEach(row => {
      console.log(`${row.titulo} | ${row.ruta} | ${row.componente}`);
    });

    console.log('\n✅ Rutas corregidas exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixMenuRoutes();