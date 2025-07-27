const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Leer configuración desde .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkAndUpdateStoredProcedures() {
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

        // Verificar los stored procedures existentes
        console.log('Verificando stored procedures existentes...');
        const [procedures] = await connection.execute(
            `SELECT ROUTINE_NAME, ROUTINE_TYPE 
             FROM INFORMATION_SCHEMA.ROUTINES 
             WHERE ROUTINE_SCHEMA = ? 
             AND ROUTINE_NAME LIKE 'ORGANISMO%'
             ORDER BY ROUTINE_NAME`,
            [process.env.DB_PRIMARY_NAME]
        );

        console.log('Stored procedures encontrados:');
        procedures.forEach(sp => console.log(`  - ${sp.ROUTINE_NAME}`));

        // Verificar el contenido de un SP específico
        console.log('\nVerificando contenido del SP ORGANISMO_CREAR...');
        const [spDefinition] = await connection.execute(
            `SHOW CREATE PROCEDURE ORGANISMO_CREAR`
        );
        
        if (spDefinition.length > 0) {
            const createStatement = spDefinition[0]['Create Procedure'];
            
            // Buscar referencias a columnas con acentos
            const accentedColumns = [
                'Dirección_Calle',
                'Dirección_Numero', 
                'Dirección_Número',
                'Dirección_Localidad',
                'Dirección_Codigo_Postal',
                'Dirección_Código_Postal'
            ];
            
            console.log('\nBuscando columnas con acentos en el SP...');
            let foundAccents = false;
            accentedColumns.forEach(col => {
                if (createStatement.includes(col)) {
                    console.log(`  ⚠️ Encontrado: ${col}`);
                    foundAccents = true;
                }
            });
            
            if (!foundAccents) {
                console.log('  ✓ No se encontraron columnas con acentos');
            }
        }

        // Obtener los parámetros del SP
        console.log('\nParámetros del SP ORGANISMO_CREAR:');
        const [params] = await connection.execute(
            `SELECT PARAMETER_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
             FROM INFORMATION_SCHEMA.PARAMETERS
             WHERE SPECIFIC_SCHEMA = ?
             AND SPECIFIC_NAME = 'ORGANISMO_CREAR'
             AND PARAMETER_MODE = 'IN'
             ORDER BY ORDINAL_POSITION`,
            [process.env.DB_PRIMARY_NAME]
        );

        params.forEach(param => {
            console.log(`  - ${param.PARAMETER_NAME} (${param.DATA_TYPE}${param.CHARACTER_MAXIMUM_LENGTH ? '(' + param.CHARACTER_MAXIMUM_LENGTH + ')' : ''})`);
        });

        // Preguntar si actualizar
        console.log('\n¿Desea actualizar los stored procedures? (comentar/descomentar la siguiente línea)');
        
        // DESCOMENTAR LA SIGUIENTE LÍNEA PARA ACTUALIZAR LOS SP
        // await updateStoredProcedures(connection);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'ER_SP_DOES_NOT_EXIST') {
            console.log('El stored procedure no existe. Puede que necesite crearlo primero.');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConexión cerrada.');
        }
    }
}

async function updateStoredProcedures(connection) {
    console.log('\nActualizando stored procedures...');
    
    try {
        // Leer el archivo SQL con las actualizaciones
        const sqlFile = path.join(__dirname, '../database/stored_procedures/update_organismo_sp.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Ejecutar las actualizaciones
        await connection.query(sqlContent);
        
        console.log('✅ Stored procedures actualizados exitosamente');
    } catch (error) {
        console.error('❌ Error al actualizar stored procedures:', error.message);
        throw error;
    }
}

// Ejecutar el script
checkAndUpdateStoredProcedures();