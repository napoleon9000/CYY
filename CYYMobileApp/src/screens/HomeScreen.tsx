import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Database } from '../utils/database';
import { scheduleWeeklyReminders } from '../utils/notifications';
import { flipperLog } from '../utils/flipper';
import { Medication } from '../types';

const HomeScreen: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    flipperLog.navigation('SCREEN_LOAD', 'HomeScreen');
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const meds = await Database.getMedications();
      setMedications(meds);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMedication = async (id: string, isActive: boolean) => {
    flipperLog.info('Toggle medication', { id, currentState: isActive, newState: !isActive });
    try {
      const medication = await Database.getMedicationById(id);
      if (medication) {
        const updatedMedication = { ...medication, isActive: !isActive, updatedAt: new Date() };
        await Database.saveMedication(updatedMedication);
        
        // Schedule or cancel notifications based on the new state
        if (updatedMedication.isActive) {
          scheduleWeeklyReminders(updatedMedication);
          flipperLog.notification('SCHEDULED', { medicationId: id, name: medication.name });
        } else {
          flipperLog.notification('CANCELLED', { medicationId: id, name: medication.name });
          console.log(`Notifications disabled for ${medication.name}`);
        }
        
        loadMedications();
      }
    } catch (error) {
      flipperLog.error('Error toggling medication', error);
      console.error('Error toggling medication:', error);
    }
  };

  const deleteMedication = async (id: string, name: string) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Database.deleteMedication(id);
              loadMedications();
            } catch (error) {
              console.error('Error deleting medication:', error);
            }
          }
        }
      ]
    );
  };

  const getDayAbbreviation = (day: number) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[day];
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>CYY</Text>
          <Text style={styles.headerSubtitle}>💊 Medication Reminder</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading medications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>CYY</Text>
            <Text style={styles.headerSubtitle}>💊 Medication Reminder</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="local-pharmacy" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No Medications Yet</Text>
            <Text style={styles.emptyDescription}>
              Tap the + button to add your first medication reminder
            </Text>
          </View>
        ) : (
          <View style={styles.medicationList}>
            <Text style={styles.sectionTitle}>Your Medications</Text>
            {medications.map((medication) => (
              <View key={medication.id} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationInfo}>
                    <View style={[styles.medicationIcon, { backgroundColor: medication.color }]}>
                      <Icon name="local-pharmacy" size={24} color="white" />
                    </View>
                    <View style={styles.medicationDetails}>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    </View>
                  </View>
                  <View style={styles.medicationActions}>
                    <TouchableOpacity
                      onPress={() => toggleMedication(medication.id, medication.isActive)}
                      style={styles.actionButton}
                    >
                      <Icon 
                        name={medication.isActive ? 'toggle-on' : 'toggle-off'} 
                        size={32} 
                        color={medication.isActive ? '#4CAF50' : '#BDBDBD'} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteMedication(medication.id, medication.name)}
                      style={styles.actionButton}
                    >
                      <Icon name="delete" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.medicationFooter}>
                  <View style={styles.timeSection}>
                    <Icon name="access-time" size={16} color="#666" />
                    <Text style={styles.timeText}>{formatTime(medication.reminderTime)}</Text>
                  </View>
                  
                  <View style={styles.notificationSection}>
                    <Icon name="notifications" size={16} color="#666" />
                    <Text style={styles.notificationText}>{medication.notificationType}</Text>
                  </View>
                </View>
                
                <View style={styles.daysSection}>
                  {[0, 1, 2, 3, 4, 5, 6].map(day => (
                    <View
                      key={day}
                      style={[
                        styles.dayChip,
                        medication.reminderDays.includes(day) && styles.dayChipActive
                      ]}
                    >
                      <Text style={[
                        styles.dayChipText,
                        medication.reminderDays.includes(day) && styles.dayChipTextActive
                      ]}>
                        {getDayAbbreviation(day)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  medicationList: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  medicationCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  medicationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 12,
  },
  medicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  notificationSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  daysSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: '#6C5CE7',
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
  },
  dayChipTextActive: {
    color: 'white',
  },
});

export default HomeScreen;