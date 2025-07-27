const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Leer configuración desde .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateDatabase() {
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
        console.log('Conexión establecida.');

        // Verificar si las columnas con acentos existen
        console.log('\nVerificando columnas actuales en la tabla Organismo...');
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Organismo'
             ORDER BY ORDINAL_POSITION`,
            [process.env.DB_PRIMARY_NAME]
        );

        console.log('Columnas encontradas:');
        columns.forEach(col => console.log(`  - ${col.COLUMN_NAME}`));

        // Definir las columnas a renombrar
        const columnMappings = [
            { old: 'Dirección_Calle', new: 'Direccion_Calle', type: 'VARCHAR(255)' },
            { old: 'Dirección_Número', new: 'Direccion_Numero', type: 'VARCHAR(10)' },
            { old: 'Dirección_Localidad', new: 'Direccion_Localidad', type: 'VARCHAR(100)' },
            { old: 'Dirección_Código_Postal', new: 'Direccion_Codigo_Postal', type: 'VARCHAR(4)' }
        ];

        // Ejecutar las actualizaciones
        console.log('\nActualizando columnas...');
        for (const mapping of columnMappings) {
            const columnExists = columns.some(col => col.COLUMN_NAME === mapping.old);
            
            if (columnExists) {
                try {
                    const query = `ALTER TABLE Organismo CHANGE COLUMN \`${mapping.old}\` \`${mapping.new}\` ${mapping.type}`;
                    console.log(`Ejecutando: ${query}`);
                    await connection.execute(query);
                    console.log(`✓ Columna ${mapping.old} renombrada a ${mapping.new}`);
                } catch (error) {
                    if (error.code === 'ER_BAD_FIELD_ERROR') {
                        console.log(`⚠ La columna ${mapping.old} ya fue renombrada o no existe`);
                    } else {
                        throw error;
                    }
                }
            } else {
                console.log(`⚠ La columna ${mapping.old} no existe (posiblemente ya fue renombrada)`);
            }
        }

        // Verificar las columnas después de la actualización
        console.log('\nVerificando columnas después de la actualización...');
        const [updatedColumns] = await connection.execute(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Organismo'
             ORDER BY ORDINAL_POSITION`,
            [process.env.DB_PRIMARY_NAME]
        );

        console.log('Columnas actualizadas:');
        updatedColumns.forEach(col => console.log(`  - ${col.COLUMN_NAME}`));

        console.log('\n✅ Proceso completado exitosamente');

    } catch (error) {
        console.error('\n❌ Error al actualizar la base de datos:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConexión cerrada.');
        }
    }
}

// Ejecutar el script
updateDatabase();