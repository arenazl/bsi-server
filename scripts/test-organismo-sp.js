const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Leer configuración desde .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testOrganismoStoredProcedures() {
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
            }
        };

        console.log('Conectando a la base de datos Aiven...');
        connection = await mysql.createConnection(config);
        console.log('Conexión establecida.\n');

        // Verificar la estructura de la tabla Organismo
        console.log('Verificando estructura de la tabla Organismo...');
        const [tables] = await connection.execute(
            `SELECT TABLE_NAME 
             FROM INFORMATION_SCHEMA.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Organismo'`,
            [process.env.DB_PRIMARY_NAME]
        );

        if (tables.length === 0) {
            console.log('⚠️ La tabla Organismo no existe');
            
            // Buscar tablas similares
            const [similarTables] = await connection.execute(
                `SELECT TABLE_NAME 
                 FROM INFORMATION_SCHEMA.TABLES 
                 WHERE TABLE_SCHEMA = ? 
                 AND (TABLE_NAME LIKE '%organismo%' OR TABLE_NAME LIKE '%municipio%')`,
                [process.env.DB_PRIMARY_NAME]
            );
            
            if (similarTables.length > 0) {
                console.log('\nTablas similares encontradas:');
                similarTables.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
            }
        } else {
            console.log('✓ Tabla Organismo encontrada');
            
            // Mostrar columnas
            const [columns] = await connection.execute(
                `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Organismo'
                 ORDER BY ORDINAL_POSITION`,
                [process.env.DB_PRIMARY_NAME]
            );
            
            console.log('\nColumnas de la tabla Organismo:');
            columns.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''})`);
            });
        }

        // Probar ObtenerContratos que sí existe
        console.log('\n\nProbando SP ObtenerContratos...');
        try {
            const [result] = await connection.execute('CALL ObtenerContratos()');
            console.log(`✓ ObtenerContratos ejecutado exitosamente. Registros devueltos: ${result[0] ? result[0].length : 0}`);
            if (result[0] && result[0].length > 0) {
                console.log('  Columnas devueltas:', Object.keys(result[0][0]));
            }
        } catch (error) {
            console.log('❌ Error ejecutando ObtenerContratos:', error.message);
        }

        // Verificar qué devuelve ObtenerNombreOrganismo
        console.log('\n\nProbando SP ObtenerNombreOrganismo...');
        try {
            // Primero veamos los parámetros
            const [params] = await connection.execute(
                `SELECT PARAMETER_NAME, DATA_TYPE
                 FROM INFORMATION_SCHEMA.PARAMETERS
                 WHERE SPECIFIC_SCHEMA = ?
                 AND SPECIFIC_NAME = 'ObtenerNombreOrganismo'
                 ORDER BY ORDINAL_POSITION`,
                [process.env.DB_PRIMARY_NAME]
            );
            
            console.log('Parámetros:');
            params.forEach(p => console.log(`  - ${p.PARAMETER_NAME} (${p.DATA_TYPE})`));
            
            // Probar con ID 1
            const [result] = await connection.execute('CALL ObtenerNombreOrganismo(?)', [1]);
            console.log('Resultado:', result[0]);
        } catch (error) {
            console.log('❌ Error ejecutando ObtenerNombreOrganismo:', error.message);
        }

        // Buscar en la tabla de contratos para entender la estructura
        console.log('\n\nVerificando datos en ObtenerContratos para ver relación con organismos...');
        const [contratos] = await connection.execute('CALL ObtenerContratos()');
        if (contratos[0] && contratos[0].length > 0) {
            console.log('Primer contrato:', contratos[0][0]);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConexión cerrada.');
        }
    }
}

// Ejecutar el script
testOrganismoStoredProcedures();