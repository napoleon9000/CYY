import { db, User, Friend, SharedMedication, FriendReminder, InviteLink, generateInviteCode, generateUsername, Medication } from '../db/database';

// 用户管理
export class UserService {
  // 初始化当前用户（第一次使用时）
  static async initializeUser(displayName?: string): Promise<User> {
    const existingUsers = await db.users.toArray();
    if (existingUsers.length > 0) {
      return existingUsers[0]; // 返回现有用户
    }

    const username = generateUsername();
    const inviteCode = generateInviteCode();
    
    const user: User = {
      username,
      displayName: displayName || username,
      inviteCode,
      createdAt: new Date()
    };

    const id = await db.users.add(user);
    return { ...user, id };
  }

  // 获取当前用户
  static async getCurrentUser(): Promise<User | null> {
    const users = await db.users.toArray();
    return users.length > 0 ? users[0] : null;
  }

  // 更新用户信息
  static async updateUser(userId: number, updates: Partial<User>): Promise<void> {
    await db.users.update(userId, updates);
  }

  // 生成新的邀请码
  static async generateNewInviteCode(userId: number): Promise<string> {
    const newInviteCode = generateInviteCode();
    await db.users.update(userId, { inviteCode: newInviteCode });
    return newInviteCode;
  }
}

// 好友管理
export class FriendService {
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

      // 模拟查找邀请码对应的用户（实际应用中这需要通过服务器）
      // 这里我们创建一个模拟的好友用户
      const friendUser = await this.simulateFindUserByInviteCode(inviteCode);
      if (!friendUser) {
        return { success: false, message: '无效的邀请码' };
      }

      // 检查是否已经是好友
      const existingFriend = await db.friends
        .where({ userId: currentUser.id, friendUserId: friendUser.id })
        .first();
      
      if (existingFriend) {
        if (existingFriend.status === 'accepted') {
          return { success: false, message: '已经是好友了' };
        } else if (existingFriend.status === 'pending') {
          return { success: false, message: '好友请求待处理' };
        }
      }

      // 创建好友关系
      const friend: Friend = {
        userId: currentUser.id!,
        friendUserId: friendUser.id!,
        friendUsername: friendUser.username,
        friendDisplayName: friendUser.displayName,
        friendAvatarUrl: friendUser.avatarUrl,
        status: 'accepted', // 通过邀请码直接接受
        createdAt: new Date(),
        acceptedAt: new Date()
      };

      const friendId = await db.friends.add(friend);
      
      // 同时为对方创建好友关系
      const reverseFriend: Friend = {
        userId: friendUser.id!,
        friendUserId: currentUser.id!,
        friendUsername: currentUser.username,
        friendDisplayName: currentUser.displayName,
        friendAvatarUrl: currentUser.avatarUrl,
        status: 'accepted',
        createdAt: new Date(),
        acceptedAt: new Date()
      };

      await db.friends.add(reverseFriend);

      return { 
        success: true, 
        message: '好友添加成功！', 
        friend: { ...friend, id: friendId } 
      };
    } catch (error) {
      console.error('添加好友失败:', error);
      return { success: false, message: '添加好友失败，请重试' };
    }
  }

  // 模拟通过邀请码查找用户（实际应用中需要服务器API）
  private static async simulateFindUserByInviteCode(inviteCode: string): Promise<User | null> {
    // 这里模拟一个假的用户，实际应用中需要通过服务器查询
    const mockUsers = [
      { username: 'HealthyHelper123', displayName: '健康小助手', inviteCode: 'demo123' },
      { username: 'CareCompanion456', displayName: '关爱伙伴', inviteCode: 'demo456' },
      { username: 'WellnessWatcher789', displayName: '健康守护者', inviteCode: 'demo789' }
    ];

    const mockUser = mockUsers.find(u => u.inviteCode === inviteCode);
    if (!mockUser) return null;

    // 检查是否已存在这个模拟用户
    const existingUser = await db.users.where('username').equals(mockUser.username).first();
    if (existingUser) return existingUser;

    // 创建新的模拟用户
    const newUser: User = {
      username: mockUser.username,
      displayName: mockUser.displayName,
      inviteCode: mockUser.inviteCode,
      createdAt: new Date()
    };

    const id = await db.users.add(newUser);
    return { ...newUser, id };
  }

  // 获取好友列表
  static async getFriends(userId: number): Promise<Friend[]> {
    return await db.friends
      .where({ userId, status: 'accepted' })
      .toArray();
  }

  // 删除好友
  static async removeFriend(userId: number, friendUserId: number): Promise<boolean> {
    try {
      // 删除双向好友关系
      await db.friends.where({ userId, friendUserId }).delete();
      await db.friends.where({ userId: friendUserId, friendUserId: userId }).delete();
      
      // 删除相关的分享关系
      await db.sharedMedications.where({ userId, sharedWithFriendId: friendUserId }).delete();
      await db.sharedMedications.where({ userId: friendUserId, sharedWithFriendId: userId }).delete();
      
      return true;
    } catch (error) {
      console.error('删除好友失败:', error);
      return false;
    }
  }
}

// 药物分享管理
export class SharingService {
  // 分享药物给好友
  static async shareMedicationWithFriend(
    medicationId: number, 
    friendId: number, 
    canRemind: boolean = true
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: '用户未初始化' };
      }

      const friend = await db.friends.get(friendId);
      if (!friend) {
        return { success: false, message: '好友不存在' };
      }

      // 检查是否已经分享过
      const existingShare = await db.sharedMedications
        .where({ medicationId, userId: currentUser.id, sharedWithFriendId: friend.friendUserId })
        .first();

      if (existingShare && existingShare.isActive) {
        return { success: false, message: '已经分享给这个好友了' };
      }

      const sharedMedication: SharedMedication = {
        medicationId,
        userId: currentUser.id!,
        sharedWithFriendId: friend.friendUserId,
        sharedWithUsername: friend.friendUsername,
        canRemind,
        isActive: true,
        createdAt: new Date()
      };

      await db.sharedMedications.add(sharedMedication);
      return { success: true, message: '药物分享成功！' };
    } catch (error) {
      console.error('分享药物失败:', error);
      return { success: false, message: '分享失败，请重试' };
    }
  }

  // 停止分享药物
  static async stopSharingMedication(sharedMedicationId: number): Promise<boolean> {
    try {
      await db.sharedMedications.update(sharedMedicationId, { isActive: false });
      return true;
    } catch (error) {
      console.error('停止分享失败:', error);
      return false;
    }
  }

  // 获取我分享出去的药物
  static async getMySharedMedications(userId: number): Promise<(SharedMedication & { medication: Medication })[]> {
    const sharedMeds = await db.sharedMedications
      .where({ userId, isActive: true })
      .toArray();

    const result = [];
    for (const shared of sharedMeds) {
      const medication = await db.medications.get(shared.medicationId);
      if (medication) {
        result.push({ ...shared, medication });
      }
    }

    return result;
  }

  // 获取好友分享给我的药物
  static async getFriendsSharedMedications(userId: number): Promise<(SharedMedication & { medication: Medication; friendInfo: Friend })[]> {
    // 获取所有分享给我的药物
    const sharedMeds = await db.sharedMedications
      .where({ sharedWithFriendId: userId, isActive: true })
      .toArray();

    const result = [];
    for (const shared of sharedMeds) {
      const medication = await db.medications.get(shared.medicationId);
      const friendInfo = await db.friends
        .where({ userId, friendUserId: shared.userId })
        .first();

      if (medication && friendInfo) {
        result.push({ ...shared, medication, friendInfo });
      }
    }

    return result;
  }
}

// 好友提醒管理
export class ReminderService {
  // 发送好友提醒
  static async sendFriendReminder(
    sharedMedicationId: number,
    message: string,
    type: 'missed_dose' | 'encouragement' | 'custom' = 'missed_dose'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = await UserService.getCurrentUser();
      if (!currentUser) {
        return { success: false, message: '用户未初始化' };
      }

      const sharedMed = await db.sharedMedications.get(sharedMedicationId);
      if (!sharedMed || !sharedMed.canRemind) {
        return { success: false, message: '无法发送提醒' };
      }

      const medication = await db.medications.get(sharedMed.medicationId);
      if (!medication) {
        return { success: false, message: '药物不存在' };
      }

      const reminder: FriendReminder = {
        sharedMedicationId,
        fromUserId: currentUser.id!,
        fromUsername: currentUser.username,
        toUserId: sharedMed.userId,
        medicationName: medication.name,
        reminderMessage: message,
        sentAt: new Date(),
        type
      };

      await db.friendReminders.add(reminder);

      // 触发通知（这里需要扩展通知系统）
      await this.triggerFriendReminderNotification(reminder);

      return { success: true, message: '提醒发送成功！' };
    } catch (error) {
      console.error('发送提醒失败:', error);
      return { success: false, message: '发送失败，请重试' };
    }
  }

  // 获取收到的提醒
  static async getReceivedReminders(userId: number, unreadOnly: boolean = false): Promise<FriendReminder[]> {
    const query = db.friendReminders.where({ toUserId: userId });
    
    if (unreadOnly) {
      return await query.and((reminder: FriendReminder) => !reminder.readAt).toArray();
    }
    
    return await query.reverse().toArray();
  }

  // 标记提醒已读
  static async markReminderAsRead(reminderId: number): Promise<boolean> {
    try {
      await db.friendReminders.update(reminderId, { readAt: new Date() });
      return true;
    } catch (error) {
      console.error('标记提醒已读失败:', error);
      return false;
    }
  }

  // 触发好友提醒通知
  private static async triggerFriendReminderNotification(reminder: FriendReminder): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`来自 ${reminder.fromUsername} 的提醒`, {
        body: `${reminder.medicationName}: ${reminder.reminderMessage}`,
        icon: '/icon-192x192.png',
        tag: `friend-reminder-${reminder.id}`,
        requireInteraction: true
      });
    }
  }

  // 检查是否有遗漏的药物（供好友提醒使用）
  static async checkMissedMedications(userId: number): Promise<{ medication: Medication; timeOverdue: number }[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const medications = await db.medications.where({ isActive: true }).toArray();
    const missed = [];

    for (const med of medications) {
      // 检查今天是否应该服药
      if (!med.reminderDays.includes(now.getDay())) continue;

      const [hours, minutes] = med.reminderTime.split(':');
      const scheduledTime = new Date(today);
      scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // 如果已经过了服药时间
      if (now > scheduledTime) {
        // 检查是否已经服药
        const log = await db.medicationLogs
          .where('medicationId')
          .equals(med.id!)
          .and((log: any) => {
            const logDate = new Date(log.takenAt);
            return logDate >= today && logDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          })
          .first();

        if (!log || log.skipped) {
          const overdueMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / (1000 * 60));
          missed.push({ medication: med, timeOverdue: overdueMinutes });
        }
      }
    }

    return missed;
  }
}