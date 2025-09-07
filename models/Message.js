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
        return new Promise((resolve, reject) => {
            const query = `
        INSERT INTO messages (from_user_id, to_user_id, message) 
        VALUES (?, ?, ?)
      `;

            this.db.run(query, [fromUserId, toUserId, messageText], function (err) {
                if (err) {
                    reject(err);
                } else {
                    // Return the created message with its ID
                    resolve({
                        id: this.lastID,
                        from_user_id: fromUserId,
                        to_user_id: toUserId,
                        message: messageText,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    }

    /**
     * Get chat history between two users
     * @param {number} userId1 - First user ID
     * @param {number} userId2 - Second user ID
     * @param {number} limit - Maximum number of messages to return
     * @returns {Promise} - Resolves with array of messages
     */
    async getChatHistory(userId1, userId2, limit = 50) {
        return new Promise((resolve, reject) => {
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
          (m.from_user_id = ? AND m.to_user_id = ?) OR 
          (m.from_user_id = ? AND m.to_user_id = ?)
        ORDER BY m.timestamp ASC
        LIMIT ?
      `;

            this.db.all(query, [userId1, userId2, userId2, userId1, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    /**
     * Get recent conversations for a user
     * @param {number} userId - User ID
     * @returns {Promise} - Resolves with array of recent conversations
     */
    async getRecentConversations(userId) {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT DISTINCT
          CASE 
            WHEN m.from_user_id = ? THEN m.to_user_id 
            ELSE m.from_user_id 
          END as other_user_id,
          u.username as other_username,
          m.message as last_message,
          m.timestamp as last_message_time
        FROM messages m
        JOIN users u ON (
          CASE 
            WHEN m.from_user_id = ? THEN m.to_user_id = u.id
            ELSE m.from_user_id = u.id
          END
        )
        WHERE m.from_user_id = ? OR m.to_user_id = ?
        ORDER BY m.timestamp DESC
        LIMIT 20
      `;

            this.db.all(query, [userId, userId, userId, userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }
}

module.exports = Message;
