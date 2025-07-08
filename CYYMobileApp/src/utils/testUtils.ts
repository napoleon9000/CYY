import { render, RenderOptions } from '@testing-library/react-native';
import React, { ReactElement } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Medication, MedicationLog, AppSettings } from '../types/medication';
import { DEFAULT_APP_SETTINGS } from './constants';

// Mock navigation wrapper
const MockNavigationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(NavigationContainer, null, children);
};

// Custom render function with navigation wrapper
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> => {
  return render(ui, {
    wrapper: MockNavigationWrapper,
    ...options,
  });
};

// Test data factories
export const createMockMedication = (overrides: Partial<Medication> = {}): Medication => ({
  id: 'test-medication-1',
  name: 'Test Medication',
  dosage: '10mg',
  reminderTime: '08:00',
  reminderDays: [1, 2, 3, 4, 5], // Monday to Friday
  notificationTypes: ['notification'],
  isActive: true,
  color: '#6C5CE7',
  icon: 'local-pharmacy',
  retryCount: 3,
  notes: 'Test medication notes',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

export const createMockMedicationLog = (overrides: Partial<MedicationLog> = {}): MedicationLog => ({
  id: 'test-log-1',
  medicationId: 'test-medication-1',
  scheduledTime: new Date('2024-01-15T08:00:00Z'),
  actualTime: new Date('2024-01-15T08:05:00Z'),
  status: 'taken',
  notes: 'Test log notes',
  createdAt: new Date('2024-01-15T08:05:00Z'),
  ...overrides,
});

export const createMockAppSettings = (overrides: Partial<AppSettings> = {}): AppSettings => ({
  ...DEFAULT_APP_SETTINGS,
  ...overrides,
});

// Common test medications
export const mockMedications: Medication[] = [
  createMockMedication({
    id: 'med-1',
    name: 'Aspirin',
    dosage: '81mg',
    reminderTime: '08:00',
    reminderDays: [1, 2, 3, 4, 5, 6, 7],
    color: '#FF6B6B',
  }),
  createMockMedication({
    id: 'med-2',
    name: 'Vitamin D',
    dosage: '1000 IU',
    reminderTime: '20:00',
    reminderDays: [1, 3, 5],
    color: '#4ECDC4',
    isActive: false,
  }),
  createMockMedication({
    id: 'med-3',
    name: 'Metformin',
    dosage: '500mg',
    reminderTime: '12:00',
    reminderDays: [1, 2, 3, 4, 5],
    color: '#45B7D1',
    retryCount: 5,
  }),
];

// Common test logs
export const mockLogs: MedicationLog[] = [
  createMockMedicationLog({
    id: 'log-1',
    medicationId: 'med-1',
    status: 'taken',
    scheduledTime: new Date('2024-01-15T08:00:00Z'),
    actualTime: new Date('2024-01-15T08:05:00Z'),
  }),
  createMockMedicationLog({
    id: 'log-2',
    medicationId: 'med-1',
    status: 'skipped',
    scheduledTime: new Date('2024-01-14T08:00:00Z'),
    actualTime: undefined,
  }),
  createMockMedicationLog({
    id: 'log-3',
    medicationId: 'med-2',
    status: 'taken',
    scheduledTime: new Date('2024-01-13T20:00:00Z'),
    actualTime: new Date('2024-01-13T20:10:00Z'),
    photoUri: 'file://test-photo.jpg',
  }),
];

// Mock navigation functions
export const mockNavigate = jest.fn();
export const mockGoBack = jest.fn();
export const mockSetOptions = jest.fn();

// Mock navigation hook
export const mockUseNavigation = () => ({
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: mockSetOptions,
});

// Mock route hook
export const mockUseRoute = (params: any = {}) => ({
  params,
  name: 'TestScreen',
  key: 'TestScreen-key',
});

// Database mock helpers
export const mockDatabase = {
  getMedications: jest.fn(() => Promise.resolve(mockMedications)),
  getMedicationById: jest.fn((id: string) => 
    Promise.resolve(mockMedications.find(m => m.id === id))
  ),
  saveMedication: jest.fn(() => Promise.resolve()),
  deleteMedication: jest.fn(() => Promise.resolve()),
  getMedicationLogs: jest.fn(() => Promise.resolve(mockLogs)),
  getLogsByMedicationId: jest.fn((medicationId: string) => 
    Promise.resolve(mockLogs.filter(log => log.medicationId === medicationId))
  ),
  saveMedicationLog: jest.fn(() => Promise.resolve()),
  deleteMedicationLog: jest.fn(() => Promise.resolve()),
  getSettings: jest.fn(() => Promise.resolve(createMockAppSettings())),
  saveSettings: jest.fn(() => Promise.resolve()),
  clearAllData: jest.fn(() => Promise.resolve()),
  generateId: jest.fn(() => 'generated-id'),
};

// Notification mock helpers
export const mockNotifications = {
  scheduleWeeklyReminders: jest.fn(() => Promise.resolve()),
  cancelNotification: jest.fn(() => Promise.resolve()),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  requestNotificationPermission: jest.fn(() => Promise.resolve(true)),
  checkNotificationPermission: jest.fn(() => Promise.resolve(true)),
  sendTestNotification: jest.fn(() => Promise.resolve()),
};

// Image picker mock helpers
export const mockImagePicker = {
  launchCamera: jest.fn((options, callback) => {
    callback({
      didCancel: false,
      assets: [{
        uri: 'file://test-image.jpg',
        type: 'image/jpeg',
        fileName: 'test-image.jpg',
      }],
    });
  }),
  launchImageLibrary: jest.fn((options, callback) => {
    callback({
      didCancel: false,
      assets: [{
        uri: 'file://test-image.jpg',
        type: 'image/jpeg',
        fileName: 'test-image.jpg',
      }],
    });
  }),
};

// Permission mock helpers
export const mockPermissions = {
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
};

// Test utilities
export const waitFor = (callback: () => void, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkCondition = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(checkCondition, 100);
        }
      }
    };
    checkCondition();
  });
};

// Sleep utility
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Reset all mocks
export const resetAllMocks = () => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
  mockGoBack.mockClear();
  mockSetOptions.mockClear();
  Object.values(mockDatabase).forEach(fn => fn.mockClear());
  Object.values(mockNotifications).forEach(fn => fn.mockClear());
  Object.values(mockImagePicker).forEach(fn => fn.mockClear());
  Object.values(mockPermissions).forEach(fn => fn.mockClear());
};

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Re-export everything from testing-library
export * from '@testing-library/react-native';
export { customRender as render }; 