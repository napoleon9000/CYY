import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Database } from '../utils/database';
import { flipperLog } from '../utils/flipper';
import DebugInfo from '../components/DebugInfo';
import CollapsibleHeader from '../components/CollapsibleHeader';
import { GRADIENTS } from '../constants/colors';
import { AppSettings } from '../types';

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    reminderSnoozeMinutes: 5,
    darkMode: false,
    reminderPersistence: true,
  });
  const [loading, setLoading] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Animated values for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flipperLog.navigation('SCREEN_LOAD', 'SettingsScreen');
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await Database.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await Database.saveSettings(newSettings);
    } catch (error) {
      console.error('Error saving setting:', error);
      // Revert on error
      setSettings(prevSettings => prevSettings);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all medication data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Database.clearAllData();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const settingsGroups = [
    {
      title: 'Notifications',
      icon: 'notifications',
      items: [
        {
          key: 'notificationsEnabled',
          label: 'Push Notifications',
          description: 'Receive alerts for medication reminders',
          icon: 'notifications',
          type: 'toggle',
          value: settings.notificationsEnabled,
        },
        {
          key: 'soundEnabled',
          label: 'Sound Alerts',
          description: 'Play sound when reminder triggers',
          icon: 'volume-up',
          type: 'toggle',
          value: settings.soundEnabled,
        },
        {
          key: 'vibrationEnabled',
          label: 'Vibration',
          description: 'Vibrate device for alerts',
          icon: 'phone-android',
          type: 'toggle',
          value: settings.vibrationEnabled,
        },
      ],
    },
    {
      title: 'Appearance',
      icon: 'palette',
      items: [
        {
          key: 'darkMode',
          label: 'Dark Mode',
          description: 'Switch to dark theme (Coming soon)',
          icon: 'brightness-4',
          type: 'toggle',
          value: settings.darkMode,
          disabled: true,
        } as const,
      ],
    },
    {
      title: 'Reminders',
      icon: 'alarm',
      items: [
        {
          key: 'reminderPersistence',
          label: 'Persistent Reminders',
          description: 'Keep reminders until marked as taken',
          icon: 'alarm-on',
          type: 'toggle',
          value: settings.reminderPersistence,
        },
      ],
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.SETTINGS}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.loadingHeader}
        >
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CollapsibleHeader colors={GRADIENTS.SETTINGS} scrollY={scrollY}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your experience</Text>
      </CollapsibleHeader>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {settingsGroups.map((group, groupIndex) => (
          <View key={group.title} style={styles.settingsGroup}>
            <View style={styles.groupHeader}>
              <Icon name={group.icon} size={20} color="#666" />
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>

            {group.items.map((item) => (
              <View key={item.key} style={[styles.settingItem, 'disabled' in item && item.disabled && styles.settingItemDisabled]}>
                <View style={styles.settingInfo}>
                  <View style={[
                    styles.settingIcon,
                    { backgroundColor: item.value ? '#6C5CE7' : '#E0E0E0' }
                  ]}>
                    <Icon 
                      name={item.icon} 
                      size={20} 
                      color={item.value ? 'white' : '#999'} 
                    />
                  </View>
                  <View style={styles.settingDetails}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                </View>
                
                {item.type === 'toggle' && (
                  <Switch
                    value={item.value as boolean}
                    onValueChange={(value) => updateSetting(item.key as keyof AppSettings, value)}
                    trackColor={{ false: '#E0E0E0', true: '#6C5CE7' }}
                    thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
                    disabled={'disabled' in item ? item.disabled : false}
                  />
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Data Management */}
        <View style={styles.settingsGroup}>
          <View style={styles.groupHeader}>
            <Icon name="storage" size={20} color="#666" />
            <Text style={styles.groupTitle}>Data Management</Text>
          </View>

          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearData}
          >
            <View style={styles.settingInfo}>
              <View style={styles.dangerIcon}>
                <Icon name="delete-forever" size={20} color="#FF6B6B" />
              </View>
              <View style={styles.settingDetails}>
                <Text style={styles.dangerLabel}>Clear All Data</Text>
                <Text style={styles.settingDescription}>Remove all medications and history</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <View style={styles.aboutCard}>
            <Icon name="favorite" size={40} color="#FF6B6B" style={styles.aboutIcon} />
            <Text style={styles.aboutTitle}>CYY</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Made with ❤️ for your health
            </Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>100%</Text>
              <Text style={styles.statLabel}>Privacy Focused</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>∞</Text>
              <Text style={styles.statLabel}>Free Forever</Text>
            </View>
          </View>
        </View>

        {/* Debug Section (Development Only) */}
        {__DEV__ && (
          <View style={styles.settingsGroup}>
            <View style={styles.groupHeader}>
              <Icon name="bug-report" size={20} color="#666" />
              <Text style={styles.groupTitle}>Developer Tools</Text>
            </View>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => {
                flipperLog.info('Debug panel opened');
                setShowDebugInfo(true);
              }}
            >
              <View style={styles.settingInfo}>
                <View style={styles.debugIcon}>
                  <Icon name="developer-mode" size={20} color="#6C5CE7" />
                </View>
                <View style={styles.settingDetails}>
                  <Text style={styles.debugLabel}>Debug Information</Text>
                  <Text style={styles.settingDescription}>View debug info, test Flipper logging</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#6C5CE7" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Debug Info Modal */}
      <DebugInfo 
        visible={showDebugInfo} 
        onClose={() => setShowDebugInfo(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 140, // Account for collapsible header
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  settingsGroup: {
    marginBottom: 32,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingDetails: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  aboutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  aboutCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  aboutIcon: {
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6C5CE7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  debugIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  debugLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C5CE7',
  },
});

export default SettingsScreen;