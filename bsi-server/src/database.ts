import mysql from 'mysql2/promise';

import keys from './keys';

const pool = mysql.createPool(keys.database);

pool.getConnection()
    .then(connection => {
        connection.release(); // Proper way to release the connection back to the pool
        console.log('DB super is Fucking Connected');
    })
    .catch(err => {
        console.error('DB Connection Error:', err);
    });

export default pool;
