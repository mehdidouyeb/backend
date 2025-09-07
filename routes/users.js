/**
 * User Routes
 * Purpose: Handle user-related requests (search, profile, etc.)
 * Why: Separates user endpoints from auth endpoints
 */

const express = require('express');
const User = require('../models/User');
const database = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /search?q=username
 * Search for users by username
 */
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;

        // Validate search query
        if (!q || q.trim().length < 1) {
            return res.status(400).json({
                error: 'Search query is required'
            });
        }

        const searchTerm = q.trim();

        // Don't allow searching for very short terms
        if (searchTerm.length < 2) {
            return res.status(400).json({
                error: 'Search query must be at least 2 characters long'
            });
        }

        // Search for users (excluding current user)
        const userModel = new User(database.getDb());

        // Custom search method for users
        const users = await searchUsers(userModel, searchTerm, req.user.id);

        res.json({
            query: searchTerm,
            users: users.map(user => ({
                id: user.id,
                username: user.username
            }))
        });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Search for users by username pattern
 * @param {User} userModel - User model instance
 * @param {string} searchTerm - Search term
 * @param {number} currentUserId - ID of current user (to exclude)
 * @returns {Promise<Array>} - Array of matching users
 */
function searchUsers(userModel, searchTerm, currentUserId) {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT id, username, created_at 
      FROM users 
      WHERE username LIKE ? AND id != ?
      ORDER BY username ASC
      LIMIT 20
    `;

        const searchPattern = `%${searchTerm}%`;

        userModel.db.all(query, [searchPattern, currentUserId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
}

module.exports = router;
