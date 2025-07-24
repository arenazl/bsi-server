const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

async function getClearDBConfi g() {
  try {
    const configOutput = execSync('heroku config --app bsi-back').toString();
    console.log('Heroku config output:', configOutput);  // Added for debugging

    // Adjust the regex to extract the ClearDB URL
    const match = configOutput.match(/CLEARDB_DATABASE_URL:\s*(mysql:\/\/\S+)/);
    if (!match) {
      throw new Error('No ClearDB URL found in Heroku config');
    }

    const urlString = match[1];
    // Remove the parameters from the connection string, if any
    const cleanUrlString = urlString.split('?')[0];

    return new URL(cleanUrlString);
  } catch (error) {
    console.error('Error getting ClearDB config:', error.message);
    throw error;
  }
}

async function killConnections() {
  let connection;
  try {
    const cleardbConfig = await getClearDBConfig();
    connection = await mysql.createConnection({
      host: cleardbConfig.hostname,
      user: cleardbConfig.username,
      password: cleardbConfig.password,
      database: cleardbConfig.pathname.substring(1)
    });

    const [rows] = await connection.execute('SHOW PROCESSLIST');
    const processIds = rows.map(row => row.Id).filter(id => id != connection.threadId);

    for (const id of processIds) {
      await connection.execute(`KILL ${id}`);
    }

    console.log('All active connections have been killed.');
  } catch (err) {
    console.error('Error killing connections:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

killConnections();
