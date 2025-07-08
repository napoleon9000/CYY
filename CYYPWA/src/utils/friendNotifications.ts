import { showNotification, playSound, vibrate } from './notifications';
import { db, FriendReminder } from '../db/database';
import { realtimeService } from './api';

export class FriendNotificationHandler {
  private static instance: FriendNotificationHandler | null = null;
  
  private constructor() {
    this.setupListeners();
  }
  
  static getInstance(): FriendNotificationHandler {
    if (!this.instance) {
      this.instance = new FriendNotificationHandler();
    }
    return this.instance;
  }
  
  private setupListeners() {
    // Listen for friend reminders via WebSocket
    realtimeService.on('friend-reminder', this.handleFriendReminder.bind(this));
    
    // Check for unread reminders periodically
    setInterval(() => this.checkUnreadReminders(), 30000); // Every 30 seconds
  }
  
  private async handleFriendReminder(reminder: FriendReminder) {
    try {
      // Save to local database
      await db.friendReminders.add(reminder);
      
      // Show notification
      this.showReminderNotification(reminder);
      
      // Play sound and vibrate
      playSound('urgent');
      vibrate([200, 100, 200, 100, 200]);
      
    } catch (error) {
      console.error('Failed to handle friend reminder:', error);
    }
  }
  
  private showReminderNotification(reminder: FriendReminder) {
    const title = `Reminder from ${reminder.fromUserName}`;
    const body = reminder.message;
    
    const notification = showNotification(title, {
      body,
      icon: '/medication-icon.png',
      badge: '/medication-badge.png',
      tag: `friend-reminder-${reminder.id}`,
      requireInteraction: true,
      data: {
        type: 'friend-reminder',
        reminderId: reminder.id,
        medicationId: reminder.medicationId
      }
    });
    
    if (notification) {
      notification.onclick = () => {
        // Navigate to medications page
        window.location.hash = '#/medications';
        notification.close();
      };
    }
  }
  
  async checkUnreadReminders() {
    try {
      const unreadReminders = await db.friendReminders
        .where('read')
        .equals(false)
        .toArray();
      
      // Update app badge count if supported
      if ('setAppBadge' in navigator && unreadReminders.length > 0) {
        (navigator as any).setAppBadge(unreadReminders.length);
      }
      
      // Show notification for the most recent unread reminder
      if (unreadReminders.length > 0) {
        const mostRecent = unreadReminders.sort((a: FriendReminder, b: FriendReminder) => 
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        )[0];
        
        // Only show notification if it's less than 5 minutes old
        const ageInMinutes = (Date.now() - new Date(mostRecent.receivedAt).getTime()) / 60000;
        if (ageInMinutes < 5) {
          this.showReminderNotification(mostRecent);
        }
      }
    } catch (error) {
      console.error('Failed to check unread reminders:', error);
    }
  }
  
  async markAsRead(reminderId: number) {
    try {
      await db.friendReminders.update(reminderId, { read: true });
      
      // Update badge count
      const unreadCount = await db.friendReminders
        .where('read')
        .equals(false)
        .count();
      
      if ('setAppBadge' in navigator) {
        if (unreadCount === 0) {
          (navigator as any).clearAppBadge();
        } else {
          (navigator as any).setAppBadge(unreadCount);
        }
      }
    } catch (error) {
      console.error('Failed to mark reminder as read:', error);
    }
  }
  
  async getUnreadCount(): Promise<number> {
    try {
      return await db.friendReminders
        .where('read')
        .equals(false)
        .count();
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
}

// Initialize the handler when the module is imported
export const friendNotificationHandler = FriendNotificationHandler.getInstance();