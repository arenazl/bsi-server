const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function createTreeStructure() {
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

    // Agregar columna padre_id si no existe
    console.log('🔧 Agregando columna padre_id para estructura de árbol...');
    try {
      await connection.execute(`
        ALTER TABLE BSI_CONFIGURACION_MODULOS 
        ADD COLUMN padre_id INT NULL,
        ADD FOREIGN KEY (padre_id) REFERENCES BSI_CONFIGURACION_MODULOS(IdConfiguracion)
      `);
      console.log('✅ Columna padre_id agregada');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Columna padre_id ya existe');
      } else {
        throw err;
      }
    }

    // Limpiar y recrear con estructura de árbol
    console.log('\n🗑️  Limpiando datos existentes...');
    await connection.execute('DELETE FROM BSI_CONFIGURACION_MODULOS');
    
    const insertSQL = `
      INSERT INTO BSI_CONFIGURACION_MODULOS 
      (modulo, ruta, componente, titulo, descripcion, orden, activo, padre_id, metadatos) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log('\n📝 Insertando estructura de árbol...\n');

    // NIVEL 0: Raíz del sistema
    const [sistemaResult] = await connection.execute(insertSQL, [
      'root', '', '', 'Sistema BSI', 'Sistema de Gestión de Pagos', 1, true, null,
      JSON.stringify({ nivel: 0, tipo: 'sistema' })
    ]);
    const rootId = sistemaResult.insertId;
    console.log('🌳 Raíz del sistema creada (ID: ' + rootId + ')');

    // NIVEL 1: Páginas principales
    const [loginResult] = await connection.execute(insertSQL, [
      'sistema', '/login', 'LoginComponent', 'Login', 
      'Pantalla de inicio de sesión', 1, true, rootId,
      JSON.stringify({ nivel: 1, requiereAuth: false })
    ]);
    
    const [menuResult] = await connection.execute(insertSQL, [
      'sistema', '/main-menu', 'MainMenuComponent', 'Menú Principal', 
      'Menú principal del sistema', 2, true, rootId,
      JSON.stringify({ nivel: 1, requiereAuth: true })
    ]);
    const menuId = menuResult.insertId;
    console.log('  └─ Páginas del sistema agregadas');

    // NIVEL 2: Items del menú principal (4 habilitados + 5 deshabilitados)
    console.log('\n📁 Items del menú principal:');
    
    // 1. Alta de Cuentas
    const [altasResult] = await connection.execute(insertSQL, [
      'menu-item', '', '', 'Alta De Cuentas Masiva (Becas)', 
      'Creá tu archivo de altas de cuentas bancarias', 1, true, menuId,
      JSON.stringify({ nivel: 2, icono: 'fa-file-alt' })
    ]);
    const altasId = altasResult.insertId;
    
    // Hijo de Alta de Cuentas
    await connection.execute(insertSQL, [
      'altas-masivas', '/dinamicModule/altas-masivas', 'DinamicModuleComponent',
      'Archivo de alta de cuentas', 'Generar archivo de altas',
      1, true, altasId,
      JSON.stringify({ nivel: 3, icono: 'fa-file-alt' })
    ]);
    console.log('  ├─ ✓ Alta De Cuentas Masiva (1 hijo)');

    // 2. Pagos Múltiples
    const [pagosResult] = await connection.execute(insertSQL, [
      'menu-item', '', '', 'Pagos Múltiples',
      'Generá tus archivos de pagos', 2, true, menuId,
      JSON.stringify({ nivel: 2, icono: 'fa-file-invoice-dollar' })
    ]);
    const pagosId = pagosResult.insertId;
    
    // Hijo de Pagos Múltiples
    await connection.execute(insertSQL, [
      'pagos-multiples', '/dinamicModule/pagosmultiples', 'DinamicModuleComponent',
      'Pagos Múltiples', 'Ir a pagos múltiples',
      1, true, pagosId,
      JSON.stringify({ nivel: 3, icono: 'fa-file-invoice-dollar' })
    ]);
    console.log('  ├─ ✓ Pagos Múltiples (1 hijo)');

    // 3. Transferencias (DESHABILITADO)
    const [transResult] = await connection.execute(insertSQL, [
      'menu-item', '', '', 'Transferencias Inmediatas',
      'Confeccioná tus archivos TIM-BIPI', 3, false, menuId,
      JSON.stringify({ nivel: 2, icono: 'fa-exchange-alt' })
    ]);
    const transId = transResult.insertId;
    
    // Hijos de Transferencias
    await connection.execute(insertSQL, [
      'transferencias', '/auditoria/0', 'AuditoriaComponent',
      'el Historial', 'Ver historial', 1, false, transId,
      JSON.stringify({ nivel: 3, icono: 'fa-file-signature' })
    ]);
    await connection.execute(insertSQL, [
      'transferencias', '/legajo/add/0', 'LegajoComponent',
      'una Nueva Carga', 'Nueva carga', 2, false, transId,
      JSON.stringify({ nivel: 3, icono: 'fa-upload' })
    ]);
    console.log('  ├─ ○ Transferencias Inmediatas (2 hijos)');

    // 4. Administración Backoffice
    const [backofficeResult] = await connection.execute(insertSQL, [
      'menu-item', '', '', 'Administración Backoffice',
      'Gestioná', 4, true, menuId,
      JSON.stringify({ nivel: 2, icono: 'fa-cogs' })
    ]);
    const backofficeId = backofficeResult.insertId;
    
    // Hijos de Backoffice
    await connection.execute(insertSQL, [
      'backoffice', '/organismoManagement', 'OrganismoManagementComponent',
      'Municipios', 'Gestión de municipios', 1, true, backofficeId,
      JSON.stringify({ nivel: 3, icono: 'fa-building' })
    ]);
    await connection.execute(insertSQL, [
      'backoffice', '/contratoManagement', 'ContratoManagementComponent',
      'Contratos', 'Gestión de contratos', 2, true, backofficeId,
      JSON.stringify({ nivel: 3, icono: 'fa-file-contract' })
    ]);
    await connection.execute(insertSQL, [
      'backoffice', '/userManagement', 'UserManagementComponent',
      'Usuarios', 'Gestión de usuarios', 3, true, backofficeId,
      JSON.stringify({ nivel: 3, icono: 'fa-users' })
    ]);
    console.log('  ├─ ✓ Administración Backoffice (3 hijos)');

    // 5. Tableros
    const [tablerosResult] = await connection.execute(insertSQL, [
      'menu-item', '', '', 'Tableros',
      'Administrá los pagos de tus abonados', 5, true, menuId,
      JSON.stringify({ nivel: 2, icono: 'fa-chart-line' })
    ]);
    const tablerosId = tablerosResult.insertId;
    
    // Hijo de Tableros
    await connection.execute(insertSQL, [
      'tableros', '/dashboard', 'DashboardComponent',
      'Tablero de Pagos', 'Ver tablero', 1, true, tablerosId,
      JSON.stringify({ nivel: 3, icono: 'fa-money-check' })
    ]);
    console.log('  ├─ ✓ Tableros (1 hijo)');

    // 6-9: Items deshabilitados (los agrego rápido)
    const deshabilitados = [
      ['Códigos De Barras', 'Elaboramos o actualizamos tus boletas de pago', 'fa-barcode', '/seguros', 'Código de barras'],
      ['Validación De CBU', 'Eliminá los rechazos de las transferencias', 'fa-check-circle', '/inversiones', 'Validación de CBU'],
      ['Servicio De Consultoría', 'Disminuí la carga operativa', 'fa-concierge-bell', '/movimientos', 'Servicio de Consultoría'],
      ['Migración De Archivos', 'Optimizá los procesos de migración', 'fa-database', '/depositos', 'Migración de archivos']
    ];

    let orden = 6;
    for (const [titulo, desc, icono, ruta, hijoTitulo] of deshabilitados) {
      const [padreResult] = await connection.execute(insertSQL, [
        'menu-item', '', '', titulo, desc, orden++, false, menuId,
        JSON.stringify({ nivel: 2, icono })
      ]);
      
      await connection.execute(insertSQL, [
        'disabled', ruta, 'DisabledComponent', hijoTitulo, desc,
        1, false, padreResult.insertId,
        JSON.stringify({ nivel: 3, icono })
      ]);
      console.log(`  ├─ ○ ${titulo} (1 hijo)`);
    }

    // Verificar estructura
    console.log('\n\n🌲 ESTRUCTURA DE ÁRBOL CREADA:');
    const [tree] = await connection.execute(`
      SELECT 
        n.IdConfiguracion as id,
        n.titulo,
        n.ruta,
        n.activo,
        n.padre_id,
        p.titulo as padre_titulo,
        JSON_EXTRACT(n.metadatos, '$.nivel') as nivel
      FROM BSI_CONFIGURACION_MODULOS n
      LEFT JOIN BSI_CONFIGURACION_MODULOS p ON n.padre_id = p.IdConfiguracion
      ORDER BY COALESCE(JSON_EXTRACT(n.metadatos, '$.nivel'), 0), n.orden
    `);

    console.log('\nID | Nivel | Título | Padre | Ruta');
    console.log('-'.repeat(80));
    tree.forEach(row => {
      const indent = '  '.repeat(row.nivel || 0);
      const estado = row.activo ? '✓' : '○';
      console.log(`${row.id} | ${row.nivel} | ${indent}${estado} ${row.titulo} | ${row.padre_titulo || '-'} | ${row.ruta || '(contenedor)'}`);
    });

    console.log('\n✅ Estructura de árbol creada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTreeStructure();