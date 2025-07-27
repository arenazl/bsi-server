import mysql from 'mysql2/promise';
import { config } from '../config';

const pool = mysql.createPool(config.database.primary);

pool.getConnection()
    .then(connection => {
        connection.release(); // Proper way to release the connection back to the pool
        console.log('DB is Connected');
    })
    .catch(err => {
        console.error('DB Connection Error:', err);
    });

export default pool;
