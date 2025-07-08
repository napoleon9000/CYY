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

// 新增：用户信息
export interface User {
  id?: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  inviteCode: string; // 用于邀请好友的唯一码
  createdAt: Date;
}

// 新增：好友关系
export interface Friend {
  id?: number;
  userId: number;
  friendUserId: number;
  friendUsername: string;
  friendDisplayName: string;
  friendAvatarUrl?: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  acceptedAt?: Date;
}

// 新增：药物分享
export interface SharedMedication {
  id?: number;
  medicationId: number;
  userId: number;
  sharedWithFriendId: number;
  sharedWithUsername: string;
  canRemind: boolean; // 是否允许这个好友提醒
  isActive: boolean;
  createdAt: Date;
}

// 新增：好友提醒
export interface FriendReminder {
  id?: number;
  sharedMedicationId: number;
  fromUserId: number;
  fromUsername: string;
  toUserId: number;
  medicationName: string;
  reminderMessage: string;
  sentAt: Date;
  readAt?: Date;
  type: 'missed_dose' | 'encouragement' | 'custom';
}

// 新增：邀请链接
export interface InviteLink {
  id?: number;
  userId: number;
  inviteCode: string;
  createdAt: Date;
  expiresAt?: Date;
  usedByUserId?: number;
  usedAt?: Date;
  isActive: boolean;
}

class MedicationDatabase extends Dexie {
  medications!: Table<Medication>;
  medicationLogs!: Table<MedicationLog>;
  notifications!: Table<Notification>;
  // 新增的表
  users!: Table<User>;
  friends!: Table<Friend>;
  sharedMedications!: Table<SharedMedication>;
  friendReminders!: Table<FriendReminder>;
  inviteLinks!: Table<InviteLink>;

  constructor() {
    super('MedicationReminderDB');
    
    this.version(1).stores({
      medications: '++id, name, reminderTime, isActive',
      medicationLogs: '++id, medicationId, takenAt, skipped',
      notifications: '++id, medicationId, scheduledFor, sent'
    });

    // 新版本，添加好友相关表
    this.version(2).stores({
      medications: '++id, name, reminderTime, isActive',
      medicationLogs: '++id, medicationId, takenAt, skipped',
      notifications: '++id, medicationId, scheduledFor, sent',
      users: '++id, username, inviteCode',
      friends: '++id, userId, friendUserId, status',
      sharedMedications: '++id, medicationId, userId, sharedWithFriendId, isActive',
      friendReminders: '++id, sharedMedicationId, fromUserId, toUserId, sentAt',
      inviteLinks: '++id, userId, inviteCode, isActive'
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

// 新增：好友相关的辅助函数
export const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generateUsername = (): string => {
  const adjectives = ['Happy', 'Healthy', 'Wise', 'Kind', 'Bright', 'Calm', 'Strong'];
  const nouns = ['Healer', 'Helper', 'Friend', 'Guardian', 'Companion', 'Supporter'];
  const randomNum = Math.floor(Math.random() * 1000);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${randomNum}`;
};