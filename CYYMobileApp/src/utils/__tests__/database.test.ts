import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../database';
import { createMockMedication, createMockMedicationLog, createMockAppSettings } from '../testUtils';
import { Medication, MedicationLog, AppSettings } from '../../types/medication';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.clear();
  });

  describe('Medications', () => {
    describe('getMedications', () => {
      it('should return empty array when no medications exist', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);
        
        const medications = await Database.getMedications();
        
        expect(medications).toEqual([]);
        expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@medications');
      });

      it('should return medications when they exist', async () => {
        const mockMedications = [createMockMedication(), createMockMedication({ id: 'med-2' })];
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockMedications));
        
        const medications = await Database.getMedications();
        
        expect(medications).toHaveLength(2);
        expect(medications[0].id).toBe(mockMedications[0].id);
        expect(medications[0].name).toBe(mockMedications[0].name);
      });

      it('should migrate medications without retryCount', async () => {
        const medicationWithoutRetryCount = {
          id: 'med-1',
          name: 'Test Med',
          dosage: '10mg',
          // retryCount missing
        };
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([medicationWithoutRetryCount]));
        mockAsyncStorage.setItem.mockResolvedValue();
        
        const medications = await Database.getMedications();
        
        expect(medications[0].retryCount).toBe(0);
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@medications',
          expect.stringContaining('"retryCount":0')
        );
      });

      it('should handle AsyncStorage errors gracefully', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
        
        const medications = await Database.getMedications();
        
        expect(medications).toEqual([]);
      });
    });

    describe('getMedicationById', () => {
      it('should return medication when found', async () => {
        const mockMedication = createMockMedication({ id: 'test-id' });
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockMedication]));
        
        const medication = await Database.getMedicationById('test-id');
        
        expect(medication?.id).toBe('test-id');
        expect(medication?.name).toBe(mockMedication.name);
        expect(medication?.dosage).toBe(mockMedication.dosage);
      });

      it('should return null when medication not found', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
        
        const medication = await Database.getMedicationById('non-existent');
        
        expect(medication).toBeNull();
      });

      it('should handle errors gracefully', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
        
        const medication = await Database.getMedicationById('test-id');
        
        expect(medication).toBeNull();
      });
    });

    describe('saveMedication', () => {
      it('should save new medication', async () => {
        const newMedication = createMockMedication();
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
        mockAsyncStorage.setItem.mockResolvedValue();
        
        await Database.saveMedication(newMedication);
        
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@medications',
          expect.stringContaining(newMedication.id)
        );
      });

      it('should update existing medication', async () => {
        const existingMedication = createMockMedication({ id: 'test-id' });
        const updatedMedication = { ...existingMedication, name: 'Updated Name' };
        
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingMedication]));
        mockAsyncStorage.setItem.mockResolvedValue();
        
        await Database.saveMedication(updatedMedication);
        
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@medications',
          expect.stringContaining('Updated Name')
        );
      });

      it('should handle errors', async () => {
        const medication = createMockMedication();
        // Make sure getMedications succeeds but setItem fails
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
        
        await expect(Database.saveMedication(medication)).rejects.toThrow();
      });
    });

    describe('deleteMedication', () => {
      it('should delete medication and its logs', async () => {
        const medication = createMockMedication({ id: 'test-id' });
        const log = createMockMedicationLog({ medicationId: 'test-id' });
        
        mockAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify([medication])) // medications
          .mockResolvedValueOnce(JSON.stringify([log])); // logs
        
        mockAsyncStorage.setItem.mockResolvedValue();
        
        await Database.deleteMedication('test-id');
        
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@medications', JSON.stringify([]));
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('@medication_logs', JSON.stringify([]));
      });

      it('should handle errors', async () => {
        // Make sure getMedications succeeds but setItem fails
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
        
        await expect(Database.deleteMedication('test-id')).rejects.toThrow();
      });
    });
  });

  describe('Medication Logs', () => {
    describe('getMedicationLogs', () => {
      it('should return empty array when no logs exist', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);
        
        const logs = await Database.getMedicationLogs();
        
        expect(logs).toEqual([]);
      });

      it('should return logs with proper date conversion', async () => {
        const mockLog = {
          ...createMockMedicationLog(),
          scheduledTime: '2024-01-15T08:00:00.000Z',
          actualTime: '2024-01-15T08:05:00.000Z',
          createdAt: '2024-01-15T08:05:00.000Z',
        };
        
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([mockLog]));
        
        const logs = await Database.getMedicationLogs();
        
        expect(logs[0].scheduledTime).toBeInstanceOf(Date);
        expect(logs[0].actualTime).toBeInstanceOf(Date);
        expect(logs[0].createdAt).toBeInstanceOf(Date);
      });

      it('should handle errors gracefully', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
        
        const logs = await Database.getMedicationLogs();
        
        expect(logs).toEqual([]);
      });
    });

    describe('getLogsByMedicationId', () => {
      it('should return logs for specific medication', async () => {
        const log1 = createMockMedicationLog({ medicationId: 'med-1' });
        const log2 = createMockMedicationLog({ medicationId: 'med-2' });
        const log3 = createMockMedicationLog({ medicationId: 'med-1' });
        
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([log1, log2, log3]));
        
        const logs = await Database.getLogsByMedicationId('med-1');
        
        expect(logs).toHaveLength(2);
        expect(logs.every(log => log.medicationId === 'med-1')).toBe(true);
      });

      it('should return empty array when no logs for medication', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
        
        const logs = await Database.getLogsByMedicationId('non-existent');
        
        expect(logs).toEqual([]);
      });
    });

    describe('saveMedicationLog', () => {
      it('should save new log', async () => {
        const newLog = createMockMedicationLog();
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
        mockAsyncStorage.setItem.mockResolvedValue();
        
        await Database.saveMedicationLog(newLog);
        
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@medication_logs',
          expect.stringContaining(newLog.id)
        );
      });

      it('should update existing log', async () => {
        const existingLog = createMockMedicationLog({ id: 'test-id' });
        const updatedLog = { ...existingLog, status: 'skipped' as const };
        
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([existingLog]));
        mockAsyncStorage.setItem.mockResolvedValue();
        
        await Database.saveMedicationLog(updatedLog);
        
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@medication_logs',
          expect.stringContaining('skipped')
        );
      });
    });

    describe('deleteMedicationLog', () => {
      it('should delete specific log', async () => {
        const log1 = createMockMedicationLog({ id: 'log-1' });
        const log2 = createMockMedicationLog({ id: 'log-2' });
        
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([log1, log2]));
        mockAsyncStorage.setItem.mockResolvedValue();
        
        await Database.deleteMedicationLog('log-1');
        
        const savedData = JSON.parse(
          (mockAsyncStorage.setItem as jest.Mock).mock.calls[0][1]
        );
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe('log-2');
      });
    });
  });

  describe('Settings', () => {
    describe('getSettings', () => {
      it('should return default settings when none exist', async () => {
        mockAsyncStorage.getItem.mockResolvedValue(null);
        
        const settings = await Database.getSettings();
        
        expect(settings).toEqual(expect.objectContaining({
          notificationsEnabled: true,
          soundEnabled: true,
          vibrationEnabled: true,
        }));
      });

      it('should merge saved settings with defaults', async () => {
        const savedSettings = { notificationsEnabled: false };
        mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedSettings));
        
        const settings = await Database.getSettings();
        
        expect(settings.notificationsEnabled).toBe(false);
        expect(settings.soundEnabled).toBe(true); // From defaults
      });

      it('should handle errors gracefully', async () => {
        mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
        
        const settings = await Database.getSettings();
        
        expect(settings).toEqual(expect.objectContaining({
          notificationsEnabled: true,
        }));
      });
    });

    describe('saveSettings', () => {
      it('should save settings', async () => {
        const settings = createMockAppSettings({ notificationsEnabled: false });
        mockAsyncStorage.setItem.mockResolvedValue();
        
        await Database.saveSettings(settings);
        
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          '@settings',
          JSON.stringify(settings)
        );
      });

      it('should handle errors', async () => {
        const settings = createMockAppSettings();
        mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));
        
        await expect(Database.saveSettings(settings)).rejects.toThrow('Storage error');
      });
    });
  });

  describe('Utility Functions', () => {
    describe('generateId', () => {
      it('should generate unique IDs', () => {
        const id1 = Database.generateId();
        const id2 = Database.generateId();
        
        expect(id1).not.toBe(id2);
        expect(typeof id1).toBe('string');
        expect(id1.length).toBeGreaterThan(0);
      });
    });

    describe('clearAllData', () => {
      it('should clear all storage keys', async () => {
        mockAsyncStorage.multiRemove.mockResolvedValue();
        
        await Database.clearAllData();
        
        expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
          '@medications',
          '@medication_logs',
          '@settings',
          '@retry_notifications',
        ]);
      });

      it('should handle errors', async () => {
        mockAsyncStorage.multiRemove.mockRejectedValue(new Error('Storage error'));
        
        await expect(Database.clearAllData()).rejects.toThrow('Storage error');
      });
    });
  });
}); 