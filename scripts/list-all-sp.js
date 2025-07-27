const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Leer configuración desde .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function listAllStoredProcedures() {
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

        // Listar TODOS los stored procedures
        console.log('Listando TODOS los stored procedures en la base de datos:');
        const [procedures] = await connection.execute(
            `SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED, LAST_ALTERED
             FROM INFORMATION_SCHEMA.ROUTINES 
             WHERE ROUTINE_SCHEMA = ?
             ORDER BY ROUTINE_NAME`,
            [process.env.DB_PRIMARY_NAME]
        );

        if (procedures.length === 0) {
            console.log('No se encontraron stored procedures en la base de datos.');
        } else {
            console.log(`\nTotal de procedures encontrados: ${procedures.length}\n`);
            procedures.forEach(sp => {
                console.log(`  - ${sp.ROUTINE_NAME}`);
                console.log(`    Tipo: ${sp.ROUTINE_TYPE}`);
                console.log(`    Creado: ${sp.CREATED}`);
                console.log(`    Modificado: ${sp.LAST_ALTERED || 'Nunca'}\n`);
            });
        }

        // Buscar procedures relacionados con organismos, usuarios o contratos
        console.log('\nBuscando procedures relacionados con las entidades del admin panel:');
        const keywords = ['organismo', 'usuario', 'user', 'contrato', 'contract', 'municipio'];
        
        keywords.forEach(keyword => {
            const related = procedures.filter(sp => 
                sp.ROUTINE_NAME.toLowerCase().includes(keyword)
            );
            
            if (related.length > 0) {
                console.log(`\nProcedures que contienen "${keyword}":`);
                related.forEach(sp => console.log(`  - ${sp.ROUTINE_NAME}`));
            }
        });

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
listAllStoredProcedures();