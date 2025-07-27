const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Leer los JSONs
const mainMenuJson = {
  "header": "Menú Principal",
  "description": "Gestión de pagos diversos",
  "enabled": true,
  "icono": "fa-home",
  "items": [
    {
      "title": "Alta De Cuentas Masiva (Becas)",
      "description": "Creá tu archivo de altas de cuentas bancarias",
      "enabled": true,
      "items": [
        {
          "description": "Archivo de alta de cuentas",
          "link": "/dinamicModule/altas-masivas",
          "icono": "fa-file-alt"
        }
      ]
    },
    {
      "title": "Pagos Múltiples",
      "description": "Generá tus archivos de pagos",
      "enabled": true,
      "items": [
        {
          "description": "Pagos Múltiples",
          "link": "/dinamicModule/pagosmultiples",
          "icono": "fa-file-invoice-dollar"
        }
      ]
    },
    {
      "title": "Transferencias Inmediatas",
      "description": "Confeccioná tus archivos TIM-BIPI",
      "enabled": false,
      "items": [
        {
          "description": "el Historial",
          "link": "/auditoria/0",
          "icono": "fa-file-signature"
        },
        {
          "description": "una Nueva Carga",
          "link": "/legajo/add/0",
          "icono": "fa-upload"
        }
      ]
    },
    {
      "title": "Administración Backoffice",
      "description": "Gestioná",
      "enabled": true,
      "items": [
        {
          "description": "Municipios",
          "link": "/organismoManagement",
          "icono": "fa-credit-card"
        },
        {
          "description": "Contratos",
          "link": "/contratoManagement",
          "icono": "fa-credit-card"
        },
        {
          "description": "Usuarios",
          "link": "/userManagement",
          "icono": "fa-credit-card"
        } 
      ]
    },
    {
      "title": "Tableros",
      "description": "Administrá los pagos de tus abonados",
      "enabled": true,
      "items": [
        {
          "description": "Tablero de Pagos",
          "link": "/dashboard",
          "icono": "fa-money-check"
        }
      ]
    },
    {
      "title": "Códigos De Barras",
      "description": "Elaboramos o actualizamos tus boletas de pago",
      "enabled": false,
      "items": [
        {
          "description": "Código de barras",
          "link": "/seguros",
          "icono": "fa-barcode"
        }
      ]
    },
    {
      "title": "Validación De CBU",
      "description": "Eliminá los rechazos de las transferencias",
      "enabled": false,
      "items": [
        {
          "description": "Validación de CBU",
          "link": "/inversiones",
          "icono": "fa-check-circle"
        }
      ]
    },
    {
      "title": "Servicio De Consultoría",
      "description": "Disminuí la carga operativa",
      "enabled": false,
      "items": [
        {
          "description": "Servicio de Consultoría",
          "link": "/movimientos",
          "icono": "fa-concierge-bell"
        }
      ]
    },
    {
      "title": "Migración De Archivos",
      "description": "Optimizá los procesos de migración",
      "enabled": false,
      "items": [
        {
          "description": "Migración de archivos",
          "link": "/depositos",
          "icono": "fa-database"
        }
      ]
    }
  ]
};

async function insertMenuHierarchical() {
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

    // 1. Páginas del sistema
    console.log('\n📝 Insertando páginas del sistema...');
    await connection.execute(insertSQL, [
      'sistema', '/login', 'LoginComponent', 'Login', 'Pantalla de inicio de sesión', 1, true, 
      JSON.stringify({ requiereAutenticacion: false })
    ]);
    await connection.execute(insertSQL, [
      'sistema', '/main-menu', 'MainMenuComponent', 'Menú Principal', 
      mainMenuJson.description, 2, true, 
      JSON.stringify({ 
        requiereAutenticacion: true,
        icono: mainMenuJson.icono
      })
    ]);
    console.log('   ✓ Páginas del sistema insertadas');

    // 2. Items del menú principal (primer nivel - no tienen ruta directa)
    console.log('\n📝 Insertando items del menú principal...');
    let ordenMainMenu = 1;
    
    for (const item of mainMenuJson.items) {
      // Insertar el item principal (sin ruta, es solo un contenedor)
      const moduloId = item.title.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
      
      await connection.execute(insertSQL, [
        'main-menu',
        '', // Sin ruta - es un contenedor
        '', // Sin componente - es un contenedor
        item.title,
        item.description,
        ordenMainMenu++,
        item.enabled,
        JSON.stringify({
          esContenedor: true,
          tieneSubitems: true,
          cantidadSubitems: item.items.length,
          moduloId: moduloId
        })
      ]);
      
      console.log(`   ${item.enabled ? '✓' : '○'} ${item.title} (${item.items.length} subitems)`);
      
      // 3. Insertar los subitems de cada opción del menú
      let ordenSubitem = 1;
      for (const subitem of item.items) {
        // Extraer el componente de la ruta
        let componente = 'GenericComponent';
        if (subitem.link.includes('/dinamicModule/')) {
          componente = 'DinamicModuleComponent';
        } else if (subitem.link.includes('/xslImport/')) {
          componente = 'XslImportComponent';
        } else if (subitem.link.includes('/xslVerified/')) {
          componente = 'XslVerifiedComponent';
        } else if (subitem.link.includes('Management')) {
          componente = subitem.link.replace('/', '') + 'Component';
          componente = componente.charAt(0).toUpperCase() + componente.slice(1);
        } else if (subitem.link === '/dashboard') {
          componente = 'DashboardComponent';
        } else if (subitem.link.includes('/auditoria/')) {
          componente = 'AuditoriaComponent';
        } else if (subitem.link.includes('/legajo/')) {
          componente = 'LegajoComponent';
        }
        
        await connection.execute(insertSQL, [
          moduloId, // Usa el módulo del padre
          subitem.link,
          componente,
          subitem.description,
          item.description || subitem.description, // Descripción larga
          ordenSubitem++,
          item.enabled, // Hereda el estado del padre
          JSON.stringify({
            icono: subitem.icono,
            padreId: 'main-menu',
            padreTitulo: item.title
          })
        ]);
      }
    }

    // 4. Si Pagos Múltiples tiene su propio JSON, insertar esas opciones
    if (mainMenuJson.items.find(i => i.title === 'Pagos Múltiples')) {
      console.log('\n📝 Insertando opciones específicas de Pagos Múltiples...');
      
      // Aquí insertarías las opciones del pagosmultiples.json
      // pero como el mainmenu.json muestra que Pagos Múltiples solo tiene 1 link
      // a /dinamicModule/pagosmultiples, ese es el que se usa
    }

    // Mostrar resumen final
    console.log('\n📊 Resumen de la estructura insertada:');
    const [summary] = await connection.execute(
      `SELECT 
        modulo, 
        COUNT(*) as total,
        SUM(CASE WHEN ruta != '' THEN 1 ELSE 0 END) as con_ruta,
        SUM(CASE WHEN ruta = '' THEN 1 ELSE 0 END) as sin_ruta
       FROM BSI_CONFIGURACION_MODULOS 
       GROUP BY modulo
       ORDER BY modulo`
    );
    
    console.log('\nMódulo'.padEnd(25) + 'Total'.padEnd(10) + 'Con Ruta'.padEnd(12) + 'Contenedores');
    console.log('-'.repeat(60));
    summary.forEach(row => {
      console.log(
        row.modulo.padEnd(25) + 
        row.total.toString().padEnd(10) + 
        row.con_ruta.toString().padEnd(12) + 
        row.sin_ruta.toString()
      );
    });

    console.log('\n✅ Estructura jerárquica insertada correctamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sql) console.error('SQL:', error.sql);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
insertMenuHierarchical();