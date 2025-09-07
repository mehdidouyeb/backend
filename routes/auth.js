/**
 * Authentication Routes
 * Purpose: Handle user registration and login requests
 * Why: Separates auth endpoints from main server file
 */

const express = require('express');
const User = require('../models/User');
const authService = require('../services/authService');
const database = require('../database/db');

const router = express.Router();

/**
 * POST /register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Check minimum requirements
        if (username.length < 3) {
            return res.status(400).json({
                error: 'Username must be at least 3 characters long'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Create user instance
        const userModel = new User(database.getDb());

        // Create user in database
        const user = await userModel.create(username, password);

        // Generate JWT token
        const token = authService.generateToken(user);

        // Return success response
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error.message);

        if (error.message === 'Username already exists') {
            res.status(409).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

/**
 * POST /login
 * Login existing user
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Create user instance
        const userModel = new User(database.getDb());

        // Find user by username
        const user = await userModel.findByUsername(username);

        if (!user) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }

        // Verify password
        const isValidPassword = await userModel.verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const token = authService.generateToken({
            id: user.id,
            username: user.username
        });

        // Return success response
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
