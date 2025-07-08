import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaVolumeUp, FaMoon, FaSun, FaTrash, FaHeart, FaShieldAlt } from 'react-icons/fa';
import { requestNotificationPermission, playSound, vibrate, showNotification } from '../utils/notifications';
import { db } from '../db/database';
import { useAuthUid } from '../hooks/useAuth';
import { addFriend, getFriends } from '../utils/cloud';

const Settings: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const uid = useAuthUid();
  const [friends, setFriends] = useState<string[]>([]);

  // Load friends list when uid ready
  useEffect(() => {
    if (!uid) return;
    getFriends(uid).then(setFriends).catch(console.error);
  }, [uid]);

  // Handle addFriend query param
  useEffect(() => {
    if (!uid) return;
    const params = new URLSearchParams(window.location.search);
    const friendId = params.get('addFriend');
    if (friendId && friendId !== uid) {
      addFriend(uid, friendId)
        .then(() => {
          showNotification('Friend added', { body: 'You are now connected with a new friend!' });
          setFriends((prev: string[]) => Array.from(new Set([...(prev || []), friendId])));
        })
        .catch(console.error);
    }
  }, [uid]);

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        vibrate();
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      playSound('gentle');
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all medication data? This cannot be undone.')) {
      try {
        await db.medications.clear();
        await db.medicationLogs.clear();
        await db.notifications.clear();
        vibrate([100, 50, 100]);
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
      }
    }
  };

  const settingsGroups = [
    {
      title: 'Notifications',
      icon: FaBell,
      items: [
        {
          id: 'notifications',
          label: 'Push Notifications',
          description: 'Receive alerts for medication reminders',
          enabled: notificationsEnabled,
          onToggle: handleNotificationToggle,
          icon: FaBell,
        },
        {
          id: 'sound',
          label: 'Sound Alerts',
          description: 'Play sound when reminder triggers',
          enabled: soundEnabled,
          onToggle: handleSoundToggle,
          icon: FaVolumeUp,
        },
      ],
    },
    {
      title: 'Appearance',
      icon: FaSun,
      items: [
        {
          id: 'darkMode',
          label: 'Dark Mode',
          description: 'Switch to dark theme (Coming soon)',
          enabled: darkMode,
          onToggle: () => setDarkMode(!darkMode),
          icon: darkMode ? FaMoon : FaSun,
          disabled: true,
        },
      ],
    },
  ];

  // Friend management UI cards to render below other settings
  const renderFriendsSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Friends</h3>
      <div className="glass-morphism rounded-2xl p-4">
        <p className="text-sm text-gray-700 mb-2">Share this link with friends so they can add you:</p>
        <div className="flex items-center space-x-2">
          <input
            readOnly
            className="flex-1 text-xs px-2 py-1 bg-gray-100 rounded-md"
            value={`${window.location.origin}?addFriend=${uid || ''}`}
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}?addFriend=${uid || ''}`);
              showNotification('Copied', { body: 'Link copied to clipboard' });
            }}
            className="button-primary text-xs py-1 px-3"
          >Copy</button>
        </div>
      </div>

      <div className="glass-morphism rounded-2xl p-4">
        <h4 className="font-medium text-gray-800 mb-2">Your Friends ({friends.length})</h4>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500">No friends yet.</p>
        ) : (
          <ul className="text-sm list-disc pl-4 space-y-1">
            {friends.map((fid) => (
              <li key={fid} className="break-all">{fid}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800 mb-6"
      >
        Settings
      </motion.h2>

      {/* Settings Groups */}
      {settingsGroups.map((group, groupIndex) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
        >
          <div className="flex items-center space-x-2 mb-4">
            <group.icon className="text-lg text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-700">{group.title}</h3>
          </div>

          <div className="space-y-3">
            {group.items.map((item, itemIndex) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05 }}
                className={`glass-morphism rounded-2xl p-4 ${'disabled' in item && item.disabled ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.enabled ? 'bg-gradient-to-r from-primary-400 to-primary-500' : 'bg-gray-300'
                      }`}
                    >
                      <item.icon className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{item.label}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={item.onToggle}
                    disabled={'disabled' in item && item.disabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.enabled ? 'bg-primary-500' : 'bg-gray-300'
                    } ${'disabled' in item && item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <motion.span
                      animate={{ x: item.enabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-gray-700 flex items-center space-x-2">
          <FaShieldAlt className="text-gray-600" />
          <span>Data Management</span>
        </h3>

        <button
          onClick={handleClearData}
          className="w-full glass-morphism rounded-2xl p-4 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <FaTrash className="text-red-500 text-sm" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Clear All Data</h4>
                <p className="text-sm text-gray-600">Remove all medications and history</p>
              </div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* About Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-morphism rounded-3xl p-6 text-center"
      >
        <FaHeart className="text-3xl text-pink-500 mx-auto mb-3 animate-pulse-slow" />
        <h3 className="font-bold text-gray-800 mb-2">CYY</h3>
        <p className="text-sm text-gray-600 mb-1">Version 1.0.0</p>
        <p className="text-xs text-gray-500">Made with love for your health</p>
      </motion.div>

      {/* Info Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="glass-morphism rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold gradient-text">100%</div>
          <p className="text-xs text-gray-600 mt-1">Privacy Focused</p>
        </div>
        <div className="glass-morphism rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold gradient-text">∞</div>
          <p className="text-xs text-gray-600 mt-1">Free Forever</p>
        </div>
      </motion.div>

      {/* Friend management */}
      {renderFriendsSection()}
    </div>
  );
};

export default Settings;