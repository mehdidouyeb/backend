/**
 * Authentication Middleware
 * Purpose: Protect routes that require authentication
 * Why: Reusable function to check if user is logged in
 */

const authService = require('../services/authService');

/**
 * Middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authService.extractTokenFromHeader(authHeader);

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = authService.verifyToken(token);

        // Add user info to request object for use in route handlers
        req.user = decoded;

        // Continue to next middleware/route handler
        next();
    } catch (error) {
        res.status(403).json({
            error: 'Invalid token.'
        });
    }
};

module.exports = { authenticateToken };
