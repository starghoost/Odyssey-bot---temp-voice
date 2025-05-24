// database/mysql.js

/**
 * This module handles the MySQL database connection using a connection pool.
 * It ensures the required database and tables exist at startup and exposes
 * connection utilities for use across the bot.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

let connection;

/**
 * Establishes a connection to the MySQL database.
 * - Creates the database if it doesn't exist.
 * - Ensures all required tables exist using schema.sql.
 * - Adds missing columns like `privacy` in temp_channels if needed.
 * 
 * @returns {Promise<mysql.Pool>} The active connection pool.
 */
async function connectToDatabase() {
  if (!connection) {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

    // Initial one-time connection to create the database if it doesn't exist
    const baseConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD
    });

    await baseConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await baseConnection.end();

    // Establish connection pool to the specified database
    connection = await mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });

    await connection.query(`USE \`${DB_NAME}\``);

    // List of expected tables for the bot to function correctly
    const requiredTables = [
      'base_channels',
      'temp_channels',
      'channel_bans',
      'admin_roles',
      'channel_whitelist'
    ];

    // Retrieve existing tables and identify missing ones
    const [existingTables] = await connection.query('SHOW TABLES');
    const existingTableNames = existingTables.map(row => Object.values(row)[0].toLowerCase());
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));

    // If tables are missing, load and apply definitions from schema.sql
    if (missingTables.length > 0) {
      console.log('⚠ Missing tables detected:', missingTables);
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const statements = schema
        .split(/;\s*(\r?\n|$)/)
        .map(stmt => stmt.trim())
        .filter(stmt =>
          stmt.length &&
          !stmt.toLowerCase().startsWith('create database') &&
          !stmt.toLowerCase().startsWith('use ')
        );

      for (const stmt of statements) {
        const match = stmt.match(/CREATE TABLE\s+(\w+)/i);
        if (match) {
          const tableName = match[1].toLowerCase();
          if (missingTables.includes(tableName)) {
            await connection.query(stmt);
          }
        }
      }

      console.log('✅ Tables created from schema.sql');
    }

    // Add missing `privacy` column to temp_channels table (for backward compatibility)
    const [cols] = await connection.query("SHOW COLUMNS FROM temp_channels LIKE 'privacy'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE temp_channels ADD COLUMN privacy TINYINT DEFAULT 0");
      console.log('✅ Column "privacy" added to temp_channels');
    }

    console.log('MySQL connected and schema verified');
  }

  return connection;
}

/**
 * Returns the current MySQL connection pool.
 * @throws Error if the database has not been connected yet.
 */
function getDb() {
  if (!connection) throw new Error('Database not connected');
  return connection;
}

module.exports = { connectToDatabase, getDb };
