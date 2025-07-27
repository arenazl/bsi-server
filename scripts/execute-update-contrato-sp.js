const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function updateStoredProcedure() {
    let connection;
    
    try {
        // Crear conexión
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bsi',
            multipleStatements: true
        });

        console.log('📋 Conectado a la base de datos');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'update-contrato-sp-cmin.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        // Ejecutar el SQL
        console.log('🔄 Actualizando stored procedure ObtenerContratoById...');
        await connection.query(sql);
        
        console.log('✅ Stored procedure actualizado exitosamente');
        console.log('📌 Ahora usa la tabla cmin en lugar de usuarios');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar
updateStoredProcedure();