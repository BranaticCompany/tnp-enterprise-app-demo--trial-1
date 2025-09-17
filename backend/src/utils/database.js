const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/app_db',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
