/**
 * Main Server File
 * Purpose: Initialize and start the Express server with WebSocket support
 * Why: Entry point that connects all components together
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config');
const database = require('./database/db');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const { authenticateToken } = require('./middleware/auth');
const socketAuthService = require('./services/socketAuthService');
const SocketHandlers = require('./handlers/socketHandlers');

// Create Express application
const app = express();
// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);
// Create Socket.io server
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

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

// User routes (search, etc.)
app.use('/users', usersRoutes);

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
 * WebSocket Setup
 * Purpose: Configure Socket.io for real-time messaging
 */

/**
 * Server Startup
 * Purpose: Initialize database and start listening for requests
 */
async function startServer() {
    try {
        // Initialize database first
        await database.initialize();
        console.log('Database initialized successfully');

        // Initialize socket handlers AFTER database is ready
        const socketHandlers = new SocketHandlers(io);

        // Socket authentication middleware
        io.use((socket, next) => {
            socketAuthService.authenticateSocket(socket, next);
        });

        // Handle socket connections
        io.on('connection', (socket) => {
            socketHandlers.handleConnection(socket);
        });

        // Start server (using server instead of app for Socket.io)
        server.listen(config.PORT, () => {
            console.log(`Server running on port ${config.PORT}`);
            console.log(`Health check: http://localhost:${config.PORT}/health`);
            console.log(`WebSocket server ready for connections`);
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
