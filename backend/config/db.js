const { Pool, types } = require('pg');
require('dotenv').config();

// Las columnas DATE (OID 1082) se devuelven como texto 'AAAA-MM-DD' en vez de objeto Date
types.setTypeParser(1082, (valor) => valor);

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  options: '-c timezone=America/Guayaquil' // CURRENT_DATE y LOCALTIME usan la hora de Ecuador
});

module.exports = pool;