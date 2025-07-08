import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUserFriends, 
  FaUserPlus, 
  FaShare, 
  FaLink,
  FaCopy,
  FaCheck,
  FaBell,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaPills,
  FaClock
} from 'react-icons/fa';
import { db, Friend, Medication, SharedMedication, FriendReminder, User } from '../db/database';
import { friendAPI, reminderAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const Friends: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'shared' | 'reminders'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [sharedMedications, setSharedMedications] = useState<SharedMedication[]>([]);
  const [reminders, setReminders] = useState<FriendReminder[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<number | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load friends
      const localFriends = await db.friends.where('userId').equals(user.userId).toArray();
      const apiFriends = await friendAPI.getFriends();
      setFriends([...localFriends, ...apiFriends]);

      // Load medications
      const meds = await db.medications.toArray();
      setMedications(meds);

      // Load shared medications
      const shared = await db.sharedMedications.toArray();
      setSharedMedications(shared);

      // Load reminders
      const localReminders = await db.friendReminders.where('toUserId').equals(user.userId).toArray();
      const apiReminders = await reminderAPI.getReminders();
      setReminders([...localReminders, ...apiReminders]);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleAddFriend = async () => {
    if (!friendCode.trim() || !user) return;
    
    setIsLoading(true);
    try {
      const friend = await friendAPI.addFriend(friendCode.toUpperCase());
      await db.friends.add(friend);
      setFriends([...friends, friend]);
      setShowAddFriend(false);
      setFriendCode('');
    } catch (error) {
      console.error('Failed to add friend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyFriendLink = () => {
    if (!user) return;
    
    const link = `${window.location.origin}/add-friend/${user.friendCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareMedication = async () => {
    if (!selectedMedication || selectedFriends.length === 0) return;
    
    setIsLoading(true);
    try {
      await friendAPI.shareMedication(selectedMedication, selectedFriends);
      
      // Update local database
      const existing = await db.sharedMedications.where('medicationId').equals(selectedMedication).first();
      if (existing) {
        await db.sharedMedications.update(existing.id!, {
          sharedWithUserIds: [...existing.sharedWithUserIds, ...selectedFriends]
        });
      } else {
        await db.sharedMedications.add({
          medicationId: selectedMedication,
          sharedWithUserIds: selectedFriends,
          sharedAt: new Date()
        });
      }
      
      await loadData();
      setSelectedMedication(null);
      setSelectedFriends([]);
    } catch (error) {
      console.error('Failed to share medication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (friendId: string, medicationName: string) => {
    if (!user) return;
    
    try {
      const reminder = await reminderAPI.sendReminder(
        friendId,
        0, // medicationId - would need to be passed properly
        medicationName,
        `Hey! Don't forget to take your ${medicationName}! 💊`,
        'missed'
      );
      
      // Show success notification
      alert('Reminder sent!');
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  const renderFriendsTab = () => (
    <div className="space-y-4">
      {/* Friend Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6 rounded-2xl"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaLink className="mr-2 text-primary-500" />
          Your Friend Code
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-mono text-lg text-center">
            {user?.friendCode || 'Loading...'}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={copyFriendLink}
            className="p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            {copied ? <FaCheck /> : <FaCopy />}
          </motion.button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Share this code with friends to connect!
        </p>
      </motion.div>

      {/* Add Friend Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowAddFriend(true)}
        className="w-full p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl shadow-lg flex items-center justify-center space-x-2"
      >
        <FaUserPlus className="text-xl" />
        <span className="font-semibold">Add Friend</span>
      </motion.button>

      {/* Friends List */}
      <div className="space-y-3">
        {friends.map((friend) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-morphism p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                {friend.friendName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold">{friend.friendName}</h4>
                <p className="text-sm text-gray-600">
                  {friend.status === 'pending' ? 'Pending' : 'Connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {friend.sharedWithMe.length > 0 && (
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {friend.sharedWithMe.length} shared
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {friends.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FaUserFriends className="text-4xl mx-auto mb-2 opacity-50" />
          <p>No friends yet. Add some friends to share medications!</p>
        </div>
      )}
    </div>
  );

  const renderSharedTab = () => (
    <div className="space-y-4">
      {/* Share Medication Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6 rounded-2xl"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaShare className="mr-2 text-primary-500" />
          Share Your Medications
        </h3>
        
        {/* Medication Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Medication to Share
          </label>
          <select
            value={selectedMedication || ''}
            onChange={(e) => setSelectedMedication(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Choose a medication...</option>
            {medications.map((med) => (
              <option key={med.id} value={med.id}>
                {med.name} - {med.dosage}
              </option>
            ))}
          </select>
        </div>

        {/* Friend Selector */}
        {selectedMedication && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share with Friends
            </label>
            <div className="space-y-2">
              {friends.filter(f => f.status === 'accepted').map((friend) => (
                <label key={friend.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.friendId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFriends([...selectedFriends, friend.friendId]);
                      } else {
                        setSelectedFriends(selectedFriends.filter(id => id !== friend.friendId));
                      }
                    }}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span>{friend.friendName}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShareMedication}
          disabled={!selectedMedication || selectedFriends.length === 0 || isLoading}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sharing...' : 'Share Medication'}
        </motion.button>
      </motion.div>

      {/* Shared Medications List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Shared Medications</h3>
        {sharedMedications.map((shared) => {
          const medication = medications.find(m => m.id === shared.medicationId);
          if (!medication) return null;
          
          return (
            <motion.div
              key={shared.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-morphism p-4 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{medication.name}</h4>
                  <p className="text-sm text-gray-600">{medication.dosage}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Shared with {shared.sharedWithUserIds.length} friend(s)
                  </p>
                </div>
                <FaEye className="text-green-500 text-xl" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderRemindersTab = () => (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <motion.div
          key={reminder.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-morphism p-4 rounded-xl ${!reminder.read ? 'border-2 border-primary-400' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold flex items-center">
                <FaBell className="mr-2 text-primary-500" />
                {reminder.fromUserName}
              </h4>
              <p className="text-gray-700 mt-1">{reminder.message}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(reminder.receivedAt).toLocaleString()}
              </p>
            </div>
            {!reminder.read && (
              <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                New
              </span>
            )}
          </div>
        </motion.div>
      ))}

      {reminders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FaBell className="text-4xl mx-auto mb-2 opacity-50" />
          <p>No reminders yet</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">Friends & Sharing</h1>
        <p className="text-gray-600">Connect with friends and share medication reminders</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {(['friends', 'shared', 'reminders'] as const).map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'glass-morphism text-gray-700 hover:bg-white/70'
            }`}
          >
            {tab === 'friends' && <FaUserFriends className="inline mr-2" />}
            {tab === 'shared' && <FaShare className="inline mr-2" />}
            {tab === 'reminders' && <FaBell className="inline mr-2" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'friends' && renderFriendsTab()}
          {activeTab === 'shared' && renderSharedTab()}
          {activeTab === 'reminders' && renderRemindersTab()}
        </motion.div>
      </AnimatePresence>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddFriend(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Add Friend</h3>
              <p className="text-gray-600 mb-4">
                Enter your friend's code to connect
              </p>
              <input
                type="text"
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value)}
                placeholder="Enter friend code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                maxLength={6}
              />
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddFriend}
                  disabled={isLoading || !friendCode.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Friend'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddFriend(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Friends;