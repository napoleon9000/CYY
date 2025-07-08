import Dexie, { Table } from 'dexie';

export interface Medication {
  id?: number;
  name: string;
  dosage: string;
  reminderTime: string; // HH:MM format
  reminderDays: number[]; // 0-6, where 0 is Sunday
  notificationType: 'notification' | 'sound' | 'vibration';
  isActive: boolean;
  createdAt: Date;
  color: string; // For visual distinction
  icon: string; // Icon name for the medication
}

export interface MedicationLog {
  id?: number;
  medicationId: number;
  takenAt: Date;
  photoUrl?: string;
  skipped: boolean;
  snoozedUntil?: Date;
  notes?: string;
}

export interface Notification {
  id?: number;
  medicationId: number;
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  snoozedUntil?: Date;
}

// New interfaces for friend system
export interface User {
  id?: number;
  userId: string; // UUID from backend
  name: string;
  email: string;
  avatar?: string;
  friendCode: string; // Unique code for adding friends
  createdAt: Date;
}

export interface Friend {
  id?: number;
  userId: string; // Current user's ID
  friendId: string; // Friend's user ID
  friendName: string;
  friendEmail: string;
  friendAvatar?: string;
  status: 'pending' | 'accepted' | 'blocked';
  sharedWithMe: number[]; // Medication IDs friend shares with me
  sharedByMe: number[]; // Medication IDs I share with friend
  addedAt: Date;
}

export interface SharedMedication {
  id?: number;
  medicationId: number;
  sharedWithUserIds: string[]; // Array of friend user IDs
  sharedAt: Date;
}

export interface FriendReminder {
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

class MedicationDatabase extends Dexie {
  medications!: Table<Medication>;
  medicationLogs!: Table<MedicationLog>;
  notifications!: Table<Notification>;
  user!: Table<User>;
  friends!: Table<Friend>;
  sharedMedications!: Table<SharedMedication>;
  friendReminders!: Table<FriendReminder>;

  constructor() {
    super('MedicationReminderDB');
    
    this.version(2).stores({
      medications: '++id, name, reminderTime, isActive',
      medicationLogs: '++id, medicationId, takenAt, skipped',
      notifications: '++id, medicationId, scheduledFor, sent',
      user: '++id, userId, email, friendCode',
      friends: '++id, userId, friendId, status',
      sharedMedications: '++id, medicationId',
      friendReminders: '++id, toUserId, fromUserId, read, receivedAt'
    });
  }
}

export const db = new MedicationDatabase();

// Helper functions
export const getMedicationColors = () => [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#48DBFB', '#A29BFE', '#FD79A8'
];

export const getMedicationIcons = () => [
  'FaPills', 'FaCapsules', 'FaTablets', 'FaSyringe', 'FaPrescriptionBottle',
  'FaFirstAid', 'FaHeartbeat', 'FaBandAid', 'FaThermometer', 'FaStethoscope'
];