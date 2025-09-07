/**
 * Main Server File
 * Purpose: Initialize and start the Express server
 * Why: Entry point that connects all components together
 */

const express = require('express');
const cors = require('cors');
const config = require('./config');
const database = require('./database/db');
const authRoutes = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');

// Create Express application
const app = express();

/**
 * Middleware Setup
 * Purpose: Configure how the server handles requests
 */

// Enable CORS - allows React Native app to make requests
app.use(cors());

// Parse JSON bodies - converts JSON strings to JavaScript objects
app.use(express.json());

// Log all requests (helpful for debugging)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

/**
 * Routes Setup
 * Purpose: Define what happens for different URLs
 */

// Health check endpoint - test if server is running
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Chat app server is running',
        timestamp: new Date().toISOString()
    });
});

// Authentication routes (register, login)
app.use('/auth', authRoutes);

// Protected route example - requires valid JWT token
app.get('/protected', authenticateToken, (req, res) => {
    res.json({
        message: 'This is a protected route',
        user: req.user // User info from JWT token
    });
});

// 404 handler - when no route matches
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error'
    });
});

/**
 * Server Startup
 * Purpose: Initialize database and start listening for requests
 */
async function startServer() {
    try {
        // Initialize database first
        await database.initialize();
        console.log('Database initialized successfully');

        // Start server
        app.listen(config.PORT, () => {
            console.log(`Server running on port ${config.PORT}`);
            console.log(`Health check: http://localhost:${config.PORT}/health`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1); // Exit if we can't start
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    database.close();
    process.exit(0);
});

// Start the server
startServer();
