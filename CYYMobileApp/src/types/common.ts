/**
 * Common types used across the CYY Mobile App
 */

/**
 * App settings interface
 */
export interface AppSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderSnoozeMinutes: number;
  darkMode: boolean;
  reminderPersistence: boolean;
}

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

/**
 * Generic API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Form validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Common UI component props
 */
export interface BaseComponentProps {
  testID?: string;
  style?: any;
  children?: React.ReactNode;
}

/**
 * Color scheme interface
 */
export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
  duration: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

/**
 * Swipe gesture configuration
 */
export interface SwipeConfig {
  threshold: number;
  velocityThreshold?: number;
  direction: 'left' | 'right' | 'up' | 'down';
}

/**
 * Debug information interface
 */
export interface DebugInfo {
  appVersion: string;
  reactNativeVersion: string;
  platform: string;
  osVersion: string;
  deviceModel?: string;
  isDebugMode: boolean;
  totalMedications: number;
  totalLogs: number;
  lastSync?: Date;
}