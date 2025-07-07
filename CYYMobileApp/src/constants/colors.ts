// Unified Color System for CYY Mobile App
// Modern gradient-based color scheme

export const GRADIENTS = {
  // Home Screen - Deep Purple to Blue Gradient (Professional & Calming)
  HOME: ['#667eea', '#764ba2'],
  
  // Add Screen - Purple to Light Purple (Creative & Inviting)
  ADD: ['#6C5CE7', '#A29BFE'],
  
  // Track Screen - Purple to Violet Gradient (Unified with Home/Add)
  TRACK: ['#764ba2', '#667eea'], 
  
  // Settings Screen - Muted Yellow to Gold Gradient (Warm & Subtle)
  SETTINGS: ['#f6d55c', '#ed9121'],
  
  // Details Screen - Purple to Dark Purple Gradient (Focused & Detailed)
  DETAILS: ['#764ba2', '#667eea'],
  
  // Enhanced Multi-Stop Gradients for special effects
  HOME_FANCY: ['#667eea', '#764ba2', '#f093fb'],
  ADD_FANCY: ['#6C5CE7', '#A29BFE', '#DDD6FE'],
  TRACK_FANCY: ['#764ba2', '#667eea', '#A29BFE'],
  SETTINGS_FANCY: ['#f6d55c', '#ed9121', '#ffd60a'],
};

export const TAB_COLORS = {
  // Tab bar icon colors matching each screen's gradient
  HOME: '#667eea',
  ADD: '#6C5CE7', 
  TRACK: '#764ba2',
  SETTINGS: '#f6d55c',
  
  // Common tab colors
  ACTIVE: '#f6d55c',
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
  BUTTON_PRIMARY: ['#f6d55c', '#ed9121'],
  BUTTON_SUCCESS: ['#4CAF50', '#8BC34A'],
  BUTTON_WARNING: ['#FF9800', '#FF5722'],
  BUTTON_DANGER: ['#F44336', '#E91E63'],
} as const;