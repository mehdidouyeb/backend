/**
 * Configuration file - centralizes all app settings
 * Purpose: One place to manage all configuration values
 * Why: Makes it easy to change settings without hunting through code
 */

module.exports = {
    // Server configuration
    PORT: process.env.PORT || 3000,

    // JWT configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    JWT_EXPIRES_IN: '7d', // Token expires in 7 days

    // Database configuration
    DB_PATH: './database.sqlite'
};
