import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaVolumeUp, FaMoon, FaSun, FaTrash, FaHeart, FaShieldAlt, FaSignOutAlt, FaUserFriends, FaEye, FaEyeSlash } from 'react-icons/fa';
import { requestNotificationPermission, playSound, vibrate } from '../utils/notifications';
import { db } from '../db/database';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [friendNotifications, setFriendNotifications] = useState(true);
  const [shareByDefault, setShareByDefault] = useState(false);

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

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        vibrate();
      } catch (error) {
        console.error('Failed to logout:', error);
      }
    }
  };

  const settingsGroups = [
    {
      title: 'Account',
      icon: FaUserFriends,
      items: [
        {
          id: 'profile',
          label: user?.name || 'User',
          description: user?.email || 'user@example.com',
          type: 'info',
          icon: FaUserFriends,
        },
      ],
    },
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
        {
          id: 'friendNotifications',
          label: 'Friend Reminders',
          description: 'Receive notifications from friends',
          enabled: friendNotifications,
          onToggle: () => setFriendNotifications(!friendNotifications),
          icon: FaUserFriends,
        },
      ],
    },
    {
      title: 'Privacy',
      icon: FaShieldAlt,
      items: [
        {
          id: 'shareByDefault',
          label: 'Auto-share with Friends',
          description: 'New medications are shared by default',
          enabled: shareByDefault,
          onToggle: () => setShareByDefault(!shareByDefault),
          icon: shareByDefault ? FaEye : FaEyeSlash,
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

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800 mb-6"
      >
        Settings
      </motion.h2>

      {/* Friend Code Display */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Your Friend Code</h3>
              <p className="text-2xl font-mono font-bold text-primary-600 mt-1">{user.friendCode}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p>Share this code</p>
              <p>to connect with friends</p>
            </div>
          </div>
        </motion.div>
      )}

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
                        'type' in item && item.type === 'info' 
                          ? 'bg-gradient-to-br from-purple-400 to-pink-400'
                          : item.enabled 
                          ? 'bg-gradient-to-r from-primary-400 to-primary-500' 
                          : 'bg-gray-300'
                      }`}
                    >
                      <item.icon className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{item.label}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  {'onToggle' in item && (
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
                  )}
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

        {/* Logout Button */}
        {user && (
          <button
            onClick={handleLogout}
            className="w-full glass-morphism rounded-2xl p-4 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <FaSignOutAlt className="text-orange-500 text-sm" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Logout</h4>
                  <p className="text-sm text-gray-600">Sign out of your account</p>
                </div>
              </div>
            </div>
          </button>
        )}
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
    </div>
  );
};

export default Settings;