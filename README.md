# Chat App Backend

Simple backend for a React Native chat application.

## Installation

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm run dev
```

The server will start on <http://localhost:3000>

## Testing the API

### Health Check

```bash
curl http://localhost:3000/health
```

### Register a User

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### Test Protected Route (use token from login response)

```bash
curl http://localhost:3000/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Project Structure

```
backend/
├── config.js              # App configuration
├── server.js              # Main server file
├── database/
│   └── db.js              # Database setup
├── models/
│   └── User.js            # User data operations
├── services/
│   └── authService.js     # JWT token handling
├── middleware/
│   └── auth.js            # Authentication middleware
└── routes/
    └── auth.js            # Authentication endpoints
```
