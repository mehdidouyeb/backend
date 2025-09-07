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
     * @returns {Promise} - Resolves with user ID or rejects with error
     */
    async create(username, password) {
        return new Promise(async (resolve, reject) => {
            try {
                // Hash password before storing (NEVER store plain text passwords!)
                const saltRounds = 10; // How many times to hash (more = more secure but slower)
                const passwordHash = await bcrypt.hash(password, saltRounds);

                // Insert user into database
                const query = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';

                this.db.run(query, [username, passwordHash], function (err) {
                    if (err) {
                        // Check if username already exists
                        if (err.message.includes('UNIQUE constraint failed')) {
                            reject(new Error('Username already exists'));
                        } else {
                            reject(err);
                        }
                    } else {
                        // this.lastID is the ID of the newly created user
                        resolve({ id: this.lastID, username });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Find user by username
     * @param {string} username - Username to search for
     * @returns {Promise} - Resolves with user object or null
     */
    async findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE username = ?';

            this.db.get(query, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null); // Return user or null if not found
                }
            });
        });
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
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, username, created_at FROM users WHERE id = ?';

            this.db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }
}

module.exports = User;
