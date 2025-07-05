import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import { Medication } from '../types';

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

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      PushNotification.requestPermissions().then((permissions) => {
        resolve(permissions.alert || false);
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
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
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