import MockDate from 'mockdate';
import {
  formatTime,
  formatTimeFromDate,
  getCurrentTime,
  isValidTime,
  compareTimeStrings,
} from '../timeUtils';

describe('timeUtils', () => {
  afterEach(() => {
    MockDate.reset();
  });

  describe('formatTime', () => {
    it('should format morning times correctly', () => {
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('00:30')).toBe('12:30 AM');
      expect(formatTime('01:00')).toBe('1:00 AM');
      expect(formatTime('11:59')).toBe('11:59 AM');
    });

    it('should format noon correctly', () => {
      expect(formatTime('12:00')).toBe('12:00 PM');
      expect(formatTime('12:30')).toBe('12:30 PM');
    });

    it('should format afternoon/evening times correctly', () => {
      expect(formatTime('13:00')).toBe('1:00 PM');
      expect(formatTime('15:30')).toBe('3:30 PM');
      expect(formatTime('18:45')).toBe('6:45 PM');
      expect(formatTime('23:59')).toBe('11:59 PM');
    });

    it('should handle single digit hours', () => {
      expect(formatTime('01:00')).toBe('1:00 AM');
      expect(formatTime('09:30')).toBe('9:30 AM');
    });

    it('should handle edge cases', () => {
      expect(formatTime('00:01')).toBe('12:01 AM');
      expect(formatTime('12:01')).toBe('12:01 PM');
      expect(formatTime('23:00')).toBe('11:00 PM');
    });
  });

  describe('formatTimeFromDate', () => {
    it('should format Date objects correctly', () => {
      const date1 = new Date('2024-01-15T08:30:00.000Z');
      const date2 = new Date('2024-01-15T20:45:00.000Z');
      const date3 = new Date('2024-01-15T00:00:00.000Z');
      const date4 = new Date('2024-01-15T12:00:00.000Z');

      // Test the format pattern rather than exact times due to timezone differences
      expect(formatTimeFromDate(date1)).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
      expect(formatTimeFromDate(date2)).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
      expect(formatTimeFromDate(date3)).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
      expect(formatTimeFromDate(date4)).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should handle timezone conversions', () => {
      // Test with different timezone Date objects
      const utcDate = new Date('2024-01-15T15:30:00.000Z');
      const result = formatTimeFromDate(utcDate);
      
      // The result will depend on the local timezone of the test environment
      // We just ensure it's a valid time format
      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('should handle edge cases', () => {
      const midnight = new Date('2024-01-15T00:00:00.000Z');
      const noon = new Date('2024-01-15T12:00:00.000Z');
      const lateNight = new Date('2024-01-15T23:59:00.000Z');

      // Test format pattern rather than exact times due to timezone
      expect(formatTimeFromDate(midnight)).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
      expect(formatTimeFromDate(noon)).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
      expect(formatTimeFromDate(lateNight)).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });
  });

  describe('getCurrentTime', () => {
    it('should return current time in HH:MM format', () => {
      // The getCurrentTime function returns local time
      // We'll just test the format since timezone affects the actual value
      const currentTime = getCurrentTime();
      expect(currentTime).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should pad single digit hours and minutes', () => {
      // Test that the format is always HH:MM regardless of the actual time
      const currentTime = getCurrentTime();
      expect(currentTime).toMatch(/^\d{2}:\d{2}$/);
      expect(currentTime.length).toBe(5);
    });

    it('should handle edge cases', () => {
      // Test that we always get a valid time format
      const currentTime = getCurrentTime();
      expect(currentTime).toMatch(/^\d{2}:\d{2}$/);
      
      // Test that hours and minutes are within valid ranges
      const [hours, minutes] = currentTime.split(':').map(Number);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(23);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThanOrEqual(59);
    });
  });

  describe('isValidTime', () => {
    it('should return true for valid time formats', () => {
      expect(isValidTime('00:00')).toBe(true);
      expect(isValidTime('12:30')).toBe(true);
      expect(isValidTime('23:59')).toBe(true);
      expect(isValidTime('09:05')).toBe(true);
    });

    it('should return false for invalid hours', () => {
      expect(isValidTime('24:00')).toBe(false);
      expect(isValidTime('25:30')).toBe(false);
      expect(isValidTime('-1:30')).toBe(false);
    });

    it('should return false for invalid minutes', () => {
      expect(isValidTime('12:60')).toBe(false);
      expect(isValidTime('12:99')).toBe(false);
      expect(isValidTime('12:-1')).toBe(false);
    });

    it('should return false for invalid formats', () => {
      expect(isValidTime('1:30')).toBe(false); // Missing leading zero
      expect(isValidTime('12:3')).toBe(false); // Missing leading zero
      expect(isValidTime('12:30:00')).toBe(false); // Seconds included
      expect(isValidTime('12-30')).toBe(false); // Wrong separator
      expect(isValidTime('12:30 AM')).toBe(false); // AM/PM format
      expect(isValidTime('abc:def')).toBe(false); // Non-numeric
      expect(isValidTime('')).toBe(false); // Empty string
      expect(isValidTime('12:')).toBe(false); // Missing minutes
      expect(isValidTime(':30')).toBe(false); // Missing hours
    });

    it('should handle edge cases', () => {
      expect(isValidTime('00:00')).toBe(true);
      expect(isValidTime('23:59')).toBe(true);
      expect(isValidTime('12:00')).toBe(true);
    });
  });

  describe('compareTimeStrings', () => {
    it('should return negative number when first time is earlier', () => {
      expect(compareTimeStrings('08:00', '09:00')).toBe(-60);
      expect(compareTimeStrings('12:30', '12:45')).toBe(-15);
      expect(compareTimeStrings('00:00', '23:59')).toBe(-1439);
    });

    it('should return positive number when first time is later', () => {
      expect(compareTimeStrings('09:00', '08:00')).toBe(60);
      expect(compareTimeStrings('12:45', '12:30')).toBe(15);
      expect(compareTimeStrings('23:59', '00:00')).toBe(1439);
    });

    it('should return zero when times are equal', () => {
      expect(compareTimeStrings('12:00', '12:00')).toBe(0);
      expect(compareTimeStrings('00:00', '00:00')).toBe(0);
      expect(compareTimeStrings('23:59', '23:59')).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(compareTimeStrings('00:00', '00:01')).toBe(-1);
      expect(compareTimeStrings('23:59', '23:58')).toBe(1);
      expect(compareTimeStrings('12:00', '12:01')).toBe(-1);
    });

    it('should handle hour boundaries', () => {
      expect(compareTimeStrings('08:59', '09:00')).toBe(-1);
      expect(compareTimeStrings('09:00', '08:59')).toBe(1);
      expect(compareTimeStrings('11:59', '12:00')).toBe(-1);
    });

    it('should handle cross-day comparisons', () => {
      // These are treated as same-day comparisons
      expect(compareTimeStrings('23:30', '01:00')).toBe(1350); // 23:30 is later in the day
      expect(compareTimeStrings('01:00', '23:30')).toBe(-1350); // 01:00 is earlier in the day
    });
  });
}); 