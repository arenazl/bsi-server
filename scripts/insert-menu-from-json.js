const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function insertMenuFromJson() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos defaultdev...');
    
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
    console.log('✅ Conexión establecida');

    // Limpiar configuraciones existentes
    console.log('\n🗑️  Limpiando configuraciones existentes...');
    await connection.execute('DELETE FROM BSI_CONFIGURACION_MODULOS');

    const insertSQL = `
      INSERT INTO BSI_CONFIGURACION_MODULOS (modulo, ruta, componente, titulo, descripcion, orden, activo, metadatos) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 1. SISTEMA - Páginas base
    console.log('\n📝 Insertando páginas del sistema...');
    const sistemaPages = [
      ['sistema', '/login', 'LoginComponent', 'Login', 'Pantalla de inicio de sesión', 1, true, 
        JSON.stringify({ requiereAutenticacion: false })
      ],
      ['sistema', '/main-menu', 'MainMenuComponent', 'Menú Principal', 'Página principal después del login', 2, true, 
        JSON.stringify({ requiereAutenticacion: true })
      ]
    ];

    for (const page of sistemaPages) {
      await connection.execute(insertSQL, page);
      console.log(`   ✓ ${page[3]}`);
    }

    // 2. MENU PRINCIPAL - Basado en mainmenu.json
    console.log('\n📝 Insertando opciones del menú principal...');
    
    // Datos del mainmenu.json
    const mainMenuItems = [
      {
        modulo: 'main-menu',
        ruta: '/dinamicModule/altas-masivas', 
        componente: 'DinamicModuleComponent',
        titulo: 'Alta De Cuentas Masiva (Becas)',
        descripcion: 'Creá tu archivo de altas de cuentas bancarias',
        orden: 1,
        activo: true,
        metadatos: {
          icono: 'fa-file-alt',
          tipoOperacion: 'altas-masivas'
        }
      },
      {
        modulo: 'main-menu',
        ruta: '/dinamicModule/pagosmultiples',
        componente: 'DinamicModuleComponent', 
        titulo: 'Pagos Múltiples',
        descripcion: 'Generá tus archivos de pagos',
        orden: 2,
        activo: true,
        metadatos: {
          icono: 'fa-file-invoice-dollar',
          tipoOperacion: 'pagosmultiples',
          mostrarSubMenu: true // Indica que tiene submenu (pagosmultiples.json)
        }
      },
      {
        modulo: 'main-menu',
        ruta: '/transferencias',
        componente: 'DisabledComponent', // Deshabilitado
        titulo: 'Transferencias Inmediatas',
        descripcion: 'Confeccioná tus archivos TIM-BIPI',
        orden: 3,
        activo: false,
        metadatos: {
          icono: 'fa-exchange-alt'
        }
      },
      {
        modulo: 'main-menu',
        ruta: '/backoffice',
        componente: 'BackofficeMenuComponent', // Tiene submenu
        titulo: 'Administración Backoffice',
        descripcion: 'Gestioná',
        orden: 4,
        activo: true,
        metadatos: {
          icono: 'fa-cogs',
          subItems: [
            { descripcion: 'Municipios', link: '/organismoManagement', icono: 'fa-building' },
            { descripcion: 'Contratos', link: '/contratoManagement', icono: 'fa-file-contract' },
            { descripcion: 'Usuarios', link: '/userManagement', icono: 'fa-users' }
          ]
        }
      },
      {
        modulo: 'main-menu',
        ruta: '/dashboard',
        componente: 'DashboardComponent',
        titulo: 'Tableros',
        descripcion: 'Administrá los pagos de tus abonados',
        orden: 5,
        activo: true,
        metadatos: {
          icono: 'fa-chart-line'
        }
      },
      {
        modulo: 'main-menu',
        ruta: '/seguros',
        componente: 'SegurosComponent',
        titulo: 'Códigos De Barras',
        descripcion: 'Elaboramos o actualizamos tus boletas de pago',
        orden: 6,
        activo: false,
        metadatos: {
          icono: 'fa-barcode'
        }
      },
      {
        modulo: 'main-menu',
        ruta: '/inversiones',
        componente: 'InversionesComponent',
        titulo: 'Validación De CBU',
        descripcion: 'Eliminá los rechazos de las transferencias',
        orden: 7,
        activo: false,
        metadatos: {
          icono: 'fa-check-circle'
        }
      },
      {
        modulo: 'main-menu',
        ruta: '/movimientos',
        componente: 'MovimientosComponent',
        titulo: 'Servicio De Consultoría',
        descripcion: 'Disminuí la carga operativa',
        orden: 8,
        activo: false,
        metadatos: {
          icono: 'fa-concierge-bell'
        }
      },
      {
        modulo: 'main-menu',
        ruta: '/depositos',
        componente: 'DepositosComponent',
        titulo: 'Migración De Archivos',
        descripcion: 'Optimizá los procesos de migración',
        orden: 9,
        activo: false,
        metadatos: {
          icono: 'fa-database'
        }
      }
    ];

    for (const item of mainMenuItems) {
      await connection.execute(insertSQL, [
        item.modulo,
        item.ruta,
        item.componente,
        item.titulo,
        item.descripcion,
        item.orden,
        item.activo,
        JSON.stringify(item.metadatos)
      ]);
      console.log(`   ${item.activo ? '✓' : '○'} ${item.titulo}`);
    }

    // 3. SUBMENU BACKOFFICE
    console.log('\n📝 Insertando opciones de backoffice...');
    const backofficeItems = [
      ['backoffice', '/organismoManagement', 'OrganismoManagementComponent', 'Municipios', 
       'Gestión de organismos', 1, true, JSON.stringify({ icono: 'fa-building' })],
      ['backoffice', '/contratoManagement', 'ContratoManagementComponent', 'Contratos', 
       'Gestión de contratos', 2, true, JSON.stringify({ icono: 'fa-file-contract' })],
      ['backoffice', '/userManagement', 'UserManagementComponent', 'Usuarios', 
       'Gestión de usuarios', 3, true, JSON.stringify({ icono: 'fa-users' })]
    ];

    for (const item of backofficeItems) {
      await connection.execute(insertSQL, item);
      console.log(`   ✓ ${item[3]}`);
    }

    // 4. SUBMENU PAGOS MULTIPLES - Basado en pagosmultiples.json
    console.log('\n📝 Insertando opciones de pagos múltiples...');
    const pagosMultiplesItems = [
      {
        modulo: 'pagosmultiples',
        ruta: '/xslImport/PAGO/HABERES',
        componente: 'XslImportComponent',
        titulo: 'Pago de Haberes',
        descripcion: 'Generación de archivos para Pago de Haberes',
        orden: 1,
        activo: true,
        metadatos: {
          icono: 'fa-dollar-sign',
          tipoModulo: 'PAGO',
          tipoPago: 'HABERES'
        }
      },
      {
        modulo: 'pagosmultiples',
        ruta: '/xslImport/PAGO/PROVEEDORES',
        componente: 'XslImportComponent',
        titulo: 'Pago a Proveedores',
        descripcion: 'Generación de archivos para Pago a Proveedores',
        orden: 2,
        activo: true,
        metadatos: {
          icono: 'fa-clipboard-list',
          tipoModulo: 'PAGO',
          tipoPago: 'PROVEEDORES'
        }
      },
      {
        modulo: 'pagosmultiples',
        ruta: '/xslImport/PAGO/HONORARIOS',
        componente: 'XslImportComponent',
        titulo: 'Pago de Honorarios',
        descripcion: 'Generación de archivos para Pago de Honorarios',
        orden: 3,
        activo: true,
        metadatos: {
          icono: 'fa-briefcase',
          tipoModulo: 'PAGO',
          tipoPago: 'HONORARIOS'
        }
      },
      {
        modulo: 'pagosmultiples',
        ruta: '/xslImport/PAGO/BENEFICIOS',
        componente: 'XslImportComponent',
        titulo: 'Pago de Beneficios',
        descripcion: 'Generación de archivos para Pago de Beneficios',
        orden: 4,
        activo: true,
        metadatos: {
          icono: 'fa-gift',
          tipoModulo: 'PAGO',
          tipoPago: 'BENEFICIOS'
        }
      },
      {
        modulo: 'pagosmultiples',
        ruta: '/xslImport/PAGO/JUDICIALESBAPRO',
        componente: 'XslImportComponent',
        titulo: 'Embargos Banco Provincia',
        descripcion: 'Generación de archivos para Embargos Banco Provincia',
        orden: 5,
        activo: true,
        metadatos: {
          icono: 'fa-university',
          tipoModulo: 'PAGO',
          tipoPago: 'JUDICIALESBAPRO'
        }
      },
      {
        modulo: 'pagosmultiples',
        ruta: '/xslImport/PAGO/JUDICIALESOTROS',
        componente: 'XslImportComponent',
        titulo: 'Embargos Otros Bancos',
        descripcion: 'Generación de archivos para Embargos Otros Bancos',
        orden: 6,
        activo: true,
        metadatos: {
          icono: 'fa-balance-scale',
          tipoModulo: 'PAGO',
          tipoPago: 'JUDICIALESOTROS'
        }
      },
      {
        modulo: 'pagosmultiples',
        ruta: '/xslVerified/PAGO/0',
        componente: 'XslVerifiedComponent',
        titulo: 'Ver Pagos Anteriores',
        descripcion: 'Revisa los pagos realizados',
        orden: 7,
        activo: true,
        metadatos: {
          icono: 'fa-file-excel',
          tipoModulo: 'PAGO',
          esHistorial: true
        }
      }
    ];

    for (const item of pagosMultiplesItems) {
      await connection.execute(insertSQL, [
        item.modulo,
        item.ruta,
        item.componente,
        item.titulo,
        item.descripcion,
        item.orden,
        item.activo,
        JSON.stringify(item.metadatos)
      ]);
      console.log(`   ✓ ${item.titulo}`);
    }

    // Mostrar resumen
    console.log('\n📊 Resumen:');
    const [summary] = await connection.execute(
      `SELECT modulo, COUNT(*) as total 
       FROM BSI_CONFIGURACION_MODULOS 
       GROUP BY modulo 
       ORDER BY FIELD(modulo, 'sistema', 'main-menu', 'backoffice', 'pagosmultiples')`
    );
    
    summary.forEach(row => {
      console.log(`   - ${row.modulo}: ${row.total} opciones`);
    });

    console.log('\n✅ Menú insertado correctamente desde JSONs');

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
insertMenuFromJson();