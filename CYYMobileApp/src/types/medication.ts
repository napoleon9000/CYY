/**
 * Medication-related types for the CYY Mobile App
 */

/**
 * Notification types available for medications
 */
export type NotificationType = 'notification' | 'sound' | 'vibration';

/**
 * Medication log status types
 */
export type MedicationLogStatus = 'taken' | 'skipped' | 'pending';

/**
 * Medication interface
 */
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  reminderTime: string; // HH:MM format
  reminderDays: number[]; // 0-6, where 0 is Sunday
  notificationTypes: NotificationType[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  color: string;
  icon: string;
  notes?: string;
}

/**
 * Medication log interface
 */
export interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: MedicationLogStatus;
  photoUri?: string;
  notes?: string;
  createdAt: Date;
}

/**
 * Medication form data interface (for AddMedicationScreen)
 */
export interface MedicationFormData {
  name: string;
  dosage: string;
  reminderTime: string;
  reminderDays: number[];
  notificationTypes: NotificationType[];
  color: string;
  icon: string;
  notes: string;
}

/**
 * Upcoming medication interface (for TrackScreen)
 */
export interface UpcomingMedication {
  medication: Medication;
  nextDose: Date;
  timeUntil: string;
  todayStatus?: MedicationLogStatus | null;
  logId?: string;
}

/**
 * Grouped medication logs interface
 */
export interface GroupedMedicationLogs {
  [date: string]: MedicationLog[];
}

/**
 * Medication statistics interface
 */
export interface MedicationStats {
  totalMedications: number;
  activeMedications: number;
  totalLogs: number;
  takenCount: number;
  skippedCount: number;
  complianceRate: number;
  currentStreak: number;
  longestStreak: number;
}