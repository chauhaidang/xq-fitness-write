const { Pool, types } = require('pg');
require('dotenv').config();

// Configure pg to parse int8 (BIGINT) as integers instead of strings
// Safe for IDs that don't exceed JavaScript's safe integer limit (2^53 - 1)
types.setTypeParser(types.builtins.INT8, (val) => parseInt(val, 10));

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'xq_fitness',
  user: process.env.DB_USER || 'xq_user',
  password: process.env.DB_PASSWORD || 'xq_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Enable SSL for production databases (DigitalOcean managed databases require SSL)
  ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
