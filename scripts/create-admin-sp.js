const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Leer configuración desde .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createAdminStoredProcedures() {
    let connection;
    
    try {
        // Configuración de conexión
        const config = {
            host: process.env.DB_PRIMARY_HOST,
            user: process.env.DB_PRIMARY_USER,
            password: process.env.DB_PRIMARY_PASSWORD,
            database: process.env.DB_PRIMARY_NAME,
            port: process.env.DB_PRIMARY_PORT,
            ssl: {
                ca: fs.readFileSync(path.join(__dirname, '../src/DB/crt/ca.pem'))
            },
            multipleStatements: true
        };

        console.log('Conectando a la base de datos Aiven...');
        connection = await mysql.createConnection(config);
        console.log('Conexión establecida.\n');

        // Leer el archivo SQL
        const sqlFile = path.join(__dirname, '../database/stored_procedures/create_admin_sp.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('Creando stored procedures para el panel de administración...\n');
        
        // Ejecutar el SQL
        await connection.query(sqlContent);
        
        console.log('✅ Stored procedures creados exitosamente\n');
        
        // Verificar que se crearon correctamente
        console.log('Verificando stored procedures creados:');
        const [procedures] = await connection.execute(
            `SELECT ROUTINE_NAME 
             FROM INFORMATION_SCHEMA.ROUTINES 
             WHERE ROUTINE_SCHEMA = ? 
             AND ROUTINE_NAME IN (
                'ORGANISMO_OBTENER_LISTA',
                'ORGANISMO_OBTENER_POR_ID',
                'ORGANISMO_CREAR',
                'ORGANISMO_ACTUALIZAR',
                'ORGANISMO_ELIMINAR',
                'CONTRATOS_OBTENER_POR_ORGANISMO',
                'CONTRATO_CREAR',
                'CONTRATO_ACTUALIZAR',
                'CONTRATO_ELIMINAR'
             )
             ORDER BY ROUTINE_NAME`,
            [process.env.DB_PRIMARY_NAME]
        );
        
        procedures.forEach(sp => console.log(`  ✓ ${sp.ROUTINE_NAME}`));
        
        // Probar ORGANISMO_OBTENER_LISTA
        console.log('\n\nProbando ORGANISMO_OBTENER_LISTA...');
        const [organismos] = await connection.execute('CALL ORGANISMO_OBTENER_LISTA()');
        console.log(`Organismos encontrados: ${organismos[0].length}`);
        if (organismos[0].length > 0) {
            console.log('Primer organismo:', {
                ID: organismos[0][0].ID_Organismo,
                Nombre: organismos[0][0].Nombre,
                CUIT: organismos[0][0].CUIT
            });
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nDetalle del error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConexión cerrada.');
        }
    }
}

// Ejecutar el script
createAdminStoredProcedures();