/**
 * Socket Authentication Service
 * Purpose: Handle WebSocket authentication with JWT tokens
 * Why: Separates socket auth logic from socket event handling
 */

const authService = require('./authService');

class SocketAuthService {
    /**
     * Authenticate socket connection using JWT token
     * @param {Object} socket - Socket.io socket object
     * @param {Function} next - Socket.io next function
     */
    authenticateSocket(socket, next) {
        try {
            // Get token from socket handshake
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify JWT token
            const decoded = authService.verifyToken(token);

            // Add user info to socket object
            socket.userId = decoded.id;
            socket.username = decoded.username;

            console.log(`User ${decoded.username} (ID: ${decoded.id}) connected via WebSocket`);

            // Continue with connection
            next();
        } catch (error) {
            console.error('Socket authentication error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    }

    /**
     * Get user room name for private messaging
     * @param {number} userId - User ID
     * @returns {string} - Room name for the user
     */
    getUserRoom(userId) {
        return `user_${userId}`;
    }

    /**
     * Get chat room name for two users
     * @param {number} userId1 - First user ID
     * @param {number} userId2 - Second user ID
     * @returns {string} - Room name for the chat
     */
    getChatRoom(userId1, userId2) {
        // Create consistent room name regardless of user order
        const sortedIds = [userId1, userId2].sort((a, b) => a - b);
        return `chat_${sortedIds[0]}_${sortedIds[1]}`;
    }
}

module.exports = new SocketAuthService();
