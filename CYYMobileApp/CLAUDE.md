# CYY Mobile App - Technical Documentation

## Project Overview
React Native medication reminder app with full notification system, photo evidence, and analytics.

**Working Directory**: `/Volumes/ORICO/Projects/CYY/CYYMobileApp/`

## Current Status: PRODUCTION READY ✅
- React Native 0.75.4, TypeScript 5.0.4
- All core features implemented and tested
- iOS/Android build systems configured
- Ready for App Store deployment

## Architecture

### Core Technologies
- **React Native 0.75.4** with TypeScript
- **AsyncStorage** for local persistence via Database class
- **React Navigation** (Bottom tabs + Stack)
- **Push Notifications** with retry logic
- **Camera Integration** with permissions
- **Material Design** UI with gradients

### Key Dependencies
```json
{
  "@react-navigation/native": "6.1.9",
  "@react-navigation/bottom-tabs": "6.5.11", 
  "react-native-push-notification": "8.1.1",
  "react-native-image-picker": "7.0.3",
  "react-native-permissions": "4.1.5",
  "react-native-linear-gradient": "2.8.3",
  "react-native-vector-icons": "10.0.3",
  "@react-native-async-storage/async-storage": "1.19.5"
}
```

### File Structure
```
src/
├── components/
│   ├── ReminderModal.tsx
│   ├── CameraModal.tsx        # Full camera interface
│   ├── PhotoThumbnail.tsx     # Reusable thumbnail component
│   └── PhotoViewerModal.tsx   # Full-screen photo viewer
├── screens/
│   ├── HomeScreen.tsx         # Medication CRUD
│   ├── AddMedicationScreen.tsx # Form with retry count
│   ├── MedicationDetailsScreen.tsx # Stats + photos
│   ├── TrackScreen.tsx        # History + camera + swipe-to-delete
│   └── SettingsScreen.tsx     # Preferences
├── utils/
│   ├── database.ts           # AsyncStorage wrapper + retry notifications
│   ├── notifications.ts      # Push notifications + retry logic
│   └── notificationState.ts  # Custom event system
└── types/
    ├── medication.ts         # Core interfaces
    └── navigation.ts         # Navigation types
```

## Core Features

### 1. Medication Management
- CRUD operations with validation
- Color picker, time selection, days of week
- Configurable retry notifications (0-99 times, 10-min intervals)
- Active/inactive toggle with notification scheduling

### 2. Notification System
- Weekly scheduling based on medication settings
- Retry notifications with automatic cancellation
- Interactive notifications with Photo/Taken/Skipped actions
- Background processing with proper permissions

### 3. Photo Evidence System
- Camera integration via react-native-image-picker
- Photo thumbnails in history and details screens
- Full-screen photo viewer with zoom and human-friendly timestamps
- Photo metadata stored in medication logs

### 4. Analytics & Tracking
- Compliance rates and streak tracking
- Time distribution charts
- SwipeableLogItem with iOS-style delete (80px threshold)
- Real-time statistics dashboard

## Database Schema

### Medication Interface
```typescript
interface Medication {
  id: string;
  name: string;
  dosage: string;
  reminderTime: string; // HH:MM
  reminderDays: number[]; // 0-6 (Sunday=0)
  notificationType: 'notification' | 'sound' | 'vibration' | 'all';
  isActive: boolean;
  color: string;
  retryCount: number; // 0-99 retry notifications
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### MedicationLog Interface
```typescript
interface MedicationLog {
  id: string;
  medicationId: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'taken' | 'skipped' | 'pending';
  photoUri?: string;
  notes?: string;
  createdAt: Date;
}
```

### RetryNotification Interface
```typescript
interface RetryNotification {
  id: string;
  medicationId: string;
  originalNotificationId: string;
  originalTime: Date;
  retryNumber: number;
  scheduledTime: Date;
  isActive: boolean;
  createdAt: Date;
}
```

## Key Implementation Details

### SwipeableLogItem (TrackScreen)
- iOS-style swipe-to-delete with 60px threshold
- Shows delete button after partial swipe
- Spring animations for smooth UX
- Prevents accidental deletions

### Notification Retry Logic
- Configurable retry count per medication
- 10-minute intervals between retries
- Automatic cancellation when taken/skipped
- Custom event system for camera requests

### Photo Caption System
- Human-friendly timestamps: "Just now", "5 minutes ago", "Yesterday at 2:30 PM"
- Contextual display based on time elapsed
- Full metadata preservation

### Database Class Methods
```typescript
// Core CRUD
getMedicationById(id: string): Promise<Medication>
saveMedication(medication: Medication): Promise<void>
deleteMedication(id: string): Promise<void>

// Retry notifications
saveRetryNotification(notification: RetryNotification): Promise<void>
cancelRetryNotifications(medicationId: string, originalTime: Date): Promise<void>

// Logs with photo support
saveLog(log: MedicationLog): Promise<void>
getLogsByMedicationId(medicationId: string): Promise<MedicationLog[]>
```

## Build & Development

### Quick Start
```bash
npm install
cd ios && pod install
make ios        # iOS simulator
make android    # Android emulator
```

### Key Commands (Makefile)
```bash
make help           # All available commands
make debug-ios      # Full debugging with Flipper
make clean          # Clean builds
make archive-ios    # Production iOS build
```

### Flipper Debugging
- All logging with [Flipper] tags
- Database inspection
- Network monitoring  
- React DevTools integration

## Production Deployment

### iOS App Store
- Xcode workspace: `ios/CYYMobileApp.xcworkspace`
- Export config: `ios/ExportOptions.plist`
- 76 CocoaPods dependencies installed

### Required Permissions
- iOS: Camera, Photo Library (Info.plist)
- Android: CAMERA, READ/WRITE_EXTERNAL_STORAGE

## Technical Decisions

### Custom Event System
- Replaced Node.js EventEmitter with array-based listeners
- React Native compatibility for notification camera requests

### Photo Storage
- Local file URIs stored in medication logs
- react-native-permissions for runtime permission handling
- Thumbnail generation with overlay icons

### Notification Architecture
- Weekly scheduling with automatic retry logic
- Database-backed retry notification tracking
- Comprehensive cancellation system

## Migration Notes
- Successfully converted from PWA to React Native
- Improved reliability: native notifications vs browser limitations
- Enhanced performance: 60fps native rendering
- Added capabilities: camera, background processing, app store distribution

---

*Last updated: July 2025 - All features complete and production-ready*