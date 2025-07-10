import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform, PermissionsAndroid } from 'react-native';
import { Medication, MedicationLog, RetryNotification } from '../types';
import { Database } from './database';
import { flipperLog } from './flipper';
import { notificationStateManager } from './notificationState';

// Configure notifications
PushNotification.configure({
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },

  onNotification: function (notification) {
    console.log('🔔 NOTIFICATION RECEIVED:', notification);
    flipperLog.notification('NOTIFICATION_RECEIVED', {
      title: (notification as any).title,
      message: (notification as any).message,
      action: (notification as any).action,
      actionIdentifier: (notification as any).actionIdentifier,
      userInfo: (notification as any).userInfo,
      data: (notification as any).data,
      foreground: (notification as any).foreground,
      userInteraction: (notification as any).userInteraction
    });
    
    // Check for action identifier (iOS action buttons)
    const actionIdentifier = (notification as any).getActionIdentifier?.();
    if (actionIdentifier) {
      console.log('🎯 ACTION BUTTON CLICKED:', actionIdentifier);
      flipperLog.notification('ACTION_BUTTON_CLICKED', { actionIdentifier });
      
      // Create action notification object
      const actionNotification = {
        action: actionIdentifier,
        actionIdentifier: actionIdentifier,
        userInfo: (notification as any).getData?.() || (notification as any).userInfo,
        data: (notification as any).getData?.() || (notification as any).data,
        title: (notification as any).getAlert?.(),
        message: (notification as any).getAlert?.(),
        finish: (notification as any).finish?.bind(notification)
      };
      
      // Handle the action
      handleNotificationAction(actionNotification);
    }
    
    // Required for iOS to properly handle notification actions
    if (notification.finish) {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    }
  },

  onAction: function (notification) {
    console.log('🎯 ACTION RECEIVED (FALLBACK):', (notification as any).action);
    console.log('FULL ACTION NOTIFICATION:', notification);
    flipperLog.notification('ACTION_RECEIVED_FALLBACK', {
      action: (notification as any).action,
      actionIdentifier: (notification as any).actionIdentifier,
      userInfo: (notification as any).userInfo,
      data: (notification as any).data,
      fullNotification: notification
    });
    
    // Handle the action
    handleNotificationAction(notification);
    
    // Required for iOS to properly dismiss the notification
    if (notification.finish) {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    }
  },

  onRegistrationError: function(err) {
    console.error(err.message, err);
  },

  permissions: {
    alert: true,
    badge: true,
    sound: true,
    critical: true, // Enable critical notifications
  },

  popInitialNotification: true,
  requestPermissions: Platform.OS === 'ios',
});

// Store the iOS listener for cleanup
let iOSNotificationListener: any = null;

// iOS-specific action handling using PushNotificationIOS directly
if (Platform.OS === 'ios') {
  try {
    // Configure notification categories with actions
    PushNotificationIOS.setNotificationCategories([
      {
        id: 'MEDICATION_ACTIONS',
        actions: [
          {
            id: 'TAKEN',
            title: 'Taken',
            options: {
              foreground: false,
              authenticationRequired: false,
              destructive: false,
            },
          },
          {
            id: 'SKIP',
            title: 'Skip',
            options: {
              foreground: false,
              authenticationRequired: false,
              destructive: true,
            },
          },
          {
            id: 'TAKEN_PHOTO',
            title: 'Taken + Photo',
            options: {
              foreground: true,
              authenticationRequired: false,
              destructive: false,
            },
          },
        ],
      },
    ]);
    console.log('✅ iOS notification categories configured successfully');

    // Add dedicated listener for iOS notifications
    const iOSNotificationHandler = (notification: any) => {
      console.log('🍎 iOS NOTIFICATION HANDLER:', notification);
      flipperLog.notification('iOS_NOTIFICATION_HANDLER', {
        actionIdentifier: notification.getActionIdentifier?.(),
        alert: notification.getAlert?.(),
        data: notification.getData?.(),
        category: notification.getCategory?.()
      });

      const actionIdentifier = notification.getActionIdentifier?.();
      if (actionIdentifier) {
        console.log('🎯 iOS ACTION IDENTIFIED:', actionIdentifier);
        flipperLog.notification('iOS_ACTION_IDENTIFIED', { actionIdentifier });
        
        // Create a notification object compatible with our handler
        const actionNotification = {
          action: actionIdentifier,
          actionIdentifier: actionIdentifier,
          userInfo: notification.getData?.(),
          data: notification.getData?.(),
          title: notification.getAlert?.(),
          message: notification.getAlert?.(),
          finish: notification.finish?.bind(notification)
        };
        
        // Handle the action using our existing handler
        handleNotificationAction(actionNotification);
      }

      // Always call finish for iOS
      const result = PushNotificationIOS.FetchResult.NoData;
      notification.finish(result);
    };

    // Add iOS-specific event listeners
    PushNotificationIOS.addEventListener('notification', iOSNotificationHandler);
    PushNotificationIOS.addEventListener('localNotification', iOSNotificationHandler);

    console.log('✅ iOS notification listeners configured');
  } catch (error) {
    console.error('❌ Error setting up iOS notifications:', error);
  }
} else {
  // Android notification channel configuration
  PushNotification.createChannel(
    {
      channelId: 'medication-reminders',
      channelName: 'Medication Reminders',
      channelDescription: 'Reminders to take your medications',
      playSound: true,
      soundName: 'default',
      importance: 4,
      vibrate: true,
    },
    (created) => console.log(`Android channel created: ${created}`)
  );

  // Create critical notification channel for Android
  PushNotification.createChannel(
    {
      channelId: 'critical-medication-reminders',
      channelName: 'Critical Medication Reminders',
      channelDescription: 'Critical medication reminders that bypass Do Not Disturb',
      playSound: true,
      soundName: 'default',
      importance: 5, // MAX importance for critical notifications
      vibrate: true,
      bypassDnd: true, // Bypass Do Not Disturb
    },
    (created) => console.log(`Android critical channel created: ${created}`)
  );
}

// Handle notification actions
const handleNotificationAction = async (notification: any) => {
  console.log('🔧 HANDLING NOTIFICATION ACTION - START');
  flipperLog.notification('RAW_NOTIFICATION_ACTION', notification);
  
  // Extract action from different possible locations
  const action = notification.action || notification.actionIdentifier || notification.identifier;
  const userInfo = notification.userInfo || notification.data || {};
  const medicationId = userInfo?.medicationId;
  
  console.log('🔧 EXTRACTED ACTION DATA:', {
    action,
    medicationId,
    userInfo,
    hasAction: !!action,
    hasMedicationId: !!medicationId
  });
  
  flipperLog.notification('PARSED_ACTION_DATA', { action, medicationId, userInfo });
  
  if (!medicationId) {
    console.log('❌ ERROR: No medication ID found');
    flipperLog.error('No medication ID in notification action', { action, userInfo, fullNotification: notification });
    showImmediateNotification('Error', 'Could not process notification action - missing medication ID');
    return;
  }

  if (!action) {
    console.log('❌ ERROR: No action found');
    flipperLog.error('No action in notification', { userInfo, fullNotification: notification });
    showImmediateNotification('Error', 'Could not process notification action - missing action');
    return;
  }

  console.log(`🔧 PROCESSING ACTION: ${action} for medication: ${medicationId}`);
  flipperLog.notification('HANDLING_ACTION', { action, medicationId });

  try {
    const medication = await Database.getMedicationById(medicationId);
    if (!medication) {
      console.log('❌ ERROR: Medication not found in database');
      flipperLog.error('Medication not found for action', { medicationId, action });
      showImmediateNotification('Error', 'Medication not found');
      return;
    }

    console.log(`✅ MEDICATION FOUND: ${medication.name}`);
    const now = new Date();
    const logId = Database.generateId();
    
    // Get original notification time from userInfo
    const originalTimeStr = userInfo?.originalTime;
    const originalTime = originalTimeStr ? new Date(originalTimeStr) : now;

    switch (action) {
      case 'TAKEN':
        console.log('🔧 PROCESSING TAKEN ACTION');
        await Database.saveMedicationLog({
          id: logId,
          medicationId,
          scheduledTime: originalTime,
          actualTime: now,
          status: 'taken',
          notes: 'Marked as taken from notification',
          createdAt: now,
        });
        
        // Cancel any pending retry notifications
        await handleMedicationTakenOrSkipped(medicationId, originalTime);
        
        flipperLog.notification('MARKED_TAKEN', { medicationId, logId });
        console.log('✅ TAKEN ACTION COMPLETED');
        showImmediateNotification('✅ Medication Taken', `${medication.name} has been marked as taken.`);
        break;


      case 'SKIP':
        console.log('🔧 PROCESSING SKIP ACTION');
        await Database.saveMedicationLog({
          id: logId,
          medicationId,
          scheduledTime: originalTime,
          actualTime: now,
          status: 'skipped',
          notes: 'Skipped from notification',
          createdAt: now,
        });
        
        // Cancel any pending retry notifications
        await handleMedicationTakenOrSkipped(medicationId, originalTime);
        
        flipperLog.notification('MARKED_SKIPPED', { medicationId, logId });
        console.log('✅ SKIP ACTION COMPLETED');
        showImmediateNotification('❌ Medication Skipped', `${medication.name} has been skipped.`);
        break;

      case 'TAKEN_PHOTO':
        console.log('🔧 PROCESSING TAKEN_PHOTO ACTION - REQUESTING CAMERA');
        
        // Request camera from the app instead of logging immediately
        notificationStateManager.requestCameraFromNotification(medication, originalTime);
        
        flipperLog.notification('CAMERA_REQUESTED_FROM_NOTIFICATION', { medicationId });
        console.log('✅ TAKEN_PHOTO ACTION COMPLETED - CAMERA REQUESTED');
        showImmediateNotification('📷 Camera Opening', `Opening camera for ${medication.name}. Please take a photo to confirm.`);
        break;

      default:
        console.log(`❌ ERROR: Unknown action: ${action}`);
        flipperLog.error('Unknown notification action', { action, availableActions: ['TAKEN', 'SKIP', 'TAKEN_PHOTO'] });
        showImmediateNotification('Error', `Unknown action: ${action}`);
        break;
    }
    
    console.log('🔧 HANDLING NOTIFICATION ACTION - COMPLETED');
  } catch (error) {
    console.log('❌ ERROR in handleNotificationAction:', error);
    flipperLog.error('Error handling notification action', error);
    console.error('Error handling notification action:', error);
    showImmediateNotification('Error', 'Failed to process notification action');
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  flipperLog.notification('CHECKING_PERMISSION', { platform: Platform.OS });
  
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      PushNotification.checkPermissions((permissions) => {
        flipperLog.notification('iOS_PERMISSION_CHECK', permissions);
        console.log('Current iOS permissions:', permissions);
        resolve(permissions.alert || false);
      });
    });
  } else {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      flipperLog.notification('ANDROID_PERMISSION_CHECK', { granted });
      console.log('Current Android permission:', granted);
      return granted;
    } catch (err) {
      flipperLog.error('Android permission check failed', err);
      console.warn('Error checking Android permissions:', err);
      return false;
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  flipperLog.notification('REQUESTING_PERMISSION', { platform: Platform.OS });
  
  // First check if we already have permission
  const hasPermission = await checkNotificationPermission();
  if (hasPermission) {
    flipperLog.notification('PERMISSION_ALREADY_GRANTED');
    console.log('Notification permission already granted');
    return true;
  }

  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      // Request permissions including critical notifications
      PushNotification.requestPermissions(['alert', 'badge', 'sound', 'critical']).then((permissions) => {
        flipperLog.notification('iOS_PERMISSION_REQUEST_RESULT', permissions);
        console.log('iOS permission request result:', permissions);
        resolve(permissions.alert || false);
      }).catch((error) => {
        flipperLog.error('iOS permission request failed', error);
        console.error('iOS permission request error:', error);
        resolve(false);
      });
    });
  } else {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'CYY needs notification permissions to remind you about your medications. Critical notifications will bypass Do Not Disturb mode.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      flipperLog.notification('ANDROID_PERMISSION_REQUEST_RESULT', { granted });
      console.log('Android permission request result:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      flipperLog.error('Android permission request failed', err);
      console.error('Android permission request error:', err);
      return false;
    }
  }
};

export const scheduleNotification = (medication: Medication, notificationTime: Date) => {
  const notificationId = `med_${medication.id}_${notificationTime.getTime()}`;
  
  const notificationConfig: any = {
    id: notificationId,
    title: `Time to take ${medication.name}!`,
    message: `Don't forget your ${medication.dosage} of ${medication.name}`,
    date: notificationTime,
    allowWhileIdle: true,
    repeatType: 'week', // Will repeat weekly
    userInfo: {
      medicationId: medication.id,
      notificationId,
    },
  };

  // iOS specific configuration
  if (Platform.OS === 'ios') {
    notificationConfig.category = 'MEDICATION_ACTIONS';
    // Critical notifications bypass DND and silent mode
    if (medication.criticalNotification) {
      notificationConfig.critical = true;
      notificationConfig.criticalSoundName = 'default';
      notificationConfig.interruptionLevel = 'critical'; // iOS 15+ critical notifications
    }
  } else {
    // Android specific configuration
    const channelId = medication.criticalNotification ? 'critical-medication-reminders' : 'medication-reminders';
    notificationConfig.channelId = channelId;
    notificationConfig.actions = ['TAKEN', 'SKIP', 'TAKEN_PHOTO'];
    // Critical notifications use high priority and override DND
    if (medication.criticalNotification) {
      notificationConfig.priority = 'high';
      notificationConfig.importance = 'high';
      notificationConfig.allowWhileIdle = true;
      notificationConfig.wakeLockTimeout = 10000; // 10 seconds wake lock
    }
  }

  PushNotification.localNotificationSchedule(notificationConfig);
};

export const cancelNotification = (notificationId: string) => {
  PushNotification.cancelLocalNotification(notificationId);
};

export const cancelAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
};

export const scheduleWeeklyReminders = async (medication: Medication) => {
  // Cancel existing notifications for this medication
  PushNotification.getScheduledLocalNotifications((notifications) => {
    notifications.forEach((notification) => {
      const userInfo = (notification as any).userInfo;
      if (userInfo?.medicationId === medication.id) {
        PushNotification.cancelLocalNotification((notification as any).id);
      }
    });
  });

  if (!medication.isActive) {
    return;
  }

  const [hours, minutes] = medication.reminderTime.split(':').map(Number);
  
  for (const dayOfWeek of medication.reminderDays) {
    const now = new Date();
    const notificationDate = new Date();
    
    // Set to the desired day of week
    const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
    notificationDate.setDate(now.getDate() + daysUntilTarget);
    notificationDate.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for next week
    if (notificationDate <= now) {
      notificationDate.setDate(notificationDate.getDate() + 7);
    }
    
    // Use the new function that includes retry logic
    await scheduleNotificationWithRetry(medication, notificationDate);
  }
};

export const playNotificationSound = () => {
  // Sound will be handled by the notification system
  console.log('Playing notification sound');
};

export const vibrateDevice = (pattern: number[] = [500]) => {
  // Vibration will be handled by the notification system
  console.log('Vibrating device');
};

export const showImmediateNotification = (title: string, message: string) => {
  const notificationConfig: any = {
    title,
    message,
    playSound: true,
    soundName: 'default',
    vibrate: true,
  };

  // Platform specific configuration
  if (Platform.OS === 'android') {
    notificationConfig.channelId = 'medication-reminders';
  }

  PushNotification.localNotification(notificationConfig);
};

// Export the action handler for use in the app
export const handleNotificationActionFromApp = handleNotificationAction;

// Test notification with actions
export const sendTestNotification = async (medication: Medication) => {
  return sendDelayedTestNotification(medication, 5);
};

// Send a test notification (delayed to work better with iOS)
export const sendDelayedTestNotification = async (medication: Medication, delaySeconds: number = 5) => {
  const notificationId = `test_${medication.id}_${Date.now()}`;
  
  try {
    // Check notification permissions first
    const hasPermission = await checkNotificationPermission();
    
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        throw new Error('Notification permission denied. Please enable notifications in Settings.');
      }
    }

    const scheduledTime = new Date(Date.now() + delaySeconds * 1000);
    
    const baseConfig = {
      id: notificationId,
      title: `💊 Test Reminder: ${medication.name}`,
      message: `${medication.dosage} • Long press for quick actions`,
      date: scheduledTime,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      userInfo: {
        medicationId: medication.id,
        notificationId,
        isTest: true,
      },
    };

    let notificationConfig: any;

    // Platform specific configuration
    if (Platform.OS === 'ios') {
      notificationConfig = {
        ...baseConfig,
        category: 'MEDICATION_ACTIONS',
      };
      
      // Add critical notification settings for iOS
      if (medication.criticalNotification) {
        notificationConfig.critical = true;
        notificationConfig.criticalSoundName = 'default';
        notificationConfig.interruptionLevel = 'critical';
      }
    } else {
      const channelId = medication.criticalNotification ? 'critical-medication-reminders' : 'medication-reminders';
      notificationConfig = {
        ...baseConfig,
        channelId: channelId,
        actions: ['TAKEN', 'SKIP', 'TAKEN_PHOTO'],
      };
      
      // Add critical notification settings for Android
      if (medication.criticalNotification) {
        notificationConfig.priority = 'max';
        notificationConfig.importance = 'max';
        notificationConfig.allowWhileIdle = true;
        notificationConfig.wakeLockTimeout = 10000;
      }
    }

    // Schedule notification
    PushNotification.localNotificationSchedule(notificationConfig);
    
    console.log('Test notification scheduled successfully');
    
  } catch (error) {
    console.error('Failed to send test notification:', error);
    throw error;
  }
};

// Test critical notification specifically
export const sendCriticalTestNotification = async (medication: Medication, delaySeconds: number = 5) => {
  const notificationId = `critical_test_${medication.id}_${Date.now()}`;
  
  try {
    // Check notification permissions first
    const hasPermission = await checkNotificationPermission();
    
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        throw new Error('Notification permission denied. Please enable notifications in Settings.');
      }
    }

    const scheduledTime = new Date(Date.now() + delaySeconds * 1000);
    
    const baseConfig = {
      id: notificationId,
      title: `🚨 CRITICAL: ${medication.name}`,
      message: `URGENT: Take your ${medication.dosage} now! (Critical notification test)`,
      date: scheduledTime,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      userInfo: {
        medicationId: medication.id,
        notificationId,
        isTest: true,
        isCritical: true,
      },
    };

    let notificationConfig: any;

    // Platform specific configuration for critical notifications
    if (Platform.OS === 'ios') {
      notificationConfig = {
        ...baseConfig,
        category: 'MEDICATION_ACTIONS',
        critical: true,
        criticalSoundName: 'default',
        interruptionLevel: 'critical',
      };
    } else {
      notificationConfig = {
        ...baseConfig,
        channelId: 'critical-medication-reminders',
        actions: ['TAKEN', 'SKIP', 'TAKEN_PHOTO'],
        priority: 'max',
        importance: 'max',
        allowWhileIdle: true,
        wakeLockTimeout: 10000,
      };
    }

    // Schedule notification
    PushNotification.localNotificationSchedule(notificationConfig);
    
    console.log('Critical test notification scheduled successfully');
    
    return {
      success: true,
      notificationId,
      scheduledTime: scheduledTime.toISOString(),
      platform: Platform.OS,
      isCritical: true
    };
    
  } catch (error) {
    console.error('Failed to send critical test notification:', error);
    throw error;
  }
};

// Check notification setup
export const checkNotificationCategories = () => {
  if (Platform.OS === 'ios') {
    console.log('iOS notification categories configured');
  } else {
    console.log('Android notification channel configured');
  }
};

// Check notification status
export const debugNotificationStatus = async () => {
  try {
    // Check permissions
    const hasPermission = await checkNotificationPermission();
    
    // Check scheduled notifications
    PushNotification.getScheduledLocalNotifications((notifications) => {
      console.log('Scheduled notifications:', notifications.length);
    });
    
    // Log configuration
    checkNotificationCategories();
    
    return {
      hasPermission,
      platform: Platform.OS,
      configuredCategories: Platform.OS === 'ios' ? 'MEDICATION_ACTIONS' : 'medication-reminders'
    };
  } catch (error) {
    console.error('Failed to check notification status:', error);
    throw error;
  }
};

// Check critical notification support
export const checkCriticalNotificationSupport = async () => {
  try {
    const hasPermission = await checkNotificationPermission();
    
    if (Platform.OS === 'ios') {
      // Check iOS critical notification support
      PushNotification.checkPermissions((permissions) => {
        console.log('iOS notification permissions:', permissions);
        console.log('Critical notifications supported:', permissions.critical || false);
      });
      
      return {
        platform: 'iOS',
        hasPermission,
        criticalSupported: true, // iOS 15+ supports critical notifications
        requiresEntitlement: true,
        note: 'Critical notifications require special entitlements and Apple approval'
      };
    } else {
      // Check Android critical notification support
      return {
        platform: 'Android',
        hasPermission,
        criticalSupported: true,
        requiresEntitlement: false,
        note: 'Critical notifications use high priority channels with bypassDnd'
      };
    }
  } catch (error) {
    console.error('Failed to check critical notification support:', error);
    throw error;
  }
};

// Retry notification management
export const scheduleRetryNotification = async (medication: Medication, originalNotificationTime: Date, retryCount: number = 0) => {
  if (retryCount >= medication.retryCount) {
    console.log(`Max retry count reached for medication ${medication.name}`);
    return;
  }

  const nextRetryTime = new Date(originalNotificationTime.getTime() + (retryCount + 1) * 10 * 60 * 1000); // 10 minutes interval
  const retryNotificationId = `retry_${medication.id}_${originalNotificationTime.getTime()}_${retryCount + 1}`;

  const retryNotification: RetryNotification = {
    id: retryNotificationId,
    medicationId: medication.id,
    originalNotificationTime,
    currentRetryCount: retryCount + 1,
    maxRetryCount: medication.retryCount,
    nextRetryTime,
    createdAt: new Date(),
    isActive: true,
  };

  // Store retry notification in database
  await Database.saveRetryNotification(retryNotification);

  const notificationConfig: any = {
    id: retryNotificationId,
    title: `⏰ Reminder ${retryCount + 1}/${medication.retryCount}: ${medication.name}`,
    message: `Please take your ${medication.dosage} of ${medication.name}`,
    date: nextRetryTime,
    allowWhileIdle: true,
    userInfo: {
      medicationId: medication.id,
      notificationId: retryNotificationId,
      isRetry: true,
      retryCount: retryCount + 1,
      originalTime: originalNotificationTime.toISOString(),
    },
  };

  // iOS specific configuration
  if (Platform.OS === 'ios') {
    notificationConfig.category = 'MEDICATION_ACTIONS';
    // Critical notifications bypass DND and silent mode
    if (medication.criticalNotification) {
      notificationConfig.critical = true;
      notificationConfig.criticalSoundName = 'default';
      notificationConfig.interruptionLevel = 'critical'; // iOS 15+ critical notifications
    }
  } else {
    // Android specific configuration
    const channelId = medication.criticalNotification ? 'critical-medication-reminders' : 'medication-reminders';
    notificationConfig.channelId = channelId;
    notificationConfig.actions = ['TAKEN', 'SKIP', 'TAKEN_PHOTO'];
    // Critical notifications use high priority and override DND
    if (medication.criticalNotification) {
      notificationConfig.priority = 'max';
      notificationConfig.importance = 'max';
      notificationConfig.allowWhileIdle = true;
      notificationConfig.wakeLockTimeout = 10000; // 10 seconds wake lock
    }
  }

  PushNotification.localNotificationSchedule(notificationConfig);
  
  flipperLog.notification('RETRY_SCHEDULED', {
    medicationId: medication.id,
    retryCount: retryCount + 1,
    nextRetryTime: nextRetryTime.toISOString(),
  });

  console.log(`Retry notification ${retryCount + 1} scheduled for ${medication.name} at ${nextRetryTime.toISOString()}`);
};

export const cancelRetryNotifications = async (medicationId: string, originalNotificationTime: Date) => {
  console.log(`🔧 CANCELLING NOTIFICATIONS for medication ${medicationId}, originalTime: ${originalNotificationTime.toISOString()}`);
  
  // Cancel all notifications for this medication and time (both main and retry notifications)
  PushNotification.getScheduledLocalNotifications((notifications) => {
    console.log(`📋 Found ${notifications.length} total scheduled notifications`);
    let cancelledCount = 0;
    
    notifications.forEach((notification) => {
      const userInfo = (notification as any).userInfo;
      const notificationId = (notification as any).id;
      
      console.log(`🔍 Checking notification ${notificationId}:`, {
        medicationId: userInfo?.medicationId,
        originalTime: userInfo?.originalTime,
        isRetry: userInfo?.isRetry,
        notificationTimestamp: notificationId.includes(`_${originalNotificationTime.getTime()}_`)
      });
      
      // Match notifications by medicationId and either:
      // 1. originalTime matches (for retry notifications)
      // 2. notification ID contains the original timestamp (for main notifications)
      const isMainNotification = notificationId === `med_${medicationId}_${originalNotificationTime.getTime()}`;
      const isRetryNotification = userInfo?.medicationId === medicationId && 
                                 userInfo?.originalTime === originalNotificationTime.toISOString();
      
      if (isMainNotification || isRetryNotification) {
        PushNotification.cancelLocalNotification(notificationId);
        cancelledCount++;
        console.log(`✅ Cancelled notification: ${notificationId} (isRetry: ${userInfo?.isRetry || false}, isMain: ${isMainNotification})`);
      }
    });
    
    console.log(`🎯 Total notifications cancelled: ${cancelledCount}`);
  });

  // Mark retry notifications as inactive in database
  await Database.cancelRetryNotifications(medicationId, originalNotificationTime);
  
  flipperLog.notification('ALL_NOTIFICATIONS_CANCELLED', {
    medicationId,
    originalTime: originalNotificationTime.toISOString(),
  });
};

export const handleMedicationTakenOrSkipped = async (medicationId: string, originalNotificationTime: Date) => {
  // Cancel all pending retry notifications for this medication
  await cancelRetryNotifications(medicationId, originalNotificationTime);
  
  console.log(`Cancelled all retry notifications for medication ${medicationId}`);
};

// Enhanced schedule function that includes retry logic
export const scheduleNotificationWithRetry = async (medication: Medication, notificationTime: Date) => {
  // Schedule the main notification with original time in userInfo
  const notificationId = `med_${medication.id}_${notificationTime.getTime()}`;
  
  const notificationConfig: any = {
    id: notificationId,
    title: `Time to take ${medication.name}!`,
    message: `Don't forget your ${medication.dosage} of ${medication.name}`,
    date: notificationTime,
    allowWhileIdle: true,
    repeatType: 'week', // Will repeat weekly
    userInfo: {
      medicationId: medication.id,
      notificationId,
      originalTime: notificationTime.toISOString(),
    },
  };

  // iOS specific configuration
  if (Platform.OS === 'ios') {
    notificationConfig.category = 'MEDICATION_ACTIONS';
    // Critical notifications bypass DND and silent mode
    if (medication.criticalNotification) {
      notificationConfig.critical = true;
      notificationConfig.criticalSoundName = 'default';
      notificationConfig.interruptionLevel = 'critical'; // iOS 15+ critical notifications
    }
  } else {
    // Android specific configuration
    const channelId = medication.criticalNotification ? 'critical-medication-reminders' : 'medication-reminders';
    notificationConfig.channelId = channelId;
    notificationConfig.actions = ['TAKEN', 'SKIP', 'TAKEN_PHOTO'];
    // Critical notifications use high priority and override DND
    if (medication.criticalNotification) {
      notificationConfig.priority = 'max';
      notificationConfig.importance = 'max';
      notificationConfig.allowWhileIdle = true;
      notificationConfig.wakeLockTimeout = 10000; // 10 seconds wake lock
    }
  }

  PushNotification.localNotificationSchedule(notificationConfig);

  // If retry count is greater than 0, schedule all retry notifications
  if (medication.retryCount > 0) {
    for (let i = 0; i < medication.retryCount; i++) {
      await scheduleRetryNotification(medication, notificationTime, i);
    }
  }
};

