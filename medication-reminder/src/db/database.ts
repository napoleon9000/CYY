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

class MedicationDatabase extends Dexie {
  medications!: Table<Medication>;
  medicationLogs!: Table<MedicationLog>;
  notifications!: Table<Notification>;

  constructor() {
    super('MedicationReminderDB');
    
    this.version(1).stores({
      medications: '++id, name, reminderTime, isActive',
      medicationLogs: '++id, medicationId, takenAt, skipped',
      notifications: '++id, medicationId, scheduledFor, sent'
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