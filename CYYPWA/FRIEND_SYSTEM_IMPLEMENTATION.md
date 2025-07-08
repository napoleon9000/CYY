# Friend System Implementation Guide

## Overview

This document outlines the comprehensive friend system implementation for the CYY medication reminder app. The system allows users to:

1. **Add friends** via unique friend codes or shareable links
2. **Share medication schedules** with selected friends
3. **View friends' shared medications** and their compliance status
4. **Send reminders** when friends miss their medication doses
5. **Receive push notifications** for friend reminders

## Architecture

### Database Schema

#### New Tables Added to IndexedDB:

```typescript
// User profile (synced with backend)
User {
  id?: number;
  userId: string;         // UUID from backend
  name: string;
  email: string;
  avatar?: string;
  friendCode: string;     // Unique 6-character code
  createdAt: Date;
}

// Friend relationships
Friend {
  id?: number;
  userId: string;         // Current user's ID
  friendId: string;       // Friend's user ID
  friendName: string;
  friendEmail: string;
  friendAvatar?: string;
  status: 'pending' | 'accepted' | 'blocked';
  sharedWithMe: number[]; // Medication IDs friend shares with me
  sharedByMe: number[];   // Medication IDs I share with friend
  addedAt: Date;
}

// Shared medication tracking
SharedMedication {
  id?: number;
  medicationId: number;
  sharedWithUserIds: string[]; // Array of friend user IDs
  sharedAt: Date;
}

// Friend reminders
FriendReminder {
  id?: number;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  medicationId: number;
  medicationName: string;
  message: string;
  type: 'missed' | 'encouragement' | 'custom';
  sentAt: Date;
  receivedAt: Date;
  read: boolean;
}
```

### Component Structure

1. **AuthContext** (`contexts/AuthContext.tsx`)
   - Manages user authentication state
   - Handles login/signup/logout
   - Connects to real-time services when authenticated

2. **Login Component** (`components/Login.tsx`)
   - Beautiful login/signup interface
   - Form validation
   - Demo mode for testing

3. **Friends Component** (`components/Friends.tsx`)
   - Main friend management interface
   - Three tabs: Friends, Shared, Reminders
   - Add friends via code
   - Share medications
   - View reminders

4. **FriendMedications Component** (`components/FriendMedications.tsx`)
   - Displays a friend's shared medications
   - Shows compliance status (taken/missed/upcoming)
   - Send reminder functionality
   - Real-time status updates

### API Service Layer

The `utils/api.ts` file provides a mock API layer that can be easily replaced with real backend calls:

```typescript
// Authentication APIs
authAPI.signup(name, email, password)
authAPI.login(email, password)
authAPI.logout()
authAPI.getCurrentUser()

// Friend Management APIs
friendAPI.addFriend(friendCode)
friendAPI.acceptFriendRequest(friendId)
friendAPI.getFriends()
friendAPI.shareMedication(medicationId, friendIds)

// Reminder APIs
reminderAPI.sendReminder(toUserId, medicationId, message, type)
reminderAPI.getReminders()
reminderAPI.markReminderAsRead(reminderId)

// Real-time Service
realtimeService.connect(token)
realtimeService.on(event, callback)
realtimeService.emit(event, data)
```

### Notification System

The `utils/friendNotifications.ts` handles:
- Push notification display for friend reminders
- Sound and vibration alerts
- Badge count updates
- Unread reminder tracking

## User Flow

### Adding Friends

1. **Via Friend Code:**
   - User navigates to Friends tab
   - Clicks "Add Friend" button
   - Enters friend's 6-character code
   - Friend request is sent

2. **Via Shareable Link:**
   - User copies their friend link from the Friends tab
   - Shares link via messaging/social media
   - When clicked, link opens app with pre-filled friend code

### Sharing Medications

1. User goes to Friends > Shared tab
2. Selects a medication from dropdown
3. Chooses which friends to share with
4. Clicks "Share Medication"
5. Friends can now see this medication

### Sending Reminders

1. Friend views shared medications
2. System automatically detects missed doses
3. "Send Reminder" button appears for missed medications
4. Clicking sends a push notification to the friend

## Features Implementation Status

### ✅ Completed:
- Database schema with all required tables
- Authentication context and login UI
- Friends management component with tabs
- Medication sharing interface
- Friend medications viewer
- Reminder sending functionality
- Push notification handler
- Mock API service layer

### 🚧 Requires Backend:
- User authentication (currently using mock)
- Friend code generation and validation
- Real-time WebSocket connections
- Push notification delivery
- Data synchronization

### 📱 PWA Features:
- Offline support via IndexedDB
- Push notifications (when backend is connected)
- App badge for unread reminders
- Installable on all devices

## Testing the System

### Demo Mode:
1. Use any email/password to login (mock authentication)
2. Your friend code will be displayed in the Friends tab
3. Add mock friends using the "Add Friend" button
4. Share medications and test the interface

### Next Steps for Production:

1. **Backend Development:**
   - User authentication service
   - Friend relationship management
   - WebSocket server for real-time updates
   - Push notification service

2. **Security:**
   - JWT token validation
   - Friend request approval system
   - Privacy controls for shared data

3. **Enhancements:**
   - Profile photo uploads
   - Custom reminder messages
   - Medication history sharing
   - Group medication challenges

## Code Quality

The implementation follows React best practices:
- TypeScript for type safety
- Component composition
- Custom hooks for reusable logic
- Proper error handling
- Loading states
- Responsive design

## Performance Considerations

- Lazy loading of friend data
- Efficient IndexedDB queries
- Debounced real-time updates
- Optimistic UI updates
- Minimal re-renders with proper React patterns