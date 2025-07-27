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
            }
        };

        console.log('Conectando a la base de datos Aiven...');
        connection = await mysql.createConnection(config);
        console.log('Conexión establecida.\n');

        // Array de stored procedures a crear
        const procedures = [
            {
                name: 'ORGANISMO_OBTENER_LISTA',
                drop: 'DROP PROCEDURE IF EXISTS ORGANISMO_OBTENER_LISTA',
                create: `CREATE PROCEDURE ORGANISMO_OBTENER_LISTA()
                BEGIN
                    SELECT 
                        ID_Organismo,
                        Nombre,
                        Nombre_Corto,
                        CUIT,
                        Direccion_Calle,
                        Direccion_Numero,
                        Direccion_Localidad,
                        Direccion_Codigo_Postal,
                        Sucursal_Bapro,
                        Tipo_Organismo,
                        Tipo_Estado,
                        Fecha_Alta,
                        Fecha_Baja,
                        Fecha_Modificacion
                    FROM Organismo
                    ORDER BY Nombre;
                END`
            },
            {
                name: 'ORGANISMO_OBTENER_POR_ID',
                drop: 'DROP PROCEDURE IF EXISTS ORGANISMO_OBTENER_POR_ID',
                create: `CREATE PROCEDURE ORGANISMO_OBTENER_POR_ID(
                    IN p_id_organismo INT
                )
                BEGIN
                    SELECT 
                        ID_Organismo,
                        Nombre,
                        Nombre_Corto,
                        CUIT,
                        Direccion_Calle,
                        Direccion_Numero,
                        Direccion_Localidad,
                        Direccion_Codigo_Postal,
                        Sucursal_Bapro,
                        Tipo_Organismo,
                        Tipo_Estado,
                        Fecha_Alta,
                        Fecha_Baja,
                        Fecha_Modificacion
                    FROM Organismo
                    WHERE ID_Organismo = p_id_organismo;
                END`
            },
            {
                name: 'ORGANISMO_CREAR',
                drop: 'DROP PROCEDURE IF EXISTS ORGANISMO_CREAR',
                create: `CREATE PROCEDURE ORGANISMO_CREAR(
                    IN p_Nombre VARCHAR(100),
                    IN p_Nombre_Corto VARCHAR(22),
                    IN p_CUIT CHAR(11),
                    IN p_Direccion_Calle VARCHAR(255),
                    IN p_Direccion_Numero VARCHAR(10),
                    IN p_Direccion_Localidad VARCHAR(100),
                    IN p_Direccion_Codigo_Postal VARCHAR(4),
                    IN p_Sucursal_Bapro VARCHAR(50),
                    IN p_Tipo_Organismo INT,
                    IN p_Tipo_Estado INT
                )
                BEGIN
                    INSERT INTO Organismo (
                        Nombre,
                        Nombre_Corto,
                        CUIT,
                        Direccion_Calle,
                        Direccion_Numero,
                        Direccion_Localidad,
                        Direccion_Codigo_Postal,
                        Sucursal_Bapro,
                        Tipo_Organismo,
                        Tipo_Estado,
                        Fecha_Alta
                    ) VALUES (
                        p_Nombre,
                        p_Nombre_Corto,
                        p_CUIT,
                        p_Direccion_Calle,
                        p_Direccion_Numero,
                        p_Direccion_Localidad,
                        p_Direccion_Codigo_Postal,
                        p_Sucursal_Bapro,
                        p_Tipo_Organismo,
                        p_Tipo_Estado,
                        CURDATE()
                    );
                    
                    SELECT LAST_INSERT_ID() as ID_Organismo;
                END`
            },
            {
                name: 'ORGANISMO_ACTUALIZAR',
                drop: 'DROP PROCEDURE IF EXISTS ORGANISMO_ACTUALIZAR',
                create: `CREATE PROCEDURE ORGANISMO_ACTUALIZAR(
                    IN p_id_organismo INT,
                    IN p_Nombre VARCHAR(100),
                    IN p_Nombre_Corto VARCHAR(22),
                    IN p_CUIT CHAR(11),
                    IN p_Direccion_Calle VARCHAR(255),
                    IN p_Direccion_Numero VARCHAR(10),
                    IN p_Direccion_Localidad VARCHAR(100),
                    IN p_Direccion_Codigo_Postal VARCHAR(4),
                    IN p_Sucursal_Bapro VARCHAR(50),
                    IN p_Tipo_Organismo INT,
                    IN p_Tipo_Estado INT
                )
                BEGIN
                    UPDATE Organismo SET
                        Nombre = p_Nombre,
                        Nombre_Corto = p_Nombre_Corto,
                        CUIT = p_CUIT,
                        Direccion_Calle = p_Direccion_Calle,
                        Direccion_Numero = p_Direccion_Numero,
                        Direccion_Localidad = p_Direccion_Localidad,
                        Direccion_Codigo_Postal = p_Direccion_Codigo_Postal,
                        Sucursal_Bapro = p_Sucursal_Bapro,
                        Tipo_Organismo = p_Tipo_Organismo,
                        Tipo_Estado = p_Tipo_Estado,
                        Fecha_Modificacion = CURDATE()
                    WHERE ID_Organismo = p_id_organismo;
                    
                    SELECT ROW_COUNT() as affected_rows;
                END`
            },
            {
                name: 'ORGANISMO_ELIMINAR',
                drop: 'DROP PROCEDURE IF EXISTS ORGANISMO_ELIMINAR',
                create: `CREATE PROCEDURE ORGANISMO_ELIMINAR(
                    IN p_id_organismo INT
                )
                BEGIN
                    UPDATE Organismo SET
                        Tipo_Estado = 0,
                        Fecha_Baja = CURDATE(),
                        Fecha_Modificacion = CURDATE()
                    WHERE ID_Organismo = p_id_organismo;
                    
                    SELECT ROW_COUNT() as affected_rows;
                END`
            },
            {
                name: 'CONTRATOS_OBTENER_POR_ORGANISMO',
                drop: 'DROP PROCEDURE IF EXISTS CONTRATOS_OBTENER_POR_ORGANISMO',
                create: `CREATE PROCEDURE CONTRATOS_OBTENER_POR_ORGANISMO(
                    IN p_id_organismo INT
                )
                BEGIN
                    SELECT 
                        Contrato_ID,
                        ID_Organismo,
                        Informacion_Discrecional,
                        Id_Modalidad,
                        Rotulo,
                        Ente,
                        Cuenta_Debito,
                        Tipo_Estado,
                        Fecha_Alta,
                        Fecha_Baja,
                        indicativo
                    FROM Contratos650
                    WHERE ID_Organismo = p_id_organismo
                    ORDER BY Fecha_Alta DESC;
                END`
            },
            {
                name: 'CONTRATO_CREAR',
                drop: 'DROP PROCEDURE IF EXISTS CONTRATO_CREAR',
                create: `CREATE PROCEDURE CONTRATO_CREAR(
                    IN p_ID_Organismo INT,
                    IN p_Id_Modalidad INT,
                    IN p_Rotulo VARCHAR(10),
                    IN p_Ente VARCHAR(4),
                    IN p_Cuenta_Debito VARCHAR(14),
                    IN p_Informacion_Discrecional VARCHAR(20),
                    IN p_Tipo_Estado INT
                )
                BEGIN
                    INSERT INTO Contratos650 (
                        ID_Organismo,
                        Id_Modalidad,
                        Rotulo,
                        Ente,
                        Cuenta_Debito,
                        Informacion_Discrecional,
                        Tipo_Estado,
                        Fecha_Alta
                    ) VALUES (
                        p_ID_Organismo,
                        p_Id_Modalidad,
                        p_Rotulo,
                        p_Ente,
                        p_Cuenta_Debito,
                        p_Informacion_Discrecional,
                        p_Tipo_Estado,
                        CURDATE()
                    );
                    
                    SELECT LAST_INSERT_ID() as Contrato_ID;
                END`
            },
            {
                name: 'CONTRATO_ACTUALIZAR',
                drop: 'DROP PROCEDURE IF EXISTS CONTRATO_ACTUALIZAR',
                create: `CREATE PROCEDURE CONTRATO_ACTUALIZAR(
                    IN p_contrato_id INT,
                    IN p_ID_Organismo INT,
                    IN p_Id_Modalidad INT,
                    IN p_Rotulo VARCHAR(10),
                    IN p_Ente VARCHAR(4),
                    IN p_Cuenta_Debito VARCHAR(14),
                    IN p_Informacion_Discrecional VARCHAR(20),
                    IN p_Tipo_Estado INT
                )
                BEGIN
                    UPDATE Contratos650 SET
                        ID_Organismo = p_ID_Organismo,
                        Id_Modalidad = p_Id_Modalidad,
                        Rotulo = p_Rotulo,
                        Ente = p_Ente,
                        Cuenta_Debito = p_Cuenta_Debito,
                        Informacion_Discrecional = p_Informacion_Discrecional,
                        Tipo_Estado = p_Tipo_Estado
                    WHERE Contrato_ID = p_contrato_id;
                    
                    SELECT ROW_COUNT() as affected_rows;
                END`
            },
            {
                name: 'CONTRATO_ELIMINAR',
                drop: 'DROP PROCEDURE IF EXISTS CONTRATO_ELIMINAR',
                create: `CREATE PROCEDURE CONTRATO_ELIMINAR(
                    IN p_contrato_id INT
                )
                BEGIN
                    UPDATE Contratos650 SET
                        Tipo_Estado = 0,
                        Fecha_Baja = CURDATE()
                    WHERE Contrato_ID = p_contrato_id;
                    
                    SELECT ROW_COUNT() as affected_rows;
                END`
            }
        ];

        // Crear cada stored procedure
        for (const proc of procedures) {
            try {
                console.log(`Creando ${proc.name}...`);
                
                // Primero eliminar si existe
                await connection.query(proc.drop);
                
                // Luego crear
                await connection.query(proc.create);
                
                console.log(`  ✓ ${proc.name} creado exitosamente`);
            } catch (error) {
                console.log(`  ❌ Error creando ${proc.name}: ${error.message}`);
            }
        }

        // Verificar que se crearon
        console.log('\n\nVerificando stored procedures creados:');
        const [created] = await connection.execute(
            `SELECT ROUTINE_NAME 
             FROM INFORMATION_SCHEMA.ROUTINES 
             WHERE ROUTINE_SCHEMA = ? 
             AND ROUTINE_NAME LIKE '%ORGANISMO%' OR ROUTINE_NAME LIKE '%CONTRATO%'
             ORDER BY ROUTINE_NAME`,
            [process.env.DB_PRIMARY_NAME]
        );
        
        created.forEach(sp => console.log(`  ✓ ${sp.ROUTINE_NAME}`));

        // Probar ORGANISMO_OBTENER_LISTA
        console.log('\n\nProbando ORGANISMO_OBTENER_LISTA...');
        try {
            const [organismos] = await connection.execute('CALL ORGANISMO_OBTENER_LISTA()');
            console.log(`Organismos encontrados: ${organismos[0].length}`);
            if (organismos[0].length > 0) {
                console.log('Primer organismo:', {
                    ID: organismos[0][0].ID_Organismo,
                    Nombre: organismos[0][0].Nombre,
                    CUIT: organismos[0][0].CUIT,
                    Direccion: organismos[0][0].Direccion_Calle + ' ' + organismos[0][0].Direccion_Numero
                });
            }
        } catch (error) {
            console.log('Error probando SP:', error.message);
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
createAdminStoredProcedures();