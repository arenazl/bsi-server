const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function insertMainNavigation() {
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

    // Insertar configuraciones para las pantallas principales
    console.log('\n📝 Insertando configuraciones de navegación principal...');
    
    const insertSQL = `
      INSERT INTO BSI_CONFIGURACION_MODULOS (modulo, ruta, componente, titulo, descripcion, orden, metadatos) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Configuraciones del menú principal
    const mainNavigations = [
      // Pantalla de Login (no requiere autenticación)
      ['sistema', '/login', 'LoginComponent', 'Inicio de Sesión', 'Pantalla de autenticación del sistema', 0, 
        JSON.stringify({
          tipoModulo: 'SISTEMA',
          requiereContrato: false,
          esPublica: true,
          icono: 'login'
        })
      ],
      
      // Menú Principal - Primera pantalla después del login
      ['sistema', '/main-menu', 'MainMenuComponent', 'Menú Principal', 'Selección de módulos disponibles', 1, 
        JSON.stringify({
          tipoModulo: 'SISTEMA',
          requiereContrato: false,
          modulos: ['pagos', 'nomina', 'cuentas', 'reportes'],
          icono: 'dashboard'
        })
      ],
      
      // Selección de Contratos - Segunda pantalla (Pagos Múltiples)
      ['sistema', '/contratos', 'ContratosComponent', 'Selección de Contratos', 'Selección de contrato para operar', 2, 
        JSON.stringify({
          tipoModulo: 'SISTEMA',
          requiereContrato: false,
          descripcionLarga: 'Pantalla de Pagos Múltiples donde se muestran los contratos del usuario',
          icono: 'account_balance'
        })
      ],
      
      // Opciones adicionales del menú principal
      ['reportes', '/reportes/dashboard', 'ReportesDashboardComponent', 'Dashboard de Reportes', 'Panel principal de reportes', 1, 
        JSON.stringify({
          tipoModulo: 'REP',
          requiereContrato: true,
          permisos: ['REP_VER']
        })
      ],
      
      ['reportes', '/reportes/generar', 'GenerarReportesComponent', 'Generar Reportes', 'Generación de reportes personalizados', 2, 
        JSON.stringify({
          tipoModulo: 'REP',
          requiereContrato: true,
          permisos: ['REP_GENERAR']
        })
      ]
    ];

    // Insertar cada configuración
    for (const config of mainNavigations) {
      try {
        await connection.execute(insertSQL, config);
        console.log(`   ✓ ${config[3]} agregado`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  ${config[3]} ya existe`);
        } else {
          throw error;
        }
      }
    }

    // Actualizar metadatos para indicar requiereAutenticacion = false para login
    console.log('\n🔧 Actualizando configuración de login...');
    await connection.execute(
      'UPDATE BSI_CONFIGURACION_MODULOS SET requiereAutenticacion = FALSE WHERE ruta = ?',
      ['/login']
    );

    // Mostrar todas las configuraciones del sistema
    console.log('\n📊 Configuraciones del sistema:');
    const [sistemConfigs] = await connection.execute(
      `SELECT modulo, titulo, ruta, requiereAutenticacion 
       FROM BSI_CONFIGURACION_MODULOS 
       WHERE modulo IN ('sistema', 'reportes')
       ORDER BY modulo, orden`
    );
    
    sistemConfigs.forEach(config => {
      console.log(`   - [${config.modulo}] ${config.titulo}`);
      console.log(`     Ruta: ${config.ruta}`);
      console.log(`     Requiere Auth: ${config.requiereAutenticacion ? 'Sí' : 'No'}`);
    });

    console.log('\n✅ Configuraciones de navegación principal insertadas');

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
insertMainNavigation();