/**
 * Message Model - handles all message database operations
 * Purpose: Encapsulates all message-related database queries
 * Why: Single responsibility - only deals with message data
 */

class Message {
    constructor(db) {
        this.db = db;
    }

    /**
     * Save a new message to database
     * @param {number} fromUserId - ID of user sending message
     * @param {number} toUserId - ID of user receiving message
     * @param {string} messageText - The message content
     * @returns {Promise} - Resolves with message object
     */
    async create(fromUserId, toUserId, messageText) {
        try {
            const query = `
                INSERT INTO messages (from_user_id, to_user_id, message) 
                VALUES ($1, $2, $3) 
                RETURNING id, from_user_id, to_user_id, message, timestamp
            `;

            const result = await this.db.query(query, [fromUserId, toUserId, messageText]);

            // Return the created message
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get chat history between two users
     * @param {number} userId1 - First user ID
     * @param {number} userId2 - Second user ID
     * @param {number} limit - Maximum number of messages to return
     * @returns {Promise} - Resolves with array of messages
     */
    async getChatHistory(userId1, userId2, limit = 50) {
        try {
            console.log(`getChatHistory called with: userId1=${userId1}, userId2=${userId2}, limit=${limit}`);

            const query = `
                SELECT 
                    m.id,
                    m.from_user_id,
                    m.to_user_id,
                    m.message,
                    m.timestamp,
                    u.username as from_username
                FROM messages m
                JOIN users u ON m.from_user_id = u.id
                WHERE 
                    (m.from_user_id = $1 AND m.to_user_id = $2) OR 
                    (m.from_user_id = $2 AND m.to_user_id = $1)
                ORDER BY m.timestamp ASC
                LIMIT $3
            `;

            const result = await this.db.query(query, [userId1, userId2, limit]);

            console.log(`getChatHistory found ${result.rows.length} messages:`, result.rows);
            return result.rows;
        } catch (error) {
            console.error('Error in getChatHistory:', error);
            throw error;
        }
    }

    /**
     * Get recent messages for a user (for notifications, etc.)
     * @param {number} userId - User ID
     * @param {number} limit - Maximum number of messages
     * @returns {Promise} - Resolves with array of recent messages
     */
    async getRecentMessages(userId, limit = 10) {
        try {
            const query = `
                SELECT 
                    m.id,
                    m.from_user_id,
                    m.to_user_id,
                    m.message,
                    m.timestamp,
                    u.username as from_username
                FROM messages m
                JOIN users u ON m.from_user_id = u.id
                WHERE m.to_user_id = $1
                ORDER BY m.timestamp DESC
                LIMIT $2
            `;

            const result = await this.db.query(query, [userId, limit]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Message;