/**
 * Database connection and setup
 * Purpose: Initialize SQLite database and create tables
 * Why: Separates database logic from business logic
 */

const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

class Database {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            // Create/connect to SQLite database file
            this.db = new sqlite3.Database(config.DB_PATH, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    /**
     * Create necessary tables if they don't exist
     */
    async createTables() {
        return new Promise((resolve, reject) => {
            // Users table: stores user accounts
            const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

            // Messages table: stores chat messages between users
            const createMessagesTable = `
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_user_id INTEGER NOT NULL,
          to_user_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (from_user_id) REFERENCES users (id),
          FOREIGN KEY (to_user_id) REFERENCES users (id)
        )
      `;

            // Create users table first
            this.db.run(createUsersTable, (err) => {
                if (err) {
                    console.error('Error creating users table:', err.message);
                    reject(err);
                } else {
                    console.log('Users table ready');

                    // Then create messages table
                    this.db.run(createMessagesTable, (err) => {
                        if (err) {
                            console.error('Error creating messages table:', err.message);
                            reject(err);
                        } else {
                            console.log('Messages table ready');
                            resolve();
                        }
                    });
                }
            });
        });
    }

    /**
     * Get database instance
     */
    getDb() {
        return this.db;
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = new Database();
