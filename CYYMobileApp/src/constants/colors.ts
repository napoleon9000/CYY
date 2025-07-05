// Unified Color System for CYY Mobile App
// Modern gradient-based color scheme

export const GRADIENTS = {
  // Home Screen - Deep Purple to Blue Gradient (Professional & Calming)
  HOME: ['#667eea', '#764ba2'],
  
  // Add Screen - Purple to Light Purple (Creative & Inviting)
  ADD: ['#6C5CE7', '#A29BFE'],
  
  // History Screen - Teal to Green Gradient (Growth & Progress)
  HISTORY: ['#11998e', '#38ef7d'], 
  
  // Settings Screen - Pink to Coral Gradient (Vibrant & Energetic)
  SETTINGS: ['#f093fb', '#f5576c'],
  
  // Enhanced Multi-Stop Gradients for special effects
  HOME_FANCY: ['#667eea', '#764ba2', '#f093fb'],
  ADD_FANCY: ['#6C5CE7', '#A29BFE', '#DDD6FE'],
  HISTORY_FANCY: ['#11998e', '#38ef7d', '#A7F3D0'],
  SETTINGS_FANCY: ['#f093fb', '#f5576c', '#FBBF24'],
};

export const TAB_COLORS = {
  // Tab bar icon colors matching each screen's gradient
  HOME: '#667eea',
  ADD: '#6C5CE7', 
  HISTORY: '#11998e',
  SETTINGS: '#f093fb',
  
  // Common tab colors
  ACTIVE: '#6C5CE7',
  INACTIVE: '#8E8E93',
} as const;

export const COMMON_COLORS = {
  // Background and UI colors
  BACKGROUND: '#F8F9FA',
  WHITE: '#FFFFFF',
  
  // Status colors
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800', 
  ERROR: '#F44336',
  
  // Text colors
  PRIMARY_TEXT: '#333333',
  SECONDARY_TEXT: '#666666',
  LIGHT_TEXT: '#999999',
  
  // Border and shadow
  BORDER: '#E0E0E0',
  SHADOW: '#000000',
} as const;

// Gradient presets for common UI elements
export const UI_GRADIENTS = {
  BUTTON_PRIMARY: ['#6C5CE7', '#A29BFE'],
  BUTTON_SUCCESS: ['#4CAF50', '#8BC34A'],
  BUTTON_WARNING: ['#FF9800', '#FF5722'],
  BUTTON_DANGER: ['#F44336', '#E91E63'],
} as const;