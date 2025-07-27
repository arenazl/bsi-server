const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function insertFullMainMenu() {
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

    // Primero, limpiar las configuraciones del menú principal existentes
    console.log('🗑️  Limpiando configuraciones anteriores del menú principal...');
    await connection.execute(
      "DELETE FROM BSI_CONFIGURACION_MODULOS WHERE modulo = 'menu-principal'"
    );

    // Insertar configuraciones basadas en mainmenu.json
    console.log('\n📝 Insertando opciones del menú principal...');
    
    const insertSQL = `
      INSERT INTO BSI_CONFIGURACION_MODULOS (modulo, ruta, componente, titulo, descripcion, orden, activo, metadatos) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const menuOptions = [
      // Alta De Cuentas Masiva (Becas)
      ['menu-principal', '/dinamicModule/altas-masivas', 'DinamicModuleComponent', 
       'Alta De Cuentas Masiva (Becas)', 'Creá tu archivo de altas de cuentas bancarias', 
       1, true, 
       JSON.stringify({
         icono: 'fa-file-alt',
         tipoModulo: 'ALTAS',
         subItems: [{
           description: 'Archivo de alta de cuentas',
           link: '/dinamicModule/altas-masivas',
           icono: 'fa-file-alt'
         }]
       })
      ],

      // Pagos Múltiples
      ['menu-principal', '/dinamicModule/pagosmultiples', 'DinamicModuleComponent', 
       'Pagos Múltiples', 'Generá tus archivos de pagos', 
       2, true, 
       JSON.stringify({
         icono: 'fa-file-invoice-dollar',
         tipoModulo: 'PAGOS',
         subItems: [{
           description: 'Pagos Múltiples',
           link: '/dinamicModule/pagosmultiples',
           icono: 'fa-file-invoice-dollar'
         }]
       })
      ],

      // Transferencias Inmediatas (deshabilitado)
      ['menu-principal', '/auditoria/0', 'AuditoriaComponent', 
       'Transferencias Inmediatas', 'Confeccioná tus archivos TIM-BIPI', 
       3, false, 
       JSON.stringify({
         icono: 'fa-exchange-alt',
         tipoModulo: 'TRANSFERENCIAS',
         subItems: [
           {
             description: 'el Historial',
             link: '/auditoria/0',
             icono: 'fa-file-signature'
           },
           {
             description: 'una Nueva Carga',
             link: '/legajo/add/0',
             icono: 'fa-upload'
           }
         ]
       })
      ],

      // Administración Backoffice
      ['menu-principal', '/backoffice', 'BackofficeComponent', 
       'Administración Backoffice', 'Gestioná', 
       4, true, 
       JSON.stringify({
         icono: 'fa-cogs',
         tipoModulo: 'ADMIN',
         subItems: [
           {
             description: 'Municipios',
             link: '/organismoManagement',
             icono: 'fa-building'
           },
           {
             description: 'Contratos',
             link: '/contratoManagement',
             icono: 'fa-file-contract'
           },
           {
             description: 'Usuarios',
             link: '/userManagement',
             icono: 'fa-users'
           }
         ]
       })
      ],

      // Tableros
      ['menu-principal', '/dashboard', 'DashboardComponent', 
       'Tableros', 'Administrá los pagos de tus abonados', 
       5, true, 
       JSON.stringify({
         icono: 'fa-chart-line',
         tipoModulo: 'DASHBOARD',
         subItems: [{
           description: 'Tablero de Pagos',
           link: '/dashboard',
           icono: 'fa-money-check'
         }]
       })
      ],

      // Códigos De Barras (deshabilitado)
      ['menu-principal', '/seguros', 'SegurosComponent', 
       'Códigos De Barras', 'Elaboramos o actualizamos tus boletas de pago', 
       6, false, 
       JSON.stringify({
         icono: 'fa-barcode',
         tipoModulo: 'BARCODE',
         subItems: [{
           description: 'Código de barras',
           link: '/seguros',
           icono: 'fa-barcode'
         }]
       })
      ],

      // Validación De CBU (deshabilitado)
      ['menu-principal', '/inversiones', 'InversionesComponent', 
       'Validación De CBU', 'Eliminá los rechazos de las transferencias', 
       7, false, 
       JSON.stringify({
         icono: 'fa-check-circle',
         tipoModulo: 'VALIDACION',
         subItems: [{
           description: 'Validación de CBU',
           link: '/inversiones',
           icono: 'fa-check-circle'
         }]
       })
      ],

      // Servicio De Consultoría (deshabilitado)
      ['menu-principal', '/movimientos', 'MovimientosComponent', 
       'Servicio De Consultoría', 'Disminuí la carga operativa', 
       8, false, 
       JSON.stringify({
         icono: 'fa-concierge-bell',
         tipoModulo: 'CONSULTORIA',
         subItems: [{
           description: 'Servicio de Consultoría',
           link: '/movimientos',
           icono: 'fa-concierge-bell'
         }]
       })
      ],

      // Migración De Archivos (deshabilitado)
      ['menu-principal', '/depositos', 'DepositosComponent', 
       'Migración De Archivos', 'Optimizá los procesos de migración', 
       9, false, 
       JSON.stringify({
         icono: 'fa-database',
         tipoModulo: 'MIGRACION',
         subItems: [{
           description: 'Migración de archivos',
           link: '/depositos',
           icono: 'fa-database'
         }]
       })
      ]
    ];

    // Insertar cada opción del menú
    for (const option of menuOptions) {
      try {
        await connection.execute(insertSQL, option);
        console.log(`   ✓ ${option[3]} agregado (${option[5] ? 'Activo' : 'Inactivo'})`);
      } catch (error) {
        console.error(`   ❌ Error al insertar ${option[3]}:`, error.message);
      }
    }

    // Mostrar todas las configuraciones del menú principal
    console.log('\n📊 Configuraciones del menú principal:');
    const [menuConfigs] = await connection.execute(
      `SELECT titulo, ruta, activo, orden 
       FROM BSI_CONFIGURACION_MODULOS 
       WHERE modulo = 'menu-principal'
       ORDER BY orden`
    );
    
    menuConfigs.forEach(config => {
      const estado = config.activo ? '✅' : '❌';
      console.log(`   ${estado} ${config.orden}. ${config.titulo}`);
    });

    console.log('\n✅ Menú principal configurado exitosamente');

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
insertFullMainMenu();