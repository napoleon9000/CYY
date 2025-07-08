# Backend Requirements for Friend System

## Overview

This document outlines the backend services and API endpoints required to support the friend system in the CYY medication reminder app.

## Technology Stack Recommendations

- **Node.js** with Express.js or Fastify
- **Database**: PostgreSQL or MongoDB
- **Authentication**: JWT tokens
- **Real-time**: Socket.io or WebSockets
- **Push Notifications**: Firebase Cloud Messaging (FCM) or OneSignal

## API Endpoints

### Authentication

#### POST /api/auth/signup
```json
Request:
{
  "name": "string",
  "email": "string",
  "password": "string"
}

Response:
{
  "token": "jwt-token",
  "user": {
    "userId": "uuid",
    "name": "string",
    "email": "string",
    "friendCode": "ABC123",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/auth/login
```json
Request:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "token": "jwt-token",
  "user": { ... }
}
```

#### GET /api/auth/me
Headers: Authorization: Bearer {token}
```json
Response:
{
  "user": { ... }
}
```

### Friend Management

#### POST /api/friends/add
Headers: Authorization: Bearer {token}
```json
Request:
{
  "friendCode": "ABC123"
}

Response:
{
  "friend": {
    "friendId": "uuid",
    "friendName": "string",
    "friendEmail": "string",
    "status": "pending",
    "addedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/friends
Headers: Authorization: Bearer {token}
```json
Response:
{
  "friends": [
    {
      "friendId": "uuid",
      "friendName": "string",
      "friendEmail": "string",
      "status": "accepted",
      "sharedWithMe": [1, 2, 3],
      "addedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### PUT /api/friends/{friendId}/accept
Headers: Authorization: Bearer {token}
```json
Response:
{
  "success": true
}
```

### Medication Sharing

#### POST /api/medications/share
Headers: Authorization: Bearer {token}
```json
Request:
{
  "medicationId": 123,
  "medicationData": {
    "name": "string",
    "dosage": "string",
    "reminderTime": "HH:MM",
    "reminderDays": [0, 1, 2, 3, 4, 5, 6]
  },
  "friendIds": ["uuid1", "uuid2"]
}

Response:
{
  "success": true
}
```

#### GET /api/medications/shared-with-me
Headers: Authorization: Bearer {token}
```json
Response:
{
  "medications": [
    {
      "medicationId": 123,
      "name": "string",
      "dosage": "string",
      "reminderTime": "HH:MM",
      "reminderDays": [0, 1, 2, 3, 4, 5, 6],
      "sharedBy": {
        "userId": "uuid",
        "name": "string"
      },
      "lastTaken": "2024-01-01T00:00:00Z",
      "compliance": 0.85
    }
  ]
}
```

### Friend Reminders

#### POST /api/reminders/send
Headers: Authorization: Bearer {token}
```json
Request:
{
  "toUserId": "uuid",
  "medicationId": 123,
  "medicationName": "string",
  "message": "string",
  "type": "missed"
}

Response:
{
  "reminder": {
    "id": 456,
    "sentAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET /api/reminders
Headers: Authorization: Bearer {token}
```json
Response:
{
  "reminders": [
    {
      "id": 456,
      "fromUserId": "uuid",
      "fromUserName": "string",
      "medicationName": "string",
      "message": "string",
      "type": "missed",
      "receivedAt": "2024-01-01T00:00:00Z",
      "read": false
    }
  ]
}
```

#### PUT /api/reminders/{reminderId}/read
Headers: Authorization: Bearer {token}
```json
Response:
{
  "success": true
}
```

## WebSocket Events

### Connection
```javascript
socket.on('connect', (token) => {
  // Authenticate user
  // Join user-specific room
});
```

### Friend Events
```javascript
// When a friend request is accepted
socket.emit('friend-accepted', {
  friendId: 'uuid',
  friendName: 'string'
});

// When a medication is shared
socket.emit('medication-shared', {
  fromUserId: 'uuid',
  fromUserName: 'string',
  medicationName: 'string'
});
```

### Reminder Events
```javascript
// When a friend sends a reminder
socket.emit('friend-reminder', {
  id: 456,
  fromUserId: 'uuid',
  fromUserName: 'string',
  medicationId: 123,
  medicationName: 'string',
  message: 'string',
  type: 'missed',
  receivedAt: '2024-01-01T00:00:00Z'
});
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  friend_code VARCHAR(6) UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Friends Table
```sql
CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  friend_id UUID REFERENCES users(id),
  status VARCHAR(20), -- pending, accepted, blocked
  created_at TIMESTAMP,
  UNIQUE(user_id, friend_id)
);
```

### Shared Medications Table
```sql
CREATE TABLE shared_medications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  medication_id INTEGER,
  medication_data JSONB,
  shared_with UUID[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Friend Reminders Table
```sql
CREATE TABLE friend_reminders (
  id SERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  medication_id INTEGER,
  medication_name VARCHAR(255),
  message TEXT,
  type VARCHAR(20),
  sent_at TIMESTAMP,
  read BOOLEAN DEFAULT FALSE
);
```

## Push Notifications

### Setup Requirements

1. **Firebase Cloud Messaging (FCM)**
   - Register app with Firebase
   - Obtain server key
   - Store user FCM tokens

2. **Notification Payload**
```json
{
  "to": "user-fcm-token",
  "notification": {
    "title": "Reminder from {friendName}",
    "body": "{message}",
    "icon": "/medication-icon.png",
    "badge": "/medication-badge.png"
  },
  "data": {
    "type": "friend-reminder",
    "reminderId": 456,
    "medicationId": 123
  }
}
```

## Security Considerations

1. **Authentication**
   - Use bcrypt for password hashing
   - Implement JWT token expiration
   - Rate limit authentication endpoints

2. **Authorization**
   - Verify friend relationships before sharing
   - Validate medication ownership
   - Sanitize user input

3. **Privacy**
   - Only share explicitly allowed medications
   - Allow users to block/unblock friends
   - Implement data deletion on account removal

## Deployment Considerations

1. **Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   FCM_SERVER_KEY=...
   REDIS_URL=...
   ```

2. **Scaling**
   - Use Redis for session management
   - Implement horizontal scaling for WebSockets
   - Use queue system for push notifications

3. **Monitoring**
   - Log all API requests
   - Monitor WebSocket connections
   - Track push notification delivery rates