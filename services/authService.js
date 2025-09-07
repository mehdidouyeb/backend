/**
 * Authentication Service - handles JWT tokens
 * Purpose: Manages user authentication tokens
 * Why: Centralizes all token-related operations
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

class AuthService {
    /**
     * Generate JWT token for user
     * @param {Object} user - User object with id and username
     * @returns {string} - JWT token
     */
    generateToken(user) {
        // Create token with user info (payload)
        const payload = {
            id: user.id,
            username: user.username
        };

        // Sign token with secret key and set expiration
        return jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRES_IN
        });
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token to verify
     * @returns {Object} - Decoded token payload
     * @throws {Error} - If token is invalid or expired
     */
    verifyToken(token) {
        try {
            // Verify token with secret key
            return jwt.verify(token, config.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Extract token from Authorization header
     * @param {string} authHeader - Authorization header value
     * @returns {string|null} - Token or null if not found
     */
    extractTokenFromHeader(authHeader) {
        // Expected format: "Bearer <token>"
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7); // Remove "Bearer " prefix
        }
        return null;
    }
}

module.exports = new AuthService();
