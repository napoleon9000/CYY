// Note: Flipper logging is mainly done through console.log in React Native
// The react-native-flipper package is for custom Flipper plugins

// Flipper logging utility for debugging
export const flipperLog = {
  info: (message: string, data?: any) => {
    if (__DEV__) {
      console.log(`[Flipper INFO] ${message}`, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (__DEV__) {
      console.warn(`[Flipper WARN] ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (__DEV__) {
      console.error(`[Flipper ERROR] ${message}`, error);
    }
  },
  
  debug: (message: string, data?: any) => {
    if (__DEV__) {
      console.debug(`[Flipper DEBUG] ${message}`, data);
    }
  },

  // Database operations logging
  database: (operation: string, table: string, data?: any) => {
    if (__DEV__) {
      const message = `DB: ${operation} on ${table}`;
      console.log(`[Flipper DB] ${message}`, data);
    }
  },

  // Navigation logging
  navigation: (action: string, route?: string, params?: any) => {
    if (__DEV__) {
      const message = `NAV: ${action}${route ? ` to ${route}` : ''}`;
      console.log(`[Flipper NAV] ${message}`, params);
    }
  },

  // Notification logging
  notification: (action: string, data?: any) => {
    if (__DEV__) {
      const message = `NOTIF: ${action}`;
      console.log(`[Flipper NOTIF] ${message}`, data);
    }
  }
};

// Performance tracking
export const flipperPerformance = {
  start: (operation: string) => {
    if (__DEV__) {
      const startTime = Date.now();
      return {
        end: () => {
          const duration = Date.now() - startTime;
          flipperLog.info(`Performance: ${operation}`, { duration: `${duration}ms` });
        }
      };
    }
    return { end: () => {} };
  }
};

export default flipperLog;