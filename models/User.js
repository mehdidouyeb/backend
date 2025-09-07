/**
 * User Model - handles all user database operations
 * Purpose: Encapsulates all user-related database queries
 * Why: Single responsibility - only deals with user data
 */

const bcrypt = require('bcryptjs');

class User {
    constructor(db) {
        this.db = db;
    }

    /**
     * Create a new user
     * @param {string} username - User's chosen username
     * @param {string} password - User's plain text password
     * @returns {Promise} - Resolves with user object or rejects with error
     */
    async create(username, password) {
        try {
            // Hash password before storing (NEVER store plain text passwords!)
            const saltRounds = 10; // How many times to hash (more = more secure but slower)
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Insert user into database (PostgreSQL syntax)
            const query = 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username';
            const result = await this.db.query(query, [username, passwordHash]);

            // Return the newly created user
            return result.rows[0];
        } catch (error) {
            // Check if username already exists (PostgreSQL error code)
            if (error.code === '23505') { // unique_violation
                throw new Error('Username already exists');
            }
            throw error;
        }
    }

    /**
     * Find user by username
     * @param {string} username - Username to search for
     * @returns {Promise} - Resolves with user object or null
     */
    async findByUsername(username) {
        try {
            const query = 'SELECT * FROM users WHERE username = $1';
            const result = await this.db.query(query, [username]);

            return result.rows[0] || null; // Return user or null if not found
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify user password
     * @param {string} plainPassword - Password user entered
     * @param {string} hashedPassword - Stored hashed password
     * @returns {Promise<boolean>} - True if password matches
     */
    async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise} - Resolves with user object or null
     */
    async findById(id) {
        try {
            const query = 'SELECT id, username, created_at FROM users WHERE id = $1';
            const result = await this.db.query(query, [id]);

            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search users by username (for user search functionality)
     * @param {string} searchTerm - Username search term
     * @param {number} limit - Maximum number of results
     * @returns {Promise} - Resolves with array of users
     */
    async searchByUsername(searchTerm, limit = 10) {
        try {
            const query = 'SELECT id, username FROM users WHERE username ILIKE $1 LIMIT $2';
            const result = await this.db.query(query, [`%${searchTerm}%`, limit]);

            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;