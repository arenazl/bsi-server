const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function fixMenuStructure() {
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

    // Limpiar todo y empezar de nuevo con estructura correcta
    console.log('\n🗑️  Limpiando configuraciones existentes...');
    await connection.execute('DELETE FROM BSI_CONFIGURACION_MODULOS');

    console.log('\n📝 Insertando estructura de navegación correcta...');
    
    const insertSQL = `
      INSERT INTO BSI_CONFIGURACION_MODULOS (modulo, ruta, componente, titulo, descripcion, orden, activo, metadatos) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // NIVEL 0: Sistema
    const sistemaOptions = [
      ['sistema', '/login', 'LoginComponent', 'Login', 'Pantalla de inicio de sesión', 1, true, 
        JSON.stringify({ nivel: 0, requiereAutenticacion: false })
      ],
      ['sistema', '/main-menu', 'MainMenuComponent', 'Menú Principal', 'Menú principal del sistema', 2, true, 
        JSON.stringify({ nivel: 0, requiereAutenticacion: true })
      ]
    ];

    // NIVEL 1: Opciones del menú principal (estas NO tienen componente directo, llevan a selección de contratos)
    const menuPrincipalOptions = [
      ['main-menu', '/contratos/altas-masivas', 'ContratosComponent', 'Alta De Cuentas Masiva (Becas)', 
       'Creá tu archivo de altas de cuentas bancarias', 1, true, 
        JSON.stringify({ 
          nivel: 1, 
          icono: 'fa-file-alt',
          moduloDestino: 'altas-masivas',
          requiereSeleccionContrato: true
        })
      ],
      
      ['main-menu', '/contratos/pagos-multiples', 'ContratosComponent', 'Pagos Múltiples', 
       'Generá tus archivos de pagos', 2, true, 
        JSON.stringify({ 
          nivel: 1, 
          icono: 'fa-file-invoice-dollar',
          moduloDestino: 'pagos-multiples',
          requiereSeleccionContrato: true
        })
      ],
      
      ['main-menu', '/backoffice', 'BackofficeMenuComponent', 'Administración Backoffice', 
       'Gestioná municipios, contratos y usuarios', 3, true, 
        JSON.stringify({ 
          nivel: 1, 
          icono: 'fa-cogs',
          requiereSeleccionContrato: false,
          submodulos: ['organismos', 'contratos', 'usuarios']
        })
      ],
      
      ['main-menu', '/dashboard', 'DashboardComponent', 'Tableros', 
       'Administrá los pagos de tus abonados', 4, true, 
        JSON.stringify({ 
          nivel: 1, 
          icono: 'fa-chart-line',
          requiereSeleccionContrato: false
        })
      ]
    ];

    // NIVEL 2: Opciones después de seleccionar contrato
    const contratosOptions = [
      // Opciones para Altas Masivas
      ['altas-masivas', '/dinamicModule/altas-masivas', 'DinamicModuleComponent', 
       'Archivo de alta de cuentas', 'Generar archivo de altas masivas', 1, true, 
        JSON.stringify({ 
          nivel: 2, 
          icono: 'fa-file-alt',
          tipoModulo: 'CUENTA',
          operacion: 'IMPORT'
        })
      ],
      
      // Opciones para Pagos Múltiples (todas las que ya insertamos)
      ['pagos-multiples', '/xslImport/PAGO/HABERES', 'XslImportComponent', 
       'Pago de Haberes', 'Generación de archivos para Pago de Haberes', 1, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-dollar-sign', tipoModulo: 'PAGO', tipoPago: 'HABERES' })
      ],
      
      ['pagos-multiples', '/xslImport/PAGO/PROVEEDORES', 'XslImportComponent', 
       'Pago a Proveedores', 'Generación de archivos para Pago a Proveedores', 2, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-clipboard-list', tipoModulo: 'PAGO', tipoPago: 'PROVEEDORES' })
      ],
      
      ['pagos-multiples', '/xslImport/PAGO/HONORARIOS', 'XslImportComponent', 
       'Pago de Honorarios', 'Generación de archivos para Pago de Honorarios', 3, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-briefcase', tipoModulo: 'PAGO', tipoPago: 'HONORARIOS' })
      ],
      
      ['pagos-multiples', '/xslImport/PAGO/BENEFICIOS', 'XslImportComponent', 
       'Pago de Beneficios', 'Generación de archivos para Pago de Beneficios', 4, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-gift', tipoModulo: 'PAGO', tipoPago: 'BENEFICIOS' })
      ],
      
      ['pagos-multiples', '/xslImport/PAGO/JUDICIALESBAPRO', 'XslImportComponent', 
       'Embargos Banco Provincia', 'Generación de archivos para Embargos Banco Provincia', 5, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-university', tipoModulo: 'PAGO', tipoPago: 'JUDICIALESBAPRO' })
      ],
      
      ['pagos-multiples', '/xslImport/PAGO/JUDICIALESOTROS', 'XslImportComponent', 
       'Embargos Otros Bancos', 'Generación de archivos para Embargos Otros Bancos', 6, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-balance-scale', tipoModulo: 'PAGO', tipoPago: 'JUDICIALESOTROS' })
      ],
      
      ['pagos-multiples', '/xslVerified/PAGO/0', 'XslVerifiedComponent', 
       'Ver Pagos Anteriores', 'Revisa los pagos realizados', 7, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-file-excel', tipoModulo: 'PAGO', esHistorial: true })
      ]
    ];

    // NIVEL 3: Opciones de backoffice (no requieren contrato)
    const backofficeOptions = [
      ['backoffice', '/organismoManagement', 'OrganismoManagementComponent', 
       'Municipios', 'Gestión de organismos/municipios', 1, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-building' })
      ],
      
      ['backoffice', '/contratoManagement', 'ContratoManagementComponent', 
       'Contratos', 'Gestión de contratos', 2, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-file-contract' })
      ],
      
      ['backoffice', '/userManagement', 'UserManagementComponent', 
       'Usuarios', 'Gestión de usuarios', 3, true, 
        JSON.stringify({ nivel: 2, icono: 'fa-users' })
      ]
    ];

    // Insertar todo
    console.log('\n  📁 Sistema:');
    for (const option of sistemaOptions) {
      await connection.execute(insertSQL, option);
      console.log(`     ✓ ${option[3]}`);
    }

    console.log('\n  📁 Menú Principal:');
    for (const option of menuPrincipalOptions) {
      await connection.execute(insertSQL, option);
      console.log(`     ✓ ${option[3]}`);
    }

    console.log('\n  📁 Opciones con Contrato:');
    for (const option of contratosOptions) {
      await connection.execute(insertSQL, option);
      console.log(`     ✓ [${option[0]}] ${option[3]}`);
    }

    console.log('\n  📁 Backoffice:');
    for (const option of backofficeOptions) {
      await connection.execute(insertSQL, option);
      console.log(`     ✓ ${option[3]}`);
    }

    // Mostrar resumen
    console.log('\n📊 Resumen de la estructura:');
    const [summary] = await connection.execute(
      `SELECT modulo, COUNT(*) as total 
       FROM BSI_CONFIGURACION_MODULOS 
       GROUP BY modulo 
       ORDER BY modulo`
    );
    
    summary.forEach(row => {
      console.log(`   - ${row.modulo}: ${row.total} opciones`);
    });

    console.log('\n✅ Estructura de menú corregida exitosamente');

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
fixMenuStructure();