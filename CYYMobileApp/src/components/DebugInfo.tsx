import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { flipperLog } from '../utils/flipper';
import { Database } from '../utils/database';

interface DebugInfoProps {
  visible: boolean;
  onClose: () => void;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ visible, onClose }) => {
  const [dataInfo, setDataInfo] = useState<any>(null);

  const loadDebugData = async () => {
    try {
      const medications = await Database.getMedications();
      const logs = await Database.getMedicationLogs();
      const settings = await Database.getSettings();
      
      setDataInfo({
        medications: medications.length,
        logs: logs.length,
        settings: Object.keys(settings).length,
        env: __DEV__ ? 'Development' : 'Production',
        timestamp: new Date().toISOString(),
      });
      
      flipperLog.info('Debug info loaded', {
        medicationsCount: medications.length,
        logsCount: logs.length,
        settingsKeys: Object.keys(settings).length,
      });
    } catch (error) {
      flipperLog.error('Error loading debug data', error);
    }
  };

  const testFlipperLogging = () => {
    flipperLog.info('Test info message', { test: true, timestamp: Date.now() });
    flipperLog.warn('Test warning message', { level: 'warning' });
    flipperLog.error('Test error message', new Error('This is a test error'));
    flipperLog.database('TEST_OPERATION', 'test_table', { action: 'test' });
    flipperLog.navigation('TEST_NAVIGATION', 'TestScreen', { param: 'test' });
    flipperLog.notification('TEST_NOTIFICATION', { type: 'test' });
    
    Alert.alert('Test Complete', 'Check Flipper logs for test messages');
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all medications, logs, and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Database.clearAllData();
              flipperLog.info('All data cleared via debug panel');
              Alert.alert('Success', 'All data cleared');
              loadDebugData();
            } catch (error) {
              flipperLog.error('Error clearing data', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  React.useEffect(() => {
    if (visible) {
      loadDebugData();
    }
  }, [visible]);

  if (!__DEV__) {
    return null; // Don't show debug info in production
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🐛 Debug Information</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Environment Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Environment</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>Mode: {dataInfo?.env || 'Loading...'}</Text>
              <Text style={styles.infoText}>Timestamp: {dataInfo?.timestamp || 'Loading...'}</Text>
              <Text style={styles.infoText}>Flipper: {__DEV__ ? 'Available' : 'Not Available'}</Text>
            </View>
          </View>

          {/* Data Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Database Status</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>Medications: {dataInfo?.medications || 0}</Text>
              <Text style={styles.infoText}>Logs: {dataInfo?.logs || 0}</Text>
              <Text style={styles.infoText}>Settings: {dataInfo?.settings || 0} keys</Text>
            </View>
          </View>

          {/* Debug Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={testFlipperLogging}>
              <Icon name="bug-report" size={20} color="#6C5CE7" />
              <Text style={styles.actionText}>Test Flipper Logging</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={loadDebugData}>
              <Icon name="refresh" size={20} color="#4CAF50" />
              <Text style={styles.actionText}>Refresh Debug Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={clearAllData}>
              <Icon name="delete-forever" size={20} color="#FF6B6B" />
              <Text style={[styles.actionText, styles.dangerText]}>Clear All Data</Text>
            </TouchableOpacity>
          </View>

          {/* Flipper Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flipper Usage</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>1. Install Flipper: make flipper-install</Text>
              <Text style={styles.infoText}>2. Open Flipper: make flipper</Text>
              <Text style={styles.infoText}>3. Connect to simulator/device</Text>
              <Text style={styles.infoText}>4. View logs, database, network, etc.</Text>
            </View>
          </View>

          {/* Makefile Commands */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Useful Commands</Text>
            <View style={styles.infoCard}>
              <Text style={styles.codeText}>make debug-ios</Text>
              <Text style={styles.codeText}>make debug-android</Text>
              <Text style={styles.codeText}>make flipper</Text>
              <Text style={styles.codeText}>make clear-cache</Text>
              <Text style={styles.codeText}>make debug-info</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: '#333',
    backgroundColor: '#F5F5F5',
    padding: 4,
    marginBottom: 4,
    borderRadius: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dangerButton: {
    backgroundColor: '#FFEBEE',
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerText: {
    color: '#FF6B6B',
  },
});

export default DebugInfo;