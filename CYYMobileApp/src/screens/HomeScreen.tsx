import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Database } from '../utils/database';
import { scheduleWeeklyReminders } from '../utils/notifications';
import { flipperLog } from '../utils/flipper';
import { formatTime } from '../utils/timeUtils';
import { getDayAbbreviation } from '../utils/dateUtils';
import { GRADIENTS } from '../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS, PERFORMANCE } from '../utils/constants';
import CollapsibleHeader from '../components/CollapsibleHeader';
import { Medication } from '../types';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animated values for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      flipperLog.navigation('SCREEN_FOCUS', 'HomeScreen');
      loadMedications();
    }, [])
  );

  const loadMedications = useCallback(async (isRefreshing = false) => {
    try {
      flipperLog.database('LOAD', 'medications', { isRefreshing });
      const meds = await Database.getMedications();
      setMedications(meds);
      flipperLog.info('Medications loaded', { count: meds.length });
    } catch (error) {
      flipperLog.error('Error loading medications', error);
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadMedications(true);
  }, []);

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

  const editMedication = (medication: Medication) => {
    flipperLog.navigation('NAVIGATE_TO_EDIT', 'AddMedication', { medicationId: medication.id });
    navigation.navigate('AddMedication' as never, { medication } as never);
  };

  const viewMedicationDetails = (medicationId: string) => {
    flipperLog.navigation('NAVIGATE_TO_DETAILS', 'MedicationDetails', { medicationId });
    navigation.navigate('MedicationDetails' as never, { medicationId } as never);
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


  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.HOME}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.loadingHeader}
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
      <CollapsibleHeader colors={GRADIENTS.HOME} scrollY={scrollY}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>CYY</Text>
            <Text style={styles.headerSubtitle}>💊 Medication Reminder</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
      </CollapsibleHeader>
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={PERFORMANCE.SCROLL_THROTTLE}
      >
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
                <TouchableOpacity
                  onPress={() => viewMedicationDetails(medication.id)}
                  style={styles.medicationCardContent}
                  activeOpacity={0.7}
                >
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
                        onPress={() => editMedication(medication)}
                        style={styles.actionButton}
                      >
                        <Icon name="edit" size={24} color="#f6d55c" />
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
                      <Text style={styles.notificationText}>{medication.notificationTypes?.join(', ') || 'notification'}</Text>
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
                </TouchableOpacity>
                
                {/* Tap to view details hint */}
                <View style={styles.detailsHint}>
                  <Icon name="info" size={14} color="#999" />
                  <Text style={styles.detailsHintText}>Tap to view details</Text>
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
    paddingTop: 140, // Account for header height
    paddingHorizontal: 20,
  },
  loadingHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
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
    borderRadius: BORDER_RADIUS.LARGE,
    marginBottom: SPACING.MEDIUM,
    ...SHADOWS.MEDIUM,
  },
  medicationCardContent: {
    padding: SPACING.LARGE,
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
  detailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderBottomLeftRadius: BORDER_RADIUS.LARGE,
    borderBottomRightRadius: BORDER_RADIUS.LARGE,
  },
  detailsHintText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
    fontStyle: 'italic',
  },
});

export default HomeScreen;