require('dotenv/config');
const mariadb = require('mariadb');
const url = new URL(process.env.DATABASE_URL);

const pool = mariadb.createPool({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  connectTimeout: 5000,
});

pool.getConnection()
  .then(conn => {
    console.log('CONNECTED OK');
    return conn.query('SELECT 1').then(() => conn.release());
  })
  .catch(err => {
    console.error('CONNECTION FAILED:');
    console.error(err);
  })
  .finally(() => pool.end());
