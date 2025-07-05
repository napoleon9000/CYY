import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, MedicationLog, AppSettings } from '../types';
import { flipperLog, flipperPerformance } from './flipper';

const KEYS = {
  MEDICATIONS: '@medications',
  MEDICATION_LOGS: '@medication_logs',
  SETTINGS: '@settings',
};

// Database utility functions
export class Database {
  // Medications
  static async getMedications(): Promise<Medication[]> {
    const perf = flipperPerformance.start('getMedications');
    try {
      const data = await AsyncStorage.getItem(KEYS.MEDICATIONS);
      const medications = data ? JSON.parse(data) : [];
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

  // Settings
  static async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      const defaultSettings: AppSettings = {
        notificationsEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        reminderSnoozeMinutes: 5,
        darkMode: false,
        reminderPersistence: true,
      };
      
      return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        notificationsEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        reminderSnoozeMinutes: 5,
        darkMode: false,
        reminderPersistence: true,
      };
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
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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