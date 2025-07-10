# Critical Notifications Implementation

## Overview
This document explains the implementation of critical notifications in the CYYMobileApp that bypass Do Not Disturb mode and silent mode.

## Changes Made

### 1. iOS Configuration

#### Entitlements (`ios/CYYMobileApp/CYYMobileApp.entitlements`)
- Added `com.apple.developer.usernotifications.time-sensitive` entitlement
- This is required for critical notifications on iOS

#### Info.plist (`ios/CYYMobileApp/Info.plist`)
- Added background modes for notifications
- Added `UIBackgroundModes` with `remote-notification` and `background-processing`

### 2. Android Configuration

#### AndroidManifest.xml (`android/app/src/main/AndroidManifest.xml`)
- Added `POST_NOTIFICATIONS` permission
- Added `USE_FULL_SCREEN_INTENT` permission
- Added `SYSTEM_ALERT_WINDOW` permission
- Added `WAKE_LOCK` permission
- Added `VIBRATE` permission

### 3. Notification Configuration

#### Notification Channels
- **Regular Channel**: `medication-reminders` (importance: 4)
- **Critical Channel**: `critical-medication-reminders` (importance: 5, bypassDnd: true)

#### iOS Critical Notifications
- Uses `critical: true` and `criticalSoundName: 'default'`
- Added `interruptionLevel: 'critical'` for iOS 15+
- Requires special entitlements and Apple approval

#### Android Critical Notifications
- Uses `priority: 'max'` and `importance: 'max'`
- Uses `bypassDnd: true` in channel configuration
- Added `wakeLockTimeout: 10000` for 10-second wake lock

### 4. Permission Handling
- Updated permission request to include critical notification permissions
- Enhanced permission messages to explain critical notification behavior

## Testing Critical Notifications

### 1. Enable Critical Notifications
1. Open the app and go to "Add Medication"
2. Toggle the "Critical Notification" switch to ON
3. Save the medication

### 2. Test on iOS
1. Enable Do Not Disturb mode on your iPhone
2. Set your iPhone to silent mode
3. Wait for the medication reminder or use the test function
4. The notification should appear even with DND enabled

### 3. Test on Android
1. Enable Do Not Disturb mode on your Android device
2. Set your device to silent mode
3. Wait for the medication reminder or use the test function
4. The notification should appear even with DND enabled

### 4. Debug Functions
Use these functions to check notification status:

```javascript
import { 
  checkCriticalNotificationSupport, 
  debugNotificationStatus,
  sendCriticalTestNotification 
} from '../utils/notifications';

// Check if critical notifications are supported
const support = await checkCriticalNotificationSupport();
console.log('Critical notification support:', support);

// Check overall notification status
const status = await debugNotificationStatus();
console.log('Notification status:', status);

// Send a test critical notification
const testResult = await sendCriticalTestNotification(medication, 5);
console.log('Test result:', testResult);
```

## Important Notes

### iOS Critical Notifications
- **Requires Apple Approval**: Critical notifications require special entitlements that need to be approved by Apple
- **Limited Use Cases**: Apple only approves critical notifications for specific use cases like medication reminders
- **User Permission**: Users must explicitly grant permission for critical notifications
- **iOS 15+**: Full critical notification support requires iOS 15 or later

### Android Critical Notifications
- **Channel-based**: Uses high-priority notification channels with `bypassDnd: true`
- **System Override**: May still be limited by system-level Do Not Disturb settings
- **Battery Optimization**: May be affected by battery optimization settings

### Troubleshooting

#### Notifications Not Appearing
1. Check notification permissions in device settings
2. Verify Do Not Disturb settings
3. Check battery optimization settings (Android)
4. Ensure the app has the necessary permissions

#### iOS Critical Notifications Not Working
1. Verify the app has the required entitlements
2. Check if critical notifications are approved by Apple
3. Ensure the user has granted critical notification permission
4. Test on iOS 15+ for full support

#### Android Critical Notifications Not Working
1. Check notification channel settings
2. Verify Do Not Disturb bypass settings
3. Check battery optimization settings
4. Ensure all required permissions are granted

## Code Structure

### Key Functions
- `scheduleNotification()`: Main notification scheduling with critical support
- `scheduleRetryNotification()`: Retry notifications with critical support
- `scheduleNotificationWithRetry()`: Enhanced scheduling with retry logic
- `sendCriticalTestNotification()`: Test function for critical notifications
- `checkCriticalNotificationSupport()`: Debug function for critical notification status

### Configuration Files
- `src/utils/notifications.ts`: Main notification logic
- `ios/CYYMobileApp/CYYMobileApp.entitlements`: iOS entitlements
- `ios/CYYMobileApp/Info.plist`: iOS configuration
- `android/app/src/main/AndroidManifest.xml`: Android permissions

## Future Improvements
1. Add user education about critical notifications
2. Implement notification analytics
3. Add more granular notification controls
4. Improve error handling and user feedback
5. Add notification history and management