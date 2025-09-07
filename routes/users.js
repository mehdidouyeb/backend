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

        // Use the searchByUsername method from User model
        const allUsers = await userModel.searchByUsername(searchTerm);
        const users = allUsers.filter(user => user.id !== req.user.id);

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

// Removed searchUsers function - now using User model's searchByUsername method

module.exports = router;
