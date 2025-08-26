const { Pool } = require('pg');
require('dotenv').config();

// Try explicit connection config first, fallback to connection string
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'Dawe2Test',
  password: 'Samsam2002',
  port: 5432,
  // Fallback to connection string if needed
  // connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
// This module exports a configured PostgreSQL connection pool using the 'pg' library.