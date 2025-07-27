const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function showMenuStructure() {
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
    
    console.log('🏗️  ESTRUCTURA DE NAVEGACIÓN EN BASE DE DATOS\n');
    console.log('=' .repeat(80));
    
    // 1. Sistema
    console.log('\n📁 SISTEMA (Páginas base)');
    console.log('-'.repeat(40));
    const [sistema] = await connection.execute(
      `SELECT titulo, ruta, componente, activo 
       FROM BSI_CONFIGURACION_MODULOS 
       WHERE modulo = 'sistema' 
       ORDER BY orden`
    );
    
    sistema.forEach(row => {
      console.log(`  ${row.activo ? '✓' : '✗'} ${row.titulo}`);
      console.log(`     Ruta: ${row.ruta}`);
      console.log(`     Componente: ${row.componente}`);
    });
    
    // 2. Menú Principal
    console.log('\n\n📁 MENÚ PRINCIPAL');
    console.log('-'.repeat(40));
    const [mainMenu] = await connection.execute(
      `SELECT titulo, ruta, componente, activo, metadatos 
       FROM BSI_CONFIGURACION_MODULOS 
       WHERE modulo = 'main-menu' 
       ORDER BY orden`
    );
    
    mainMenu.forEach(row => {
      const meta = typeof row.metadatos === 'string' ? JSON.parse(row.metadatos || '{}') : row.metadatos || {};
      console.log(`  ${row.activo ? '✓' : '✗'} ${row.titulo}`);
      console.log(`     Ruta: ${row.ruta}`);
      console.log(`     Componente: ${row.componente}`);
      if (meta.icono) console.log(`     Icono: ${meta.icono}`);
      if (!row.activo) console.log(`     Estado: DESHABILITADO`);
    });
    
    // 3. Backoffice
    console.log('\n\n📁 ADMINISTRACIÓN BACKOFFICE');
    console.log('-'.repeat(40));
    const [backoffice] = await connection.execute(
      `SELECT titulo, ruta, componente, metadatos 
       FROM BSI_CONFIGURACION_MODULOS 
       WHERE modulo = 'backoffice' 
       ORDER BY orden`
    );
    
    backoffice.forEach(row => {
      const meta = typeof row.metadatos === 'string' ? JSON.parse(row.metadatos || '{}') : row.metadatos || {};
      console.log(`  ✓ ${row.titulo}`);
      console.log(`     Ruta: ${row.ruta}`);
      console.log(`     Componente: ${row.componente}`);
      if (meta.icono) console.log(`     Icono: ${meta.icono}`);
    });
    
    // 4. Pagos Múltiples
    console.log('\n\n📁 PAGOS MÚLTIPLES (Submenu)');
    console.log('-'.repeat(40));
    const [pagosMultiples] = await connection.execute(
      `SELECT titulo, ruta, componente, metadatos 
       FROM BSI_CONFIGURACION_MODULOS 
       WHERE modulo = 'pagosmultiples' 
       ORDER BY orden`
    );
    
    pagosMultiples.forEach(row => {
      const meta = typeof row.metadatos === 'string' ? JSON.parse(row.metadatos || '{}') : row.metadatos || {};
      console.log(`  ✓ ${row.titulo}`);
      console.log(`     Ruta: ${row.ruta}`);
      console.log(`     Componente: ${row.componente}`);
      if (meta.icono) console.log(`     Icono: ${meta.icono}`);
      if (meta.tipoPago) console.log(`     Tipo: ${meta.tipoPago}`);
    });
    
    // Resumen
    console.log('\n\n📊 RESUMEN');
    console.log('='.repeat(80));
    const [summary] = await connection.execute(
      `SELECT 
        modulo, 
        COUNT(*) as total,
        SUM(activo) as activas,
        COUNT(*) - SUM(activo) as inactivas
       FROM BSI_CONFIGURACION_MODULOS 
       GROUP BY modulo`
    );
    
    console.log('Módulo'.padEnd(20) + 'Total'.padEnd(10) + 'Activas'.padEnd(10) + 'Inactivas');
    console.log('-'.repeat(50));
    summary.forEach(row => {
      console.log(
        row.modulo.padEnd(20) + 
        row.total.toString().padEnd(10) + 
        row.activas.toString().padEnd(10) + 
        row.inactivas.toString()
      );
    });
    
    // Total general
    const [total] = await connection.execute(
      'SELECT COUNT(*) as total FROM BSI_CONFIGURACION_MODULOS'
    );
    console.log('-'.repeat(50));
    console.log(`TOTAL GENERAL: ${total[0].total} registros`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

showMenuStructure();