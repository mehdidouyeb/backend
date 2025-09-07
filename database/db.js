/**
 * Database connection and setup
 * Purpose: Initialize PostgreSQL database and create tables
 * Why: Separates database logic from business logic
 */

const { Pool } = require('pg');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = null;
    }

    /**
     * Initialize database connection and create tables
     */
    async initialize() {
        try {
            // Create PostgreSQL connection pool
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/messagerie_dev',
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });

            // Test the connection
            const client = await this.pool.connect();
            console.log('Connected to PostgreSQL database');
            client.release();

            // Create tables
            await this.createTables();
        } catch (err) {
            console.error('Error connecting to database:', err.message);
            throw err;
        }
    }

    /**
     * Create necessary tables if they don't exist
     */
    async createTables() {
        try {
            // Users table: stores user accounts (PostgreSQL syntax)
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Messages table: stores chat messages between users (PostgreSQL syntax)
            const createMessagesTable = `
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    from_user_id INTEGER NOT NULL REFERENCES users(id),
                    to_user_id INTEGER NOT NULL REFERENCES users(id),
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            // Create users table first
            await this.pool.query(createUsersTable);
            console.log('Users table ready');

            // Then create messages table
            await this.pool.query(createMessagesTable);
            console.log('Messages table ready');

        } catch (err) {
            console.error('Error creating tables:', err.message);
            throw err;
        }
    }

    /**
     * Get database pool instance
     */
    getDb() {
        return this.pool;
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('Database connection closed');
        }
    }
}

module.exports = new Database();
