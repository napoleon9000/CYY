import { Medication } from '../types';
import { flipperLog } from './flipper';

interface NotificationCameraRequest {
  medication: Medication;
  originalTime: Date;
}

type CameraRequestCallback = (request: NotificationCameraRequest) => void;

class NotificationStateManager {
  private static instance: NotificationStateManager;
  private listeners: CameraRequestCallback[] = [];

  static getInstance(): NotificationStateManager {
    if (!NotificationStateManager.instance) {
      NotificationStateManager.instance = new NotificationStateManager();
    }
    return NotificationStateManager.instance;
  }

  // Request camera from notification
  requestCameraFromNotification(medication: Medication, originalTime: Date) {
    flipperLog.notification('CAMERA_REQUESTED_FROM_NOTIFICATION', {
      medicationId: medication.id,
      medicationName: medication.name,
      originalTime: originalTime.toISOString(),
    });

    const request: NotificationCameraRequest = {
      medication,
      originalTime,
    };

    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(request);
      } catch (error) {
        console.error('Error in camera request callback:', error);
      }
    });
  }

  // Listen for camera requests
  onCameraRequest(callback: CameraRequestCallback) {
    this.listeners.push(callback);
  }

  // Remove camera request listener
  removeCameraRequestListener(callback: CameraRequestCallback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

export const notificationStateManager = NotificationStateManager.getInstance();
export type { NotificationCameraRequest };