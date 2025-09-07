/**
 * Socket Event Handlers
 * Purpose: Handle all WebSocket events and real-time messaging
 * Why: Separates socket event logic from server setup
 */

const Message = require('../models/Message');
const User = require('../models/User');
const socketAuthService = require('../services/socketAuthService');
const database = require('../database/db');

class SocketHandlers {
    constructor(io) {
        this.io = io;
        this.messageModel = new Message(database.getDb());
        this.userModel = new User(database.getDb());
        this.connectedUsers = new Map(); // Track connected users
    }

    /**
     * Handle new socket connection
     * @param {Object} socket - Socket.io socket object
     */
    handleConnection(socket) {
        console.log(`Socket connected: ${socket.id} for user ${socket.username}`);

        // Add user to connected users map
        this.connectedUsers.set(socket.userId, {
            socketId: socket.id,
            username: socket.username,
            connectedAt: new Date()
        });

        // Join user's personal room (for receiving messages)
        const userRoom = socketAuthService.getUserRoom(socket.userId);
        socket.join(userRoom);

        // Handle sending messages
        socket.on('send_message', (data) => this.handleSendMessage(socket, data));

        // Handle joining chat rooms
        socket.on('join_chat', (data) => this.handleJoinChat(socket, data));

        // Handle getting chat history
        socket.on('get_chat_history', (data) => this.handleGetChatHistory(socket, data));

        // Handle disconnect
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }

    /**
     * Handle sending a message
     * @param {Object} socket - Socket.io socket object
     * @param {Object} data - Message data {to_user_id, message}
     */
    async handleSendMessage(socket, data) {
        try {
            const { to_user_id, message } = data;

            // Validate input
            if (!to_user_id || !message || typeof message !== 'string') {
                socket.emit('error', { message: 'Invalid message data' });
                return;
            }

            // Check if recipient exists
            const recipient = await this.userModel.findById(to_user_id);
            if (!recipient) {
                socket.emit('error', { message: 'Recipient not found' });
                return;
            }

            // Save message to database
            const savedMessage = await this.messageModel.create(
                socket.userId,
                to_user_id,
                message.trim()
            );

            // Prepare message object for clients
            const messageObject = {
                id: savedMessage.id,
                from_user_id: socket.userId,
                from_username: socket.username,
                to_user_id: to_user_id,
                to_username: recipient.username,
                message: savedMessage.message,
                timestamp: savedMessage.timestamp
            };

            // Send message to recipient (if they're online)
            const recipientRoom = socketAuthService.getUserRoom(to_user_id);
            this.io.to(recipientRoom).emit('receive_message', messageObject);

            // Send confirmation to sender
            socket.emit('message_sent', messageObject);

            console.log(`Message sent from ${socket.username} to ${recipient.username}`);

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    }

    /**
     * Handle joining a chat room
     * @param {Object} socket - Socket.io socket object
     * @param {Object} data - Chat data {other_user_id}
     */
    async handleJoinChat(socket, data) {
        try {
            const { other_user_id } = data;

            if (!other_user_id) {
                socket.emit('error', { message: 'Invalid chat data' });
                return;
            }

            // Check if other user exists
            const otherUser = await this.userModel.findById(other_user_id);
            if (!otherUser) {
                socket.emit('error', { message: 'User not found' });
                return;
            }

            // Join chat room
            const chatRoom = socketAuthService.getChatRoom(socket.userId, other_user_id);
            socket.join(chatRoom);

            // Send confirmation
            socket.emit('chat_joined', {
                chat_room: chatRoom,
                other_user: {
                    id: otherUser.id,
                    username: otherUser.username
                }
            });

            console.log(`${socket.username} joined chat with ${otherUser.username}`);

        } catch (error) {
            console.error('Error joining chat:', error);
            socket.emit('error', { message: 'Failed to join chat' });
        }
    }

    /**
     * Handle getting chat history
     * @param {Object} socket - Socket.io socket object
     * @param {Object} data - Request data {other_user_id, limit}
     */
    async handleGetChatHistory(socket, data) {
        try {
            const { other_user_id, limit = 50 } = data;

            console.log(`handleGetChatHistory: socket.userId=${socket.userId}, socket.username=${socket.username}, other_user_id=${other_user_id}`);

            if (!other_user_id) {
                socket.emit('error', { message: 'Invalid request data' });
                return;
            }

            // Get chat history
            const messages = await this.messageModel.getChatHistory(
                socket.userId,
                other_user_id,
                limit
            );

            // Send chat history to client
            socket.emit('chat_history', {
                other_user_id,
                messages
            });

            console.log(`Sent ${messages.length} messages to ${socket.username}`);

        } catch (error) {
            console.error('Error getting chat history:', error);
            socket.emit('error', { message: 'Failed to get chat history' });
        }
    }

    /**
     * Handle socket disconnect
     * @param {Object} socket - Socket.io socket object
     */
    handleDisconnect(socket) {
        console.log(`User ${socket.username} disconnected`);

        // Remove from connected users
        this.connectedUsers.delete(socket.userId);
    }

    /**
     * Get list of connected users
     * @returns {Array} - Array of connected user info
     */
    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }
}

module.exports = SocketHandlers;
