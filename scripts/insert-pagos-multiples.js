const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function insertPagosMultiplesOptions() {
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

    // Primero, limpiar las configuraciones de pagos-multiples existentes
    console.log('🗑️  Limpiando configuraciones anteriores de pagos múltiples...');
    await connection.execute(
      "DELETE FROM BSI_CONFIGURACION_MODULOS WHERE modulo = 'pagos-multiples'"
    );

    // Insertar configuraciones basadas en pagosmultiples.json
    console.log('\n📝 Insertando opciones de Pagos Múltiples...');
    
    const insertSQL = `
      INSERT INTO BSI_CONFIGURACION_MODULOS (modulo, ruta, componente, titulo, descripcion, orden, activo, metadatos) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const pagosOptions = [
      // Pago de Haberes
      ['pagos-multiples', '/xslImport/PAGO/HABERES', 'XslImportComponent', 
       'Pago de Haberes', 'Generación de archivos para Pago de Haberes', 
       1, true, 
       JSON.stringify({
         icono: 'fa-dollar-sign',
         tipoModulo: 'PAGO',
         tipoPago: 'HABERES',
         categoria: 'Haberes',
         requiereContrato: true
       })
      ],

      // Pago a Proveedores
      ['pagos-multiples', '/xslImport/PAGO/PROVEEDORES', 'XslImportComponent', 
       'Pago a Proveedores', 'Generación de archivos para Pago a Proveedores', 
       2, true, 
       JSON.stringify({
         icono: 'fa-clipboard-list',
         tipoModulo: 'PAGO',
         tipoPago: 'PROVEEDORES',
         categoria: 'Proveedores',
         requiereContrato: true
       })
      ],

      // Pago de Honorarios
      ['pagos-multiples', '/xslImport/PAGO/HONORARIOS', 'XslImportComponent', 
       'Pago de Honorarios', 'Generación de archivos para Pago de Honorarios', 
       3, true, 
       JSON.stringify({
         icono: 'fa-briefcase',
         tipoModulo: 'PAGO',
         tipoPago: 'HONORARIOS',
         categoria: 'Honorarios',
         requiereContrato: true
       })
      ],

      // Pago de Beneficios
      ['pagos-multiples', '/xslImport/PAGO/BENEFICIOS', 'XslImportComponent', 
       'Pago de Beneficios', 'Generación de archivos para Pago de Beneficios', 
       4, true, 
       JSON.stringify({
         icono: 'fa-gift',
         tipoModulo: 'PAGO',
         tipoPago: 'BENEFICIOS',
         categoria: 'Beneficios',
         requiereContrato: true
       })
      ],

      // Embargos Banco Provincia
      ['pagos-multiples', '/xslImport/PAGO/JUDICIALESBAPRO', 'XslImportComponent', 
       'Embargos Banco Provincia', 'Generación de archivos para Embargos Banco Provincia', 
       5, true, 
       JSON.stringify({
         icono: 'fa-university',
         tipoModulo: 'PAGO',
         tipoPago: 'JUDICIALESBAPRO',
         categoria: 'Embargos',
         banco: 'Banco Provincia',
         requiereContrato: true
       })
      ],

      // Embargos Otros Bancos
      ['pagos-multiples', '/xslImport/PAGO/JUDICIALESOTROS', 'XslImportComponent', 
       'Embargos Otros Bancos', 'Generación de archivos para Embargos Otros Bancos', 
       6, true, 
       JSON.stringify({
         icono: 'fa-balance-scale',
         tipoModulo: 'PAGO',
         tipoPago: 'JUDICIALESOTROS',
         categoria: 'Embargos',
         banco: 'Otros Bancos',
         requiereContrato: true
       })
      ],

      // Ver Pagos Anteriores
      ['pagos-multiples', '/xslVerified/PAGO/0', 'XslVerifiedComponent', 
       'Ver Pagos Anteriores', 'Revisa los pagos realizados', 
       7, true, 
       JSON.stringify({
         icono: 'fa-file-excel',
         tipoModulo: 'PAGO',
         esHistorial: true,
         requiereContrato: true
       })
      ]
    ];

    // Insertar cada opción
    for (const option of pagosOptions) {
      try {
        await connection.execute(insertSQL, option);
        console.log(`   ✓ ${option[3]} agregado`);
      } catch (error) {
        console.error(`   ❌ Error al insertar ${option[3]}:`, error.message);
      }
    }

    // Mostrar todas las configuraciones de pagos múltiples
    console.log('\n📊 Configuraciones de Pagos Múltiples:');
    const [pagosConfigs] = await connection.execute(
      `SELECT titulo, ruta, activo, orden 
       FROM BSI_CONFIGURACION_MODULOS 
       WHERE modulo = 'pagos-multiples'
       ORDER BY orden`
    );
    
    pagosConfigs.forEach(config => {
      const estado = config.activo ? '✅' : '❌';
      console.log(`   ${estado} ${config.orden}. ${config.titulo}`);
    });

    console.log('\n✅ Pagos Múltiples configurado exitosamente');

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
insertPagosMultiplesOptions();