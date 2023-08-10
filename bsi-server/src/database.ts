import mysql from 'mysql2/promise';

import keys from './keys';

const pool = mysql.createPool(keys.database);

pool.getConnection()
    .then(connection => 
        {
        pool.releaseConnection(connection);
        console.log('DB super is Connected');
    });

export default pool;
