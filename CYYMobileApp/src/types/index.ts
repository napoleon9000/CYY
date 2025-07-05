export interface Medication {
  id: string;
  name: string;
  dosage: string;
  reminderTime: string; // HH:MM format
  reminderDays: number[]; // 0-6, where 0 is Sunday
  notificationTypes: ('notification' | 'sound' | 'vibration')[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  color: string;
  icon: string;
  notes?: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'taken' | 'skipped' | 'pending';
  photoUri?: string;
  notes?: string;
  createdAt: Date;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderSnoozeMinutes: number;
  darkMode: boolean;
  reminderPersistence: boolean;
}

export type RootStackParamList = {
  MainTabs: undefined;
  AddMedication: { medication?: Medication };
  MedicationDetails: { medicationId: string };
  Camera: { medicationId: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Add: undefined;
  History: undefined;
  Settings: undefined;
};