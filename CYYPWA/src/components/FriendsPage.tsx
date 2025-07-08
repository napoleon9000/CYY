import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserFriends, 
  FaPlus, 
  FaShare, 
  FaBell, 
  FaCopy, 
  FaTrash, 
  FaTimes, 
  FaCheck,
  FaExclamationCircle,
  FaHeart,
  FaPills
} from 'react-icons/fa';
import { UserService, FriendService, SharingService, ReminderService } from '../utils/friendService';
import { User, Friend, Medication, SharedMedication, FriendReminder } from '../db/database';

interface FriendsPageProps {
  medications: Medication[];
  onUpdate: () => void;
}

type TabType = 'friends' | 'sharing' | 'reminders';

const FriendsPage: React.FC<FriendsPageProps> = ({ medications, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [sharedMedications, setSharedMedications] = useState<(SharedMedication & { medication: Medication })[]>([]);
  const [friendsSharedMeds, setFriendsSharedMeds] = useState<(SharedMedication & { medication: Medication; friendInfo: Friend })[]>([]);
  const [reminders, setReminders] = useState<FriendReminder[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showShareMedication, setShowShareMedication] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [shareTargetMed, setShareTargetMed] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      if (activeTab === 'sharing') {
        loadSharedMedications();
      } else if (activeTab === 'reminders') {
        loadReminders();
      }
    }
  }, [currentUser, activeTab]);

  const initializeUser = async () => {
    try {
      const user = await UserService.initializeUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to initialize user:', error);
      showMessage('error', '用户初始化失败');
    }
  };

  const loadFriends = async () => {
    if (!currentUser) return;
    try {
      const friendsList = await FriendService.getFriends(currentUser.id!);
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadSharedMedications = async () => {
    if (!currentUser) return;
    try {
      const [myShared, friendsShared] = await Promise.all([
        SharingService.getMySharedMedications(currentUser.id!),
        SharingService.getFriendsSharedMedications(currentUser.id!)
      ]);
      setSharedMedications(myShared);
      setFriendsSharedMeds(friendsShared);
    } catch (error) {
      console.error('Failed to load shared medications:', error);
    }
  };

  const loadReminders = async () => {
    if (!currentUser) return;
    try {
      const remindersList = await ReminderService.getReceivedReminders(currentUser.id!);
      setReminders(remindersList);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const handleAddFriend = async () => {
    if (!inviteCode.trim()) return;
    
    setLoading(true);
    try {
      const result = await FriendService.addFriendByInviteCode(inviteCode.trim());
      if (result.success) {
        showMessage('success', result.message);
        setInviteCode('');
        setShowAddFriend(false);
        loadFriends();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', '添加好友失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    if (!currentUser || !confirm(`确定要删除好友 ${friend.friendDisplayName} 吗？`)) return;
    
    try {
      const success = await FriendService.removeFriend(currentUser.id!, friend.friendUserId);
      if (success) {
        showMessage('success', '好友删除成功');
        loadFriends();
      } else {
        showMessage('error', '删除好友失败');
      }
    } catch (error) {
      showMessage('error', '删除好友失败');
    }
  };

  const handleShareMedication = async (medicationId: number, friendId: number, canRemind: boolean) => {
    try {
      const result = await SharingService.shareMedicationWithFriend(medicationId, friendId, canRemind);
      if (result.success) {
        showMessage('success', result.message);
        setShowShareMedication(false);
        setShareTargetMed(null);
        loadSharedMedications();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', '分享失败');
    }
  };

  const handleStopSharing = async (sharedMedicationId: number) => {
    if (!confirm('确定要停止分享这个药物吗？')) return;
    
    try {
      const success = await SharingService.stopSharingMedication(sharedMedicationId);
      if (success) {
        showMessage('success', '停止分享成功');
        loadSharedMedications();
      } else {
        showMessage('error', '操作失败');
      }
    } catch (error) {
      showMessage('error', '操作失败');
    }
  };

  const handleSendReminder = async (sharedMed: SharedMedication & { medication: Medication; friendInfo: Friend }) => {
    const message = `该吃药了！记得按时服用 ${sharedMed.medication.name}`;
    
    try {
      const result = await ReminderService.sendFriendReminder(sharedMed.id!, message);
      if (result.success) {
        showMessage('success', result.message);
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', '发送提醒失败');
    }
  };

  const copyInviteCode = async () => {
    if (!currentUser) return;
    
    try {
      await navigator.clipboard.writeText(currentUser.inviteCode);
      showMessage('success', '邀请码已复制到剪贴板');
    } catch (error) {
      showMessage('error', '复制失败');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const renderFriendsTab = () => (
    <div className="space-y-6">
      {/* 我的邀请码 */}
      <div className="glass-morphism rounded-3xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <FaShare className="mr-2 text-blue-500" />
          我的邀请码
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 font-mono text-lg">
            {currentUser?.inviteCode}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyInviteCode}
            className="bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors"
          >
            <FaCopy />
          </motion.button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          分享这个邀请码给朋友，他们就可以添加你为好友了！
        </p>
      </div>

      {/* 添加好友按钮 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowAddFriend(true)}
        className="w-full glass-morphism rounded-3xl p-6 text-center hover:bg-white/50 transition-all"
      >
        <FaPlus className="text-3xl text-blue-500 mx-auto mb-2" />
        <span className="text-lg font-semibold text-gray-800">添加好友</span>
      </motion.button>

      {/* 好友列表 */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <FaUserFriends className="mr-2 text-green-500" />
          我的好友 ({friends.length})
        </h3>
        
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FaUserFriends className="text-4xl mx-auto mb-2 opacity-50" />
            <p>还没有好友，快去添加一些吧！</p>
          </div>
        ) : (
          friends.map((friend) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-morphism rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  {friend.friendDisplayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{friend.friendDisplayName}</h4>
                  <p className="text-sm text-gray-600">@{friend.friendUsername}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRemoveFriend(friend)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <FaTrash />
              </motion.button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  const renderSharingTab = () => (
    <div className="space-y-6">
      {/* 分享药物按钮 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowShareMedication(true)}
        className="w-full glass-morphism rounded-3xl p-6 text-center hover:bg-white/50 transition-all"
        disabled={friends.length === 0 || medications.length === 0}
      >
        <FaShare className="text-3xl text-purple-500 mx-auto mb-2" />
        <span className="text-lg font-semibold text-gray-800">分享药物给好友</span>
        {(friends.length === 0 || medications.length === 0) && (
          <p className="text-sm text-gray-500 mt-1">
            {friends.length === 0 ? '需要先添加好友' : '需要先添加药物'}
          </p>
        )}
      </motion.button>

      {/* 我分享的药物 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">我分享的药物</h3>
        {sharedMedications.length === 0 ? (
          <p className="text-gray-500 text-center py-4">还没有分享任何药物</p>
        ) : (
          <div className="space-y-3">
            {sharedMedications.map((shared) => (
              <div key={shared.id} className="glass-morphism rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: shared.medication.color }}
                    >
                      <FaPills className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{shared.medication.name}</h4>
                      <p className="text-sm text-gray-600">分享给: {shared.sharedWithUsername}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleStopSharing(shared.id!)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <FaTimes />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 好友分享给我的药物 */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">好友分享的药物</h3>
        {friendsSharedMeds.length === 0 ? (
          <p className="text-gray-500 text-center py-4">好友还没有分享药物给你</p>
        ) : (
          <div className="space-y-3">
            {friendsSharedMeds.map((shared) => (
              <div key={shared.id} className="glass-morphism rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: shared.medication.color }}
                    >
                      <FaPills className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{shared.medication.name}</h4>
                      <p className="text-sm text-gray-600">
                        来自: {shared.friendInfo.friendDisplayName} • {shared.medication.reminderTime}
                      </p>
                    </div>
                  </div>
                  {shared.canRemind && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSendReminder(shared)}
                      className="bg-orange-500 text-white px-3 py-2 rounded-xl hover:bg-orange-600 transition-colors"
                    >
                      <FaBell className="mr-1" />
                      提醒
                    </motion.button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderRemindersTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">收到的提醒</h3>
      {reminders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaBell className="text-4xl mx-auto mb-2 opacity-50" />
          <p>还没有收到好友提醒</p>
        </div>
      ) : (
        reminders.map((reminder) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass-morphism rounded-2xl p-4 ${!reminder.readAt ? 'border-l-4 border-orange-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <FaHeart className="text-red-500" />
                  <span className="font-semibold text-gray-800">
                    来自 {reminder.fromUsername}
                  </span>
                  {!reminder.readAt && (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      新消息
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mb-1">
                  <strong>{reminder.medicationName}</strong>: {reminder.reminderMessage}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(reminder.sentAt).toLocaleString()}
                </p>
              </div>
              {!reminder.readAt && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => ReminderService.markReminderAsRead(reminder.id!).then(loadReminders)}
                  className="text-green-500 hover:text-green-600"
                >
                  <FaCheck />
                </motion.button>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl text-white font-semibold ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标签页导航 */}
      <div className="glass-morphism rounded-3xl p-2">
        <div className="flex space-x-2">
          {[
            { id: 'friends', label: '好友', icon: FaUserFriends },
            { id: 'sharing', label: '分享', icon: FaShare },
            { id: 'reminders', label: '提醒', icon: FaBell },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <tab.icon className="text-sm" />
              <span className="font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 标签页内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'friends' && renderFriendsTab()}
          {activeTab === 'sharing' && renderSharingTab()}
          {activeTab === 'reminders' && renderRemindersTab()}
        </motion.div>
      </AnimatePresence>

      {/* 添加好友弹窗 */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddFriend(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">添加好友</h3>
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    输入好友的邀请码
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="例如: demo123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    你可以尝试使用 demo123, demo456 或 demo789
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddFriend}
                  disabled={loading || !inviteCode.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '添加中...' : '添加好友'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 分享药物弹窗 */}
      <AnimatePresence>
        {showShareMedication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowShareMedication(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">分享药物</h3>
                <button
                  onClick={() => setShowShareMedication(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择要分享的药物
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {medications.map((med) => (
                      <motion.button
                        key={med.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShareTargetMed(med)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          shareTargetMed?.id === med.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: med.color }}
                          >
                            <FaPills className="text-white text-sm" />
                          </div>
                          <div>
                            <div className="font-semibold">{med.name}</div>
                            <div className="text-sm text-gray-600">{med.dosage}</div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {shareTargetMed && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择要分享给谁
                    </label>
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <motion.button
                          key={friend.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleShareMedication(shareTargetMed.id!, friend.id!, true)}
                          className="w-full p-3 rounded-xl border border-gray-200 hover:border-purple-300 text-left transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                              {friend.friendDisplayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold">{friend.friendDisplayName}</div>
                              <div className="text-sm text-gray-600">@{friend.friendUsername}</div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendsPage;