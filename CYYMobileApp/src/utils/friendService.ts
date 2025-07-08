import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Friend, SharedMedication, FriendReminder } from '../types/common';
import { Medication } from '../types/medication';
import { generateNotificationId } from './notifications';

// 存储键
const STORAGE_KEYS = {
  USER: 'current_user',
  FRIENDS: 'friends_list',
  SHARED_MEDICATIONS: 'shared_medications',
  FRIEND_REMINDERS: 'friend_reminders',
};

// 生成唯一ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 生成邀请码
const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// 生成用户名
const generateUsername = (): string => {
  const adjectives = ['Happy', 'Healthy', 'Wise', 'Kind', 'Bright', 'Calm', 'Strong'];
  const nouns = ['Healer', 'Helper', 'Friend', 'Guardian', 'Companion', 'Supporter'];
  const randomNum = Math.floor(Math.random() * 1000);
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${randomNum}`;
};

// 用户管理服务
export class UserService {
  // 初始化当前用户
  static async initializeUser(displayName?: string): Promise<User> {
    try {
      const existingUserStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (existingUserStr) {
        return JSON.parse(existingUserStr);
      }

      const username = generateUsername();
      const inviteCode = generateInviteCode();
      
      const user: User = {
        id: generateId(),
        username,
        displayName: displayName || username,
        inviteCode,
        createdAt: new Date()
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Failed to initialize user:', error);
      throw error;
    }
  }

  // 获取当前用户
  static async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // 更新用户信息
  static async updateUser(updates: Partial<User>): Promise<void> {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) throw new Error('No current user found');

      const updatedUser = { ...currentUser, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // 生成新的邀请码
  static async generateNewInviteCode(): Promise<string> {
    try {
      const newInviteCode = generateInviteCode();
      await this.updateUser({ inviteCode: newInviteCode });
      return newInviteCode;
    } catch (error) {
      console.error('Failed to generate new invite code:', error);
      throw error;
    }
  }
}

// 好友管理服务
export class FriendService {
  // 获取好友列表
  static async getFriends(): Promise<Friend[]> {
    try {
      const friendsStr = await AsyncStorage.getItem(STORAGE_KEYS.FRIENDS);
      return friendsStr ? JSON.parse(friendsStr) : [];
    } catch (error) {
      console.error('Failed to get friends:', error);
      return [];
    }
  }

  // 保存好友列表
  private static async saveFriends(friends: Friend[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
    } catch (error) {
      console.error('Failed to save friends:', error);
      throw error;
    }
  }

  // 通过邀请码添加好友
  static async addFriendByInviteCode(inviteCode: string): Promise<{ success: boolean; message: string; friend?: Friend }> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: '用户未初始化' };
      }

      // 检查是否是自己的邀请码
      if (currentUser.inviteCode === inviteCode) {
        return { success: false, message: '不能添加自己为好友' };
      }

      // 模拟查找邀请码对应的用户
      const friendUser = await this.simulateFindUserByInviteCode(inviteCode);
      if (!friendUser) {
        return { success: false, message: '无效的邀请码' };
      }

      // 检查是否已经是好友
      const friends = await this.getFriends();
      const existingFriend = friends.find(f => f.friendUserId === friendUser.id);
      
      if (existingFriend) {
        if (existingFriend.status === 'accepted') {
          return { success: false, message: '已经是好友了' };
        } else if (existingFriend.status === 'pending') {
          return { success: false, message: '好友请求待处理' };
        }
      }

      // 创建好友关系
      const friend: Friend = {
        id: generateId(),
        userId: currentUser.id,
        friendUserId: friendUser.id,
        friendUsername: friendUser.username,
        friendDisplayName: friendUser.displayName,
        friendAvatarUrl: friendUser.avatarUrl,
        status: 'accepted', // 通过邀请码直接接受
        createdAt: new Date(),
        acceptedAt: new Date()
      };

      friends.push(friend);
      await this.saveFriends(friends);

      return { 
        success: true, 
        message: '好友添加成功！', 
        friend 
      };
    } catch (error) {
      console.error('添加好友失败:', error);
      return { success: false, message: '添加好友失败，请重试' };
    }
  }

  // 模拟通过邀请码查找用户
  private static async simulateFindUserByInviteCode(inviteCode: string): Promise<User | null> {
    const mockUsers = [
      { username: 'HealthyHelper123', displayName: '健康小助手', inviteCode: 'demo123' },
      { username: 'CareCompanion456', displayName: '关爱伙伴', inviteCode: 'demo456' },
      { username: 'WellnessWatcher789', displayName: '健康守护者', inviteCode: 'demo789' }
    ];

    const mockUser = mockUsers.find(u => u.inviteCode === inviteCode);
    if (!mockUser) return null;

    return {
      id: generateId(),
      username: mockUser.username,
      displayName: mockUser.displayName,
      inviteCode: mockUser.inviteCode,
      createdAt: new Date()
    };
  }

  // 删除好友
  static async removeFriend(friendUserId: string): Promise<boolean> {
    try {
      const friends = await this.getFriends();
      const updatedFriends = friends.filter(f => f.friendUserId !== friendUserId);
      await this.saveFriends(updatedFriends);
      
      // 同时删除相关的分享关系
      await SharingService.removeAllSharingWithFriend(friendUserId);
      
      return true;
    } catch (error) {
      console.error('删除好友失败:', error);
      return false;
    }
  }
}

// 药物分享管理服务
export class SharingService {
  // 获取分享的药物列表
  static async getSharedMedications(): Promise<SharedMedication[]> {
    try {
      const sharedStr = await AsyncStorage.getItem(STORAGE_KEYS.SHARED_MEDICATIONS);
      return sharedStr ? JSON.parse(sharedStr) : [];
    } catch (error) {
      console.error('Failed to get shared medications:', error);
      return [];
    }
  }

  // 保存分享的药物列表
  private static async saveSharedMedications(shared: SharedMedication[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHARED_MEDICATIONS, JSON.stringify(shared));
    } catch (error) {
      console.error('Failed to save shared medications:', error);
      throw error;
    }
  }

  // 分享药物给好友
  static async shareMedicationWithFriend(
    medicationId: string, 
    friendUserId: string, 
    canRemind: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: '用户未初始化' };
      }

      const friends = await FriendService.getFriends();
      const friend = friends.find(f => f.friendUserId === friendUserId);
      if (!friend) {
        return { success: false, message: '好友不存在' };
      }

      // 检查是否已经分享过
      const sharedMedications = await this.getSharedMedications();
      const existingShare = sharedMedications.find(
        s => s.medicationId === medicationId && s.sharedWithFriendId === friendUserId && s.isActive
      );

      if (existingShare) {
        return { success: false, message: '已经分享给这个好友了' };
      }

      const sharedMedication: SharedMedication = {
        id: generateId(),
        medicationId,
        userId: currentUser.id,
        sharedWithFriendId: friendUserId,
        sharedWithUsername: friend.friendUsername,
        canRemind,
        isActive: true,
        createdAt: new Date()
      };

      sharedMedications.push(sharedMedication);
      await this.saveSharedMedications(sharedMedications);
      
      return { success: true, message: '药物分享成功！' };
    } catch (error) {
      console.error('分享药物失败:', error);
      return { success: false, message: '分享失败，请重试' };
    }
  }

  // 停止分享药物
  static async stopSharingMedication(sharedMedicationId: string): Promise<boolean> {
    try {
      const sharedMedications = await this.getSharedMedications();
      const updatedShared = sharedMedications.map(s => 
        s.id === sharedMedicationId ? { ...s, isActive: false } : s
      );
      await this.saveSharedMedications(updatedShared);
      return true;
    } catch (error) {
      console.error('停止分享失败:', error);
      return false;
    }
  }

  // 获取我分享出去的药物
  static async getMySharedMedications(): Promise<SharedMedication[]> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) return [];

      const sharedMedications = await this.getSharedMedications();
      return sharedMedications.filter(s => s.userId === currentUser.id && s.isActive);
    } catch (error) {
      console.error('Failed to get my shared medications:', error);
      return [];
    }
  }

  // 获取好友分享给我的药物
  static async getFriendsSharedMedications(): Promise<SharedMedication[]> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) return [];

      const sharedMedications = await this.getSharedMedications();
      return sharedMedications.filter(s => s.sharedWithFriendId === currentUser.id && s.isActive);
    } catch (error) {
      console.error('Failed to get friends shared medications:', error);
      return [];
    }
  }

  // 删除与某个好友的所有分享关系
  static async removeAllSharingWithFriend(friendUserId: string): Promise<void> {
    try {
      const sharedMedications = await this.getSharedMedications();
      const updatedShared = sharedMedications.map(s => 
        (s.sharedWithFriendId === friendUserId || s.userId === friendUserId) 
          ? { ...s, isActive: false } 
          : s
      );
      await this.saveSharedMedications(updatedShared);
    } catch (error) {
      console.error('Failed to remove sharing with friend:', error);
    }
  }
}

// 好友提醒管理服务
export class ReminderService {
  // 获取提醒列表
  static async getReminders(): Promise<FriendReminder[]> {
    try {
      const remindersStr = await AsyncStorage.getItem(STORAGE_KEYS.FRIEND_REMINDERS);
      return remindersStr ? JSON.parse(remindersStr) : [];
    } catch (error) {
      console.error('Failed to get reminders:', error);
      return [];
    }
  }

  // 保存提醒列表
  private static async saveReminders(reminders: FriendReminder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_REMINDERS, JSON.stringify(reminders));
    } catch (error) {
      console.error('Failed to save reminders:', error);
      throw error;
    }
  }

  // 发送好友提醒
  static async sendFriendReminder(
    sharedMedicationId: string,
    message: string,
    type: 'missed_dose' | 'encouragement' | 'custom' = 'missed_dose'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: '用户未初始化' };
      }

      const sharedMedications = await SharingService.getSharedMedications();
      const sharedMed = sharedMedications.find(s => s.id === sharedMedicationId);
      
      if (!sharedMed || !sharedMed.canRemind) {
        return { success: false, message: '无法发送提醒' };
      }

      const reminder: FriendReminder = {
        id: generateId(),
        sharedMedicationId,
        fromUserId: currentUser.id,
        fromUsername: currentUser.username,
        toUserId: sharedMed.userId,
        medicationName: 'Medication', // 这里需要根据medicationId获取药物名称
        reminderMessage: message,
        sentAt: new Date(),
        type
      };

      const reminders = await this.getReminders();
      reminders.push(reminder);
      await this.saveReminders(reminders);

      // 发送推送通知
      await this.sendPushNotification(reminder);

      return { success: true, message: '提醒发送成功！' };
    } catch (error) {
      console.error('发送提醒失败:', error);
      return { success: false, message: '发送失败，请重试' };
    }
  }

  // 获取收到的提醒
  static async getReceivedReminders(unreadOnly: boolean = false): Promise<FriendReminder[]> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) return [];

      const reminders = await this.getReminders();
      let filtered = reminders.filter(r => r.toUserId === currentUser.id);
      
      if (unreadOnly) {
        filtered = filtered.filter(r => !r.readAt);
      }
      
      return filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    } catch (error) {
      console.error('Failed to get received reminders:', error);
      return [];
    }
  }

  // 标记提醒已读
  static async markReminderAsRead(reminderId: string): Promise<boolean> {
    try {
      const reminders = await this.getReminders();
      const updatedReminders = reminders.map(r => 
        r.id === reminderId ? { ...r, readAt: new Date() } : r
      );
      await this.saveReminders(updatedReminders);
      return true;
    } catch (error) {
      console.error('标记提醒已读失败:', error);
      return false;
    }
  }

  // 发送推送通知
  private static async sendPushNotification(reminder: FriendReminder): Promise<void> {
    try {
      // 这里集成推送通知服务
      console.log(`发送推送通知: 来自 ${reminder.fromUsername} 的提醒: ${reminder.reminderMessage}`);
      
      // 可以使用 react-native-push-notification 或其他推送服务
      // PushNotification.localNotification({
      //   title: `来自 ${reminder.fromUsername} 的提醒`,
      //   message: `${reminder.medicationName}: ${reminder.reminderMessage}`,
      //   playSound: true,
      //   soundName: 'default',
      // });
    } catch (error) {
      console.error('发送推送通知失败:', error);
    }
  }
}