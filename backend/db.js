/**
 * Database Connection Module
 * 
 * Manages PostgreSQL database connections using a connection pool.
 * This module provides a centralized database query interface for the application.
 * 
 * The connection pool automatically manages multiple database connections,
 * improving performance by reusing connections and handling connection errors.
 * 
 * @module db
 * @requires pg
 * @requires dotenv
 */

require('dotenv').config();
const { Pool, types } = require('pg');
const config = require('./config.json');

types.setTypeParser(20, (val) => parseInt(val, 10));

/**
 * PostgreSQL Connection Pool
 * 
 * Creates a connection pool using environment variables for configuration.
 * Connection parameters are read from .env file:
 * - DB_HOST: Database hostname
 * - DB_PORT: Database port (default: 5432)
 * - DB_USER: Database username
 * - DB_PASSWORD: Database password
 * - DB_NAME: Database name
 * 
 * Note: The application also supports config.json for RDS connections (see routes.js)
 */
const pool = new Pool({
  host: process.env.DB_HOST || config.rds_host,
  port: process.env.DB_PORT || config.rds_port,
  user: process.env.DB_USER || config.rds_user,
  password: process.env.DB_PASSWORD || config.rds_password,
  database: process.env.DB_NAME || config.rds_db,
  ssl: { rejectUnauthorized: false }, // same as you had before for RDS
});

/**
 * Error Handler for Connection Pool
 * 
 * Handles unexpected errors from idle clients in the pool.
 * This prevents the application from crashing due to database connection issues.
 */
pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
});

/**
 * Execute a Database Query
 * 
 * Wrapper function for pool.query that provides a clean interface
 * for executing parameterized SQL queries.
 * 
 * @param {string} text - SQL query string (can contain $1, $2, etc. for parameters)
 * @param {Array} params - Array of parameter values to substitute in the query
 * @returns {Promise<Object>} Query result object with 'rows' array and 'rowCount'
 * 
 * @example
 * const result = await query('SELECT * FROM dim_region WHERE state_code = $1', ['CA']);
 * console.log(result.rows);
 */
async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
