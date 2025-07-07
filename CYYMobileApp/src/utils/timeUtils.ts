/**
 * Time formatting utilities for the CYY Mobile App
 * Consolidates time-related functions used across multiple screens
 */

/**
 * Converts 24-hour time string to 12-hour format with AM/PM
 * @param time Time string in HH:MM format
 * @returns Formatted time string like "2:30 PM"
 */
export const formatTime = (time: string): string => {
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour, 10);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum % 12 || 12;
  return `${displayHour}:${minute} ${ampm}`;
};

/**
 * Converts 24-hour time string to 12-hour format with AM/PM (alternative format)
 * @param timeString Time string in HH:MM format
 * @returns Formatted time string like "2:30 PM"
 */
export const formatTimeString = (timeString: string): string => {
  return formatTime(timeString);
};

/**
 * Converts Date object to formatted time string
 * @param date Date object
 * @returns Formatted time string like "2:30 PM"
 */
export const formatTimeFromDate = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * Gets current time in HH:MM format
 * @returns Current time as string in 24-hour format
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Checks if a time string is valid (HH:MM format)
 * @param time Time string to validate
 * @returns True if valid, false otherwise
 */
export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
};

/**
 * Compares two time strings
 * @param time1 First time string (HH:MM)
 * @param time2 Second time string (HH:MM)
 * @returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
export const compareTimeStrings = (time1: string, time2: string): number => {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  return totalMinutes1 - totalMinutes2;
};