/**
 * Date utilities for the CYY Mobile App
 * Consolidates date-related functions used across multiple screens
 */

/**
 * Day abbreviations for the week
 */
export const DAY_ABBREVIATIONS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/**
 * Full day names for the week
 */
export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

/**
 * Gets day abbreviation for a given day number
 * @param dayNumber Day number (0-6, where 0 is Sunday)
 * @returns Single letter day abbreviation
 */
export const getDayAbbreviation = (dayNumber: number): string => {
  if (dayNumber < 0 || dayNumber > 6) {
    throw new Error('Day number must be between 0 and 6');
  }
  return DAY_ABBREVIATIONS[dayNumber];
};

/**
 * Gets full day name for a given day number
 * @param dayNumber Day number (0-6, where 0 is Sunday)
 * @returns Full day name
 */
export const getDayName = (dayNumber: number): string => {
  if (dayNumber < 0 || dayNumber > 6) {
    throw new Error('Day number must be between 0 and 6');
  }
  return DAY_NAMES[dayNumber];
};

/**
 * Gets the current day number (0-6, where 0 is Sunday)
 * @returns Current day number
 */
export const getCurrentDayNumber = (): number => {
  return new Date().getDay();
};

/**
 * Checks if a date is today
 * @param date Date to check
 * @returns True if the date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Checks if a date is yesterday
 * @param date Date to check
 * @returns True if the date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

/**
 * Formats a date for display in the app
 * @param date Date to format
 * @returns Formatted date string (e.g., "Today", "Yesterday", "Mar 15")
 */
export const formatDateForDisplay = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Gets the start of day for a given date
 * @param date Date to get start of day for
 * @returns New Date object set to start of day
 */
export const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Gets the end of day for a given date
 * @param date Date to get end of day for
 * @returns New Date object set to end of day
 */
export const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Calculates the difference in days between two dates
 * @param date1 First date
 * @param date2 Second date
 * @returns Number of days between the dates
 */
export const getDaysDifference = (date1: Date, date2: Date): number => {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

/**
 * Adds days to a date
 * @param date Base date
 * @param days Number of days to add
 * @returns New Date object with days added
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Checks if a given day number is in an array of selected days
 * @param dayNumber Day number to check
 * @param selectedDays Array of selected day numbers
 * @returns True if the day is selected
 */
export const isDaySelected = (dayNumber: number, selectedDays: number[]): boolean => {
  return selectedDays.includes(dayNumber);
};