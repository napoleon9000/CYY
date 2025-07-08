import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, MedicationLog, AppSettings, RetryNotification } from '../types';
import { flipperLog, flipperPerformance } from './flipper';
import { DEFAULT_APP_SETTINGS } from './constants';

const KEYS = {
  MEDICATIONS: '@medications',
  MEDICATION_LOGS: '@medication_logs',
  SETTINGS: '@settings',
  RETRY_NOTIFICATIONS: '@retry_notifications',
};

// Database utility functions
export class Database {
  // Medications
  static async getMedications(): Promise<Medication[]> {
    const perf = flipperPerformance.start('getMedications');
    try {
      const data = await AsyncStorage.getItem(KEYS.MEDICATIONS);
      let medications = data ? JSON.parse(data) : [];
      
      // Data migration: Add retryCount and criticalNotification fields to existing medications
      let needsUpdate = false;
      medications = medications.map((med: any) => {
        let updated = { ...med };
        if (med.retryCount === undefined) {
          needsUpdate = true;
          updated.retryCount = 0;
        }
        if (med.criticalNotification === undefined) {
          needsUpdate = true;
          updated.criticalNotification = false;
        }
        return updated;
      });
      
      // Save updated medications if migration was needed
      if (needsUpdate) {
        await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(medications));
        flipperLog.database('MIGRATE', 'medications', { count: medications.length, addedRetryCount: true, addedCriticalNotification: true });
      }
      
      flipperLog.database('GET', 'medications', { count: medications.length });
      perf.end();
      return medications;
    } catch (error) {
      flipperLog.error('Error getting medications', error);
      console.error('Error getting medications:', error);
      perf.end();
      return [];
    }
  }

  static async saveMedication(medication: Medication): Promise<void> {
    const perf = flipperPerformance.start('saveMedication');
    try {
      const medications = await this.getMedications();
      const existingIndex = medications.findIndex(m => m.id === medication.id);
      
      if (existingIndex >= 0) {
        medications[existingIndex] = { ...medication, updatedAt: new Date() };
        flipperLog.database('UPDATE', 'medications', { id: medication.id, name: medication.name });
      } else {
        medications.push(medication);
        flipperLog.database('CREATE', 'medications', { id: medication.id, name: medication.name });
      }
      
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(medications));
      perf.end();
    } catch (error) {
      flipperLog.error('Error saving medication', error);
      console.error('Error saving medication:', error);
      perf.end();
      throw error;
    }
  }

  static async deleteMedication(medicationId: string): Promise<void> {
    try {
      const medications = await this.getMedications();
      const filtered = medications.filter(m => m.id !== medicationId);
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(filtered));
      
      // Also clean up related logs
      const logs = await this.getMedicationLogs();
      const filteredLogs = logs.filter(log => log.medicationId !== medicationId);
      await AsyncStorage.setItem(KEYS.MEDICATION_LOGS, JSON.stringify(filteredLogs));
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  }

  static async getMedicationById(id: string): Promise<Medication | null> {
    try {
      const medications = await this.getMedications();
      return medications.find(m => m.id === id) || null;
    } catch (error) {
      console.error('Error getting medication by ID:', error);
      return null;
    }
  }

  // Medication Logs
  static async getMedicationLogs(): Promise<MedicationLog[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEDICATION_LOGS);
      return data ? JSON.parse(data).map((log: any) => ({
        ...log,
        scheduledTime: new Date(log.scheduledTime),
        actualTime: log.actualTime ? new Date(log.actualTime) : undefined,
        createdAt: new Date(log.createdAt),
      })) : [];
    } catch (error) {
      console.error('Error getting medication logs:', error);
      return [];
    }
  }

  static async saveMedicationLog(log: MedicationLog): Promise<void> {
    try {
      const logs = await this.getMedicationLogs();
      const existingIndex = logs.findIndex(l => l.id === log.id);
      
      if (existingIndex >= 0) {
        logs[existingIndex] = log;
      } else {
        logs.push(log);
      }
      
      await AsyncStorage.setItem(KEYS.MEDICATION_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving medication log:', error);
      throw error;
    }
  }

  static async getLogsByMedicationId(medicationId: string): Promise<MedicationLog[]> {
    try {
      const logs = await this.getMedicationLogs();
      return logs.filter(log => log.medicationId === medicationId);
    } catch (error) {
      console.error('Error getting logs by medication ID:', error);
      return [];
    }
  }

  static async deleteMedicationLog(logId: string): Promise<void> {
    const perf = flipperPerformance.start('deleteMedicationLog');
    try {
      const logs = await this.getMedicationLogs();
      const filteredLogs = logs.filter(log => log.id !== logId);
      
      await AsyncStorage.setItem(KEYS.MEDICATION_LOGS, JSON.stringify(filteredLogs));
      flipperLog.database('DELETE', 'medication_logs', { id: logId });
      perf.end();
    } catch (error) {
      flipperLog.error('Error deleting medication log', error);
      console.error('Error deleting medication log:', error);
      perf.end();
      throw error;
    }
  }

  // Settings
  static async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(data) } : DEFAULT_APP_SETTINGS;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_APP_SETTINGS;
    }
  }

  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Utility functions
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.MEDICATIONS,
        KEYS.MEDICATION_LOGS,
        KEYS.SETTINGS,
        KEYS.RETRY_NOTIFICATIONS,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Retry Notifications
  static async getRetryNotifications(): Promise<RetryNotification[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.RETRY_NOTIFICATIONS);
      return data ? JSON.parse(data).map((notification: any) => ({
        ...notification,
        originalNotificationTime: new Date(notification.originalNotificationTime),
        nextRetryTime: new Date(notification.nextRetryTime),
        createdAt: new Date(notification.createdAt),
      })) : [];
    } catch (error) {
      console.error('Error getting retry notifications:', error);
      return [];
    }
  }

  static async saveRetryNotification(notification: RetryNotification): Promise<void> {
    try {
      const notifications = await this.getRetryNotifications();
      const existingIndex = notifications.findIndex(n => n.id === notification.id);
      
      if (existingIndex >= 0) {
        notifications[existingIndex] = notification;
      } else {
        notifications.push(notification);
      }
      
      await AsyncStorage.setItem(KEYS.RETRY_NOTIFICATIONS, JSON.stringify(notifications));
      flipperLog.database('CREATE', 'retry_notifications', { id: notification.id, medicationId: notification.medicationId });
    } catch (error) {
      console.error('Error saving retry notification:', error);
      throw error;
    }
  }

  static async cancelRetryNotifications(medicationId: string, originalNotificationTime: Date): Promise<void> {
    try {
      const notifications = await this.getRetryNotifications();
      const updatedNotifications = notifications.map(notification => {
        if (notification.medicationId === medicationId && 
            notification.originalNotificationTime.getTime() === originalNotificationTime.getTime()) {
          return { ...notification, isActive: false };
        }
        return notification;
      });
      
      await AsyncStorage.setItem(KEYS.RETRY_NOTIFICATIONS, JSON.stringify(updatedNotifications));
      flipperLog.database('UPDATE', 'retry_notifications', { medicationId, originalTime: originalNotificationTime.toISOString() });
    } catch (error) {
      console.error('Error canceling retry notifications:', error);
      throw error;
    }
  }

  static async getActiveRetryNotifications(): Promise<RetryNotification[]> {
    try {
      const notifications = await this.getRetryNotifications();
      return notifications.filter(n => n.isActive);
    } catch (error) {
      console.error('Error getting active retry notifications:', error);
      return [];
    }
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

// Predefined colors and icons
export const MEDICATION_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FECA57', '#A29BFE', '#E84393', '#F39C12'
];

export const MEDICATION_ICONS = [
  'local-pharmacy', 'medical-services', 'favorite', 'healing', 'thermostat',
  'monitor-heart', 'vaccines', 'medication', 'tablet-mac', 'water-drop',
  'vitamin', 'colorize', 'health-and-safety', 'first-aid', 'add'
];