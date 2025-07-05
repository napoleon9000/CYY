import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import { Medication } from '../types';
import { flipperLog } from './flipper';

// Configure notifications
PushNotification.configure({
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },

  onNotification: function (notification) {
    console.log('NOTIFICATION:', notification);
    // notification.finish is called automatically in React Native
  },

  onAction: function (notification) {
    console.log('ACTION:', notification.action);
    console.log('NOTIFICATION:', notification);
  },

  onRegistrationError: function(err) {
    console.error(err.message, err);
  },

  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  popInitialNotification: true,
  requestPermissions: Platform.OS === 'ios',
});

// Create notification channel (Android)
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
  (created) => console.log(`Channel created: ${created}`)
);

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
      PushNotification.requestPermissions().then((permissions) => {
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
          message: 'CYY needs notification permissions to remind you about your medications.',
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
  
  PushNotification.localNotificationSchedule({
    id: notificationId,
    channelId: 'medication-reminders',
    title: `Time to take ${medication.name}!`,
    message: `Don't forget your ${medication.dosage} of ${medication.name}`,
    date: notificationTime,
    allowWhileIdle: true,
    repeatType: 'week', // Will repeat weekly
    userInfo: {
      medicationId: medication.id,
      notificationId,
    },
    actions: ['Mark as Taken', 'Snooze'],
  });
};

export const cancelNotification = (notificationId: string) => {
  PushNotification.cancelLocalNotification(notificationId);
};

export const cancelAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
};

export const scheduleWeeklyReminders = (medication: Medication) => {
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
  
  medication.reminderDays.forEach((dayOfWeek) => {
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
    
    scheduleNotification(medication, notificationDate);
  });
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
  PushNotification.localNotification({
    channelId: 'medication-reminders',
    title,
    message,
    playSound: true,
    soundName: 'default',
    vibrate: true,
  });
};