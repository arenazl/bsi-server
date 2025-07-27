const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createNavigationTable() {
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

    // Eliminar tabla si existe
    console.log('🗑️  Eliminando tabla existente si existe...');
    await connection.execute('DROP TABLE IF EXISTS BSI_CONFIGURACION_MODULOS');

    // Crear tabla
    console.log('📋 Creando tabla BSI_CONFIGURACION_MODULOS...');
    const createTableSQL = `
      CREATE TABLE BSI_CONFIGURACION_MODULOS (
        IdConfiguracion INT AUTO_INCREMENT PRIMARY KEY,
        modulo VARCHAR(50) NOT NULL,
        ruta VARCHAR(200) NOT NULL,
        componente VARCHAR(100) NOT NULL,
        titulo VARCHAR(100) NOT NULL,
        descripcion VARCHAR(500),
        orden INT DEFAULT 0,
        activo BOOLEAN DEFAULT TRUE,
        requiereAutenticacion BOOLEAN DEFAULT TRUE,
        metadatos JSON,
        fechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fechaModificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_modulo (modulo),
        INDEX idx_activo (activo)
      )
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ Tabla creada exitosamente');

    // Insertar datos iniciales
    console.log('📝 Insertando configuración inicial...');
    
    const insertSQL = `
      INSERT INTO BSI_CONFIGURACION_MODULOS (modulo, ruta, componente, titulo, descripcion, orden, metadatos) VALUES
      (?, ?, ?, ?, ?, ?, ?)
    `;

    const configuraciones = [
      // Módulo de Pagos
      ['pagos', '/pagos/procesar', 'ProcesarPagosComponent', 'Procesar Pagos', 'Procesamiento de pagos múltiples', 1, 
        JSON.stringify({
          tipoModulo: 'PAG',
          requiereContrato: true,
          permisos: ['PAG_PROCESAR', 'PAG_VER']
        })
      ],
      ['pagos', '/pagos/consultar', 'ConsultarPagosComponent', 'Consultar Pagos', 'Consulta de pagos procesados', 2, 
        JSON.stringify({
          tipoModulo: 'PAG',
          requiereContrato: true,
          permisos: ['PAG_CONSULTAR']
        })
      ],
      ['pagos', '/pagos/archivo', 'GenerarArchivoComponent', 'Generar Archivo', 'Generación de archivos de pago', 3, 
        JSON.stringify({
          tipoModulo: 'PAG',
          requiereContrato: true,
          permisos: ['PAG_ARCHIVO']
        })
      ],
      // Módulo de Nómina
      ['nomina', '/nomina/importar', 'ImportarNominaComponent', 'Importar Nómina', 'Importación de archivos de nómina', 1, 
        JSON.stringify({
          tipoModulo: 'NOM',
          requiereContrato: true,
          permisos: ['NOM_IMPORTAR']
        })
      ],
      ['nomina', '/nomina/verificar', 'VerificarNominaComponent', 'Verificar Nómina', 'Verificación de datos de nómina', 2, 
        JSON.stringify({
          tipoModulo: 'NOM',
          requiereContrato: true,
          permisos: ['NOM_VERIFICAR']
        })
      ],
      ['nomina', '/nomina/editar', 'EditarNominaComponent', 'Editar Nómina', 'Edición de registros de nómina', 3, 
        JSON.stringify({
          tipoModulo: 'NOM',
          requiereContrato: true,
          permisos: ['NOM_EDITAR']
        })
      ],
      // Módulo de Cuentas
      ['cuentas', '/cuentas/importar', 'ImportarCuentasComponent', 'Importar Cuentas', 'Importación de cuentas bancarias', 1, 
        JSON.stringify({
          tipoModulo: 'CUE',
          requiereContrato: true,
          permisos: ['CUE_IMPORTAR']
        })
      ],
      ['cuentas', '/cuentas/validar', 'ValidarCuentasComponent', 'Validar Cuentas', 'Validación de CBU y datos bancarios', 2, 
        JSON.stringify({
          tipoModulo: 'CUE',
          requiereContrato: true,
          permisos: ['CUE_VALIDAR']
        })
      ]
    ];

    for (const config of configuraciones) {
      await connection.execute(insertSQL, config);
      console.log(`   ✓ ${config[3]} agregado`);
    }

    // Crear stored procedure
    console.log('🔧 Creando stored procedure sp_get_navigation_config...');
    
    // Primero eliminar si existe
    await connection.execute('DROP PROCEDURE IF EXISTS sp_get_navigation_config');
    
    const createProcedureSQL = `
      CREATE PROCEDURE sp_get_navigation_config(
        IN p_modulo VARCHAR(50),
        IN p_idUsuario INT,
        IN p_idOrganismo INT
      )
      BEGIN
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
      END
    `;
    
    await connection.execute(createProcedureSQL);
    console.log('✅ Stored procedure creado exitosamente');

    // Verificar que todo se creó correctamente
    console.log('\n📊 Verificando creación...');
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM BSI_CONFIGURACION_MODULOS');
    console.log(`   Total de registros insertados: ${rows[0].total}`);

    // Mostrar registros creados
    const [registros] = await connection.execute('SELECT modulo, titulo, ruta FROM BSI_CONFIGURACION_MODULOS ORDER BY modulo, orden');
    console.log('\n📑 Configuraciones creadas:');
    registros.forEach(reg => {
      console.log(`   - ${reg.modulo}: ${reg.titulo} (${reg.ruta})`);
    });

    console.log('\n✅ ¡Tabla de navegación creada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar
createNavigationTable();