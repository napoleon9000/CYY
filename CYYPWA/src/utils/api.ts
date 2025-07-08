// API Service Layer - Mock implementation for now
// Replace with actual backend API calls when backend is ready

import { User, Friend, FriendReminder } from '../db/database';

const API_BASE_URL = 'http://localhost:3001/api'; // TODO: Update with actual backend URL

// Mock data for development
let mockUserId = 'user-' + Math.random().toString(36).substr(2, 9);
let mockFriendCode = Math.random().toString(36).substr(2, 6).toUpperCase();

interface AuthResponse {
  token: string;
  user: User;
}

interface FriendRequest {
  friendCode: string;
}

// Authentication APIs
export const authAPI = {
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    // Mock implementation
    const user: User = {
      userId: mockUserId,
      name,
      email,
      friendCode: mockFriendCode,
      createdAt: new Date()
    };
    
    return {
      token: 'mock-jwt-token',
      user
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    // Mock implementation
    const user: User = {
      userId: mockUserId,
      name: 'Test User',
      email,
      friendCode: mockFriendCode,
      createdAt: new Date()
    };
    
    return {
      token: 'mock-jwt-token',
      user
    };
  },

  async logout(): Promise<void> {
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// Friend Management APIs
export const friendAPI = {
  async addFriend(friendCode: string): Promise<Friend> {
    // Mock implementation
    const friend: Friend = {
      userId: mockUserId,
      friendId: 'friend-' + Math.random().toString(36).substr(2, 9),
      friendName: 'Friend User',
      friendEmail: 'friend@example.com',
      status: 'pending',
      sharedWithMe: [],
      sharedByMe: [],
      addedAt: new Date()
    };
    
    return friend;
  },

  async acceptFriendRequest(friendId: string): Promise<Friend> {
    // Mock implementation
    const friend: Friend = {
      userId: mockUserId,
      friendId,
      friendName: 'Friend User',
      friendEmail: 'friend@example.com',
      status: 'accepted',
      sharedWithMe: [],
      sharedByMe: [],
      addedAt: new Date()
    };
    
    return friend;
  },

  async getFriends(): Promise<Friend[]> {
    // Mock implementation - return empty array for now
    return [];
  },

  async shareMedication(medicationId: number, friendIds: string[]): Promise<void> {
    // Mock implementation
    console.log(`Sharing medication ${medicationId} with friends:`, friendIds);
  },

  async unshareMedication(medicationId: number, friendIds: string[]): Promise<void> {
    // Mock implementation
    console.log(`Unsharing medication ${medicationId} with friends:`, friendIds);
  }
};

// Friend Reminder APIs
export const reminderAPI = {
  async sendReminder(
    toUserId: string,
    medicationId: number,
    medicationName: string,
    message: string,
    type: 'missed' | 'encouragement' | 'custom'
  ): Promise<FriendReminder> {
    // Mock implementation
    const reminder: FriendReminder = {
      fromUserId: mockUserId,
      fromUserName: 'Current User',
      toUserId,
      medicationId,
      medicationName,
      message,
      type,
      sentAt: new Date(),
      receivedAt: new Date(),
      read: false
    };
    
    return reminder;
  },

  async getReminders(): Promise<FriendReminder[]> {
    // Mock implementation - return empty array for now
    return [];
  },

  async markReminderAsRead(reminderId: number): Promise<void> {
    // Mock implementation
    console.log(`Marking reminder ${reminderId} as read`);
  }
};

// WebSocket connection for real-time updates
export class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string) {
    // Mock WebSocket connection
    console.log('Connecting to WebSocket with token:', token);
    
    // In real implementation:
    // this.ws = new WebSocket(`${WS_URL}?token=${token}`);
    // this.setupEventHandlers();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}

export const realtimeService = new RealtimeService();