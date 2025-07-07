/**
 * App-wide constants for the CYY Mobile App
 * Consolidates repeated values and configurations
 */

/**
 * Default app settings
 */
export const DEFAULT_APP_SETTINGS = {
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  reminderSnoozeMinutes: 5,
  darkMode: false,
  reminderPersistence: true,
} as const;

/**
 * Notification types available in the app
 */
export const NOTIFICATION_TYPES = ['notification', 'sound', 'vibration'] as const;

/**
 * Medication status types
 */
export const MEDICATION_STATUS = ['taken', 'skipped', 'pending'] as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATIONS = {
  QUICK: 200,
  NORMAL: 300,
  SLOW: 500,
} as const;

/**
 * Swipe gesture thresholds
 */
export const SWIPE_THRESHOLDS = {
  DELETE: -100,
  ACTIVATE: 50,
} as const;

/**
 * UI spacing constants
 */
export const SPACING = {
  SMALL: 8,
  MEDIUM: 16,
  LARGE: 24,
  EXTRA_LARGE: 32,
} as const;

/**
 * Border radius constants
 */
export const BORDER_RADIUS = {
  SMALL: 8,
  MEDIUM: 12,
  LARGE: 20,
} as const;

/**
 * Font sizes
 */
export const FONT_SIZES = {
  SMALL: 12,
  MEDIUM: 14,
  LARGE: 16,
  EXTRA_LARGE: 18,
  HEADER: 24,
  TITLE: 28,
  HERO: 32,
} as const;

/**
 * Shadow configurations
 */
export const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

/**
 * Common color values
 */
export const COMMON_COLORS = {
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_LIGHT: '#F8F9FA',
  GRAY_MEDIUM: '#E0E0E0',
  GRAY_DARK: '#666666',
  SUCCESS: '#4CAF50',
  ERROR: '#FF6B6B',
  WARNING: '#FF9800',
  INFO: '#2196F3',
} as const;

/**
 * App version and metadata
 */
export const APP_INFO = {
  VERSION: '1.0.0',
  NAME: 'CYY',
  DESCRIPTION: 'Made with ❤️ for your health',
} as const;

/**
 * Performance constants
 */
export const PERFORMANCE = {
  SCROLL_THROTTLE: 16,
  ANIMATION_FRAME_RATE: 60,
  LIST_ITEM_HEIGHT: 80,
} as const;

/**
 * Screen layout constants
 */
export const LAYOUT = {
  HEADER_HEIGHT: 140,
  TAB_BAR_HEIGHT: 80,
  BOTTOM_PADDING: 250,
} as const;