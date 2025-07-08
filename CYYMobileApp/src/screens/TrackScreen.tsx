import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Alert, PanResponder, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { Database } from '../utils/database';
import { flipperLog } from '../utils/flipper';
import { formatTime, formatTimeFromDate } from '../utils/timeUtils';
import { formatDateForDisplay } from '../utils/dateUtils';
import { GRADIENTS } from '../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS, PERFORMANCE, ANIMATION_DURATIONS, SWIPE_THRESHOLDS } from '../utils/constants';
import CollapsibleHeader from '../components/CollapsibleHeader';
import { CameraModal } from '../components/CameraModal';
import { PhotoThumbnail } from '../components/PhotoThumbnail';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { notificationStateManager, NotificationCameraRequest } from '../utils/notificationState';
import { Medication, MedicationLog, UpcomingMedication, GroupedMedicationLogs } from '../types';

interface SwipeableLogItemProps {
  log: MedicationLog;
  medication: Medication;
  onDelete: (logId: string, medicationName: string) => void;
  onPhotoPress?: (photoUri: string, medicationName: string, photoTakenAt?: Date) => void;
}

const SwipeableLogItem: React.FC<SwipeableLogItemProps> = ({ log, medication, onDelete, onPhotoPress }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const deleteButtonWidth = 80;
  const swipeThreshold = 60; // Minimum swipe distance to show delete button

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          const clampedValue = Math.max(gestureState.dx, -deleteButtonWidth);
          translateX.setValue(clampedValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -swipeThreshold) {
          // Show delete button
          setIsDeleteVisible(true);
          Animated.spring(translateX, {
            toValue: -deleteButtonWidth,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back to closed position
          setIsDeleteVisible(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDeletePress = () => {
    // Animate out before deleting
    Animated.timing(translateX, {
      toValue: -400,
      duration: ANIMATION_DURATIONS.QUICK,
      useNativeDriver: true,
    }).start(() => {
      onDelete(log.id, medication.name);
    });
  };

  const handleMainPress = () => {
    if (isDeleteVisible) {
      // Close delete button if it's visible
      setIsDeleteVisible(false);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.swipeableContainer}>
      {/* Delete button */}
      {isDeleteVisible && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeletePress}
          activeOpacity={0.7}
        >
          <Icon name="delete" size={24} color="white" />
        </TouchableOpacity>
      )}
      
      {/* Main log item */}
      <Animated.View
        style={[
          styles.logItemAnimated,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.logItemContent}
          onPress={handleMainPress}
          activeOpacity={1}
        >
        <View style={styles.logIcon}>
          <Icon 
            name={log.status === 'taken' ? 'check-circle' : 'cancel'} 
            size={20} 
            color={log.status === 'taken' ? '#4CAF50' : '#FF6B6B'} 
          />
        </View>
        <View style={styles.logDetails}>
          <Text style={styles.logMedication}>{medication.name}</Text>
          <Text style={styles.logTime}>
            {log.status === 'taken' && log.actualTime ? 
              `Taken at ${formatTimeFromDate(log.actualTime)}` :
              log.status === 'skipped' ? 
              `Skipped at ${formatTimeFromDate(log.createdAt)}` :
              'No time recorded'
            }
          </Text>
          {log.scheduledTime && (
            <Text style={styles.logScheduledTime}>
              Scheduled: {formatTime(medication.reminderTime)}
            </Text>
          )}
        </View>
        <View style={styles.logStatus}>
          {log.photoUri && onPhotoPress && (
            <PhotoThumbnail
              photoUri={log.photoUri}
              size={32}
              onPress={() => onPhotoPress(log.photoUri!, medication.name, log.actualTime)}
            />
          )}
          <Text style={[
            styles.logStatusText,
            { color: log.status === 'taken' ? '#4CAF50' : '#FF6B6B' },
            log.photoUri ? { marginLeft: 8 } : {}
          ]}>
            {log.status === 'taken' ? 'Taken' : 'Skipped'}
          </Text>
        </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const TrackScreen: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [upcomingMedications, setUpcomingMedications] = useState<UpcomingMedication[]>([]);
  const [archivedMedications, setArchivedMedications] = useState<UpcomingMedication[]>([]);
  const [groupedLogs, setGroupedLogs] = useState<GroupedMedicationLogs>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [stats, setStats] = useState({
    totalTaken: 0,
    totalSkipped: 0,
    complianceRate: 0,
    currentStreak: 0,
  });
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string>('');
  const [selectedPhotoMedication, setSelectedPhotoMedication] = useState<string>('');
  const [selectedPhotoTakenAt, setSelectedPhotoTakenAt] = useState<Date | undefined>(undefined);
  
  // Animated values for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      flipperLog.navigation('SCREEN_FOCUS', 'TrackScreen');
      loadData();
    }, [])
  );

  // Listen for camera requests from notifications
  React.useEffect(() => {
    const handleNotificationCameraRequest = (request: NotificationCameraRequest) => {
      flipperLog.info('Camera requested from notification', {
        medicationId: request.medication.id,
        medicationName: request.medication.name,
      });

      // Set the medication and open camera modal
      setSelectedMedication(request.medication);
      setCameraModalVisible(true);
    };

    notificationStateManager.onCameraRequest(handleNotificationCameraRequest);

    return () => {
      notificationStateManager.removeCameraRequestListener(handleNotificationCameraRequest);
    };
  }, []);

  const loadData = async (isRefreshing = false) => {
    try {
      flipperLog.database('LOAD', 'track_data', { isRefreshing });
      const [medsData, logsData] = await Promise.all([
        Database.getMedications(),
        Database.getMedicationLogs()
      ]);
      
      setMedications(medsData);
      
      // Calculate upcoming medications in next 24 hours
      const upcoming = calculateUpcomingMedications(medsData, logsData);
      
      // Also get today's completed medications that might not be in upcoming list
      const todayCompleted = getTodayCompletedMedications(medsData, logsData);
      
      // Separate pending and archived medications
      const pendingMedications = upcoming.filter(item => !item.todayStatus);
      const archivedFromUpcoming = upcoming.filter(item => item.todayStatus);
      
      // Remove duplicates between archived from upcoming and today completed
      const archivedMedications = [
        ...archivedFromUpcoming,
        ...todayCompleted.filter(completed => 
          !archivedFromUpcoming.some(archived => archived.medication.id === completed.medication.id)
        )
      ];
      
      flipperLog.info('Medications separation', { 
        totalUpcoming: upcoming.length,
        pending: pendingMedications.length,
        archived: archivedMedications.length,
        todayCompleted: todayCompleted.length,
        upcomingItems: upcoming.map(item => ({ id: item.medication.id, name: item.medication.name, status: item.todayStatus })),
        archivedItems: archivedMedications.map(item => ({ id: item.medication.id, name: item.medication.name, status: item.todayStatus }))
      });
      
      setUpcomingMedications(pendingMedications);
      setArchivedMedications(archivedMedications);
      
      // Group logs by date
      const grouped = logsData.reduce((acc, log) => {
        const date = log.createdAt.toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(log);
        return acc;
      }, {} as GroupedMedicationLogs);
      
      setGroupedLogs(grouped);
      
      // Calculate statistics
      const totalTaken = logsData.filter(log => log.status === 'taken').length;
      const totalSkipped = logsData.filter(log => log.status === 'skipped').length;
      const complianceRate = totalTaken + totalSkipped > 0 ? Math.round((totalTaken / (totalTaken + totalSkipped)) * 100) : 0;
      
      setStats({
        totalTaken,
        totalSkipped,
        complianceRate,
        currentStreak: calculateStreak(logsData),
      });
      
      flipperLog.info('Track data loaded', { 
        medicationsCount: medsData.length,
        logsCount: logsData.length,
        upcomingCount: upcoming.length
      });
    } catch (error) {
      flipperLog.error('Error loading track data', error);
      console.error('Error loading track data:', error);
    } finally {
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };

  const calculateUpcomingMedications = (meds: Medication[], logs: MedicationLog[]): UpcomingMedication[] => {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcoming: UpcomingMedication[] = [];
    
    // Get today's date string for comparison
    const todayStr = now.toDateString();
    
    // Group today's logs by medication ID
    const todayLogs = logs.filter(log => log.createdAt.toDateString() === todayStr);
    const todayLogsByMed = todayLogs.reduce((acc, log) => {
      if (!acc[log.medicationId]) {
        acc[log.medicationId] = [];
      }
      acc[log.medicationId].push(log);
      return acc;
    }, {} as { [medId: string]: MedicationLog[] });

    meds.filter(med => med.isActive).forEach(medication => {
      const [hours, minutes] = medication.reminderTime.split(':').map(Number);
      
      // Check each day in the next 24 hours
      for (let i = 0; i < 2; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        checkDate.setHours(hours, minutes, 0, 0);
        
        if (checkDate > now && checkDate <= next24Hours && 
            medication.reminderDays.includes(checkDate.getDay())) {
          
          const timeUntil = getTimeUntilString(checkDate, now);
          
          // Check if this medication has been logged today
          let todayStatus: 'taken' | 'skipped' | null = null;
          let logId: string | undefined = undefined;
          
          const medLogs = todayLogsByMed[medication.id] || [];
          // Get the most recent log for this medication today
          const latestLog = medLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
          if (latestLog) {
            todayStatus = latestLog.status as 'taken' | 'skipped';
            logId = latestLog.id;
          }
          
          upcoming.push({
            medication,
            nextDose: checkDate,
            timeUntil,
            todayStatus,
            logId
          });
        }
      }
    });

    // Sort by next dose time
    upcoming.sort((a, b) => a.nextDose.getTime() - b.nextDose.getTime());
    return upcoming;
  };

  const getTodayCompletedMedications = (meds: Medication[], logs: MedicationLog[]): UpcomingMedication[] => {
    const now = new Date();
    const todayStr = now.toDateString();
    
    // Get today's logs
    const todayLogs = logs.filter(log => log.createdAt.toDateString() === todayStr);
    const todayLogsByMed = todayLogs.reduce((acc, log) => {
      if (!acc[log.medicationId]) {
        acc[log.medicationId] = [];
      }
      acc[log.medicationId].push(log);
      return acc;
    }, {} as { [medId: string]: MedicationLog[] });

    const completed: UpcomingMedication[] = [];

    // Find medications that have logs today but might not be in upcoming (e.g., past their time)
    Object.keys(todayLogsByMed).forEach(medicationId => {
      const medication = meds.find(m => m.id === medicationId);
      if (!medication) return;

      const medLogs = todayLogsByMed[medicationId];
      const latestLog = medLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      
      if (latestLog && (latestLog.status === 'taken' || latestLog.status === 'skipped')) {
        // Create a virtual upcoming medication for archived display
        const [hours, minutes] = medication.reminderTime.split(':').map(Number);
        const nextDose = new Date(now);
        nextDose.setHours(hours, minutes, 0, 0);
        
        completed.push({
          medication,
          nextDose,
          timeUntil: 'completed today',
          todayStatus: latestLog.status as 'taken' | 'skipped',
          logId: latestLog.id
        });
      }
    });

    return completed;
  };

  const getTimeUntilString = (future: Date, now: Date): string => {
    const diffMs = future.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ${diffHours % 24}h`;
    }
  };

  const calculateStreak = (logs: MedicationLog[]): number => {
    // Simple streak calculation - consecutive days with at least one taken medication
    const sortedLogs = logs
      .filter(log => log.status === 'taken')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (sortedLogs.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const logsByDate = sortedLogs.reduce((acc, log) => {
      const date = new Date(log.createdAt);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toDateString();
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(log);
      return acc;
    }, {} as { [key: string]: MedicationLog[] });
    
    while (true) {
      const dateStr = currentDate.toDateString();
      if (logsByDate[dateStr] && logsByDate[dateStr].length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (streak === 0 && currentDate.toDateString() === new Date().toDateString()) {
        // Allow for today if no medications taken yet
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const handleMedicationAction = async (upcomingMed: UpcomingMedication, action: 'taken' | 'skipped' | 'photo' | 'undo') => {
    try {
      flipperLog.info('Medication action', { 
        medicationId: upcomingMed.medication.id, 
        medicationName: upcomingMed.medication.name, 
        action,
        currentStatus: upcomingMed.todayStatus
      });

      const now = new Date();
      
      if (action === 'undo' && upcomingMed.logId) {
        // Delete the existing log to undo the action
        await Database.deleteMedicationLog(upcomingMed.logId);
        flipperLog.database('DELETE', 'medication_log', { logId: upcomingMed.logId });
      } else if (action === 'photo') {
        // Open camera modal for photo capture without saving log yet
        setSelectedMedication(upcomingMed.medication);
        setCameraModalVisible(true);
        return; // Don't proceed further, wait for photo capture
      } else {
        // Create new log entry for taken or skipped actions
        const [scheduledHours, scheduledMinutes] = upcomingMed.medication.reminderTime.split(':').map(Number);
        const scheduledTime = new Date(upcomingMed.nextDose);
        scheduledTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
        
        const log: MedicationLog = {
          id: Database.generateId(),
          medicationId: upcomingMed.medication.id,
          scheduledTime: scheduledTime, // Original scheduled time
          actualTime: action === 'taken' ? now : undefined, // Actual time when taken
          status: action as 'taken' | 'skipped',
          createdAt: now,
        };

        await Database.saveMedicationLog(log);
        flipperLog.database('CREATE', 'medication_log', { logId: log.id, action });
      }
      
      // Reload data to update the UI
      loadData();
      
    } catch (error) {
      flipperLog.error('Error logging medication action', error);
      console.error('Error logging medication action:', error);
      Alert.alert('Error', 'Failed to log medication. Please try again.');
    }
  };

  const handlePhotoCapture = async (photoUri: string) => {
    if (!selectedMedication) {
      Alert.alert('Error', 'No medication selected for photo capture');
      return;
    }

    try {
      const now = new Date();
      let scheduledTime = now; // Default to current time
      
      // Try to find the medication in upcoming medications list
      const upcomingMed = upcomingMedications.find(m => m.medication.id === selectedMedication.id);
      
      if (upcomingMed) {
        // Use the scheduled time from upcoming medications
        const [scheduledHours, scheduledMinutes] = selectedMedication.reminderTime.split(':').map(Number);
        scheduledTime = new Date(upcomingMed.nextDose);
        scheduledTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
      } else {
        // For notification-triggered photos, use today's scheduled time
        const [scheduledHours, scheduledMinutes] = selectedMedication.reminderTime.split(':').map(Number);
        scheduledTime = new Date();
        scheduledTime.setHours(scheduledHours, scheduledMinutes, 0, 0);
        
        // If the scheduled time was in the past today, it was from today's notification
        if (scheduledTime > now) {
          scheduledTime.setDate(scheduledTime.getDate() - 1); // Yesterday's notification
        }
      }
      
      const log: MedicationLog = {
        id: Database.generateId(),
        medicationId: selectedMedication.id,
        scheduledTime: scheduledTime,
        actualTime: now,
        status: 'taken',
        photoUri: photoUri,
        notes: 'Taken with photo evidence',
        createdAt: now,
      };

      await Database.saveMedicationLog(log);
      flipperLog.database('CREATE', 'medication_log', { logId: log.id, action: 'photo', photoUri });
      
      // If this was triggered from a notification, cancel any pending retry notifications
      if (!upcomingMed) {
        // Import the cancel function
        const { handleMedicationTakenOrSkipped } = require('../utils/notifications');
        await handleMedicationTakenOrSkipped(selectedMedication.id, scheduledTime);
      }
      
      // Reload data to update the UI
      loadData();
      
      // Show success message
      Alert.alert('Success', `${selectedMedication.name} has been recorded with photo evidence.`);
    } catch (error) {
      flipperLog.error('Error saving medication log with photo', error);
      console.error('Error saving medication log with photo:', error);
      Alert.alert('Error', 'Failed to save medication with photo. Please try again.');
    }
  };

  const handleCameraModalClose = () => {
    setCameraModalVisible(false);
    setSelectedMedication(null);
  };

  const handlePhotoThumbnailPress = (photoUri: string, medicationName: string, photoTakenAt?: Date) => {
    setSelectedPhotoUri(photoUri);
    setSelectedPhotoMedication(medicationName);
    setSelectedPhotoTakenAt(photoTakenAt);
    setPhotoViewerVisible(true);
  };

  const handlePhotoViewerClose = () => {
    setPhotoViewerVisible(false);
    setSelectedPhotoUri('');
    setSelectedPhotoMedication('');
    setSelectedPhotoTakenAt(undefined);
  };

  const deleteHistoryItem = async (logId: string, medicationName: string) => {
    Alert.alert(
      'Delete History Entry',
      `Are you sure you want to delete this ${medicationName} entry from your history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              flipperLog.info('Deleting history entry', { logId, medicationName });
              await Database.deleteMedicationLog(logId);
              loadData(); // Refresh the data
              flipperLog.database('DELETE', 'medication_log', { logId });
            } catch (error) {
              flipperLog.error('Error deleting history entry', error);
              console.error('Error deleting history entry:', error);
              Alert.alert('Error', 'Failed to delete history entry. Please try again.');
            }
          }
        }
      ]
    );
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, []);

  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return formatDateForDisplay(dateObj);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.TRACK}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.loadingHeader}
        >
          <Text style={styles.headerTitle}>Track</Text>
          <Text style={styles.headerSubtitle}>📊 Medication Tracking</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tracking data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CollapsibleHeader colors={GRADIENTS.TRACK} scrollY={scrollY}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Track</Text>
            <Text style={styles.headerSubtitle}>📊 Medication Tracking</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.complianceRate}%</Text>
              <Text style={styles.statLabel}>Compliance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>
      </CollapsibleHeader>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Quick Track Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Next 24 Hours</Text>
          {upcomingMedications.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="schedule" size={60} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No Upcoming Medications</Text>
              <Text style={styles.emptyDescription}>
                You're all caught up for the next 24 hours!
              </Text>
            </View>
          ) : (
            upcomingMedications.map((item, index) => (
              <View key={`${item.medication.id}-${index}`} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationInfo}>
                    <View style={[
                      styles.medicationIcon, 
                      { backgroundColor: item.medication.color }
                    ]}>
                      <Icon name="local-pharmacy" size={20} color="white" />
                    </View>
                    <View style={styles.medicationDetails}>
                      <Text style={styles.medicationName}>{item.medication.name}</Text>
                      <Text style={styles.medicationDosage}>{item.medication.dosage}</Text>
                      <Text style={styles.medicationTime}>
                        {formatTime(item.medication.reminderTime)} • in {item.timeUntil}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.takenButton]}
                    onPress={() => handleMedicationAction(item, 'taken')}
                  >
                    <Icon name="check" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Taken</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.skippedButton]}
                    onPress={() => handleMedicationAction(item, 'skipped')}
                  >
                    <Icon name="close" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Skip</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.photoButton]}
                    onPress={() => handleMedicationAction(item, 'photo')}
                  >
                    <Icon name="camera-alt" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Archived Medications Section */}
        {(archivedMedications.length > 0 || __DEV__) && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.historyHeader}
              onPress={() => setArchivedExpanded(!archivedExpanded)}
            >
              <Text style={styles.sectionTitle}>📦 Finished for today</Text>
              <Icon 
                name={archivedExpanded ? 'expand-less' : 'expand-more'} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
            
            {archivedExpanded && (
              <View style={styles.archivedContent}>
                {archivedMedications.length === 0 && __DEV__ && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No Archived Items</Text>
                    <Text style={styles.emptyDescription}>
                      Medications will appear here when marked as taken or skipped
                    </Text>
                  </View>
                )}
                {archivedMedications.map((item, index) => (
                  <View key={`${item.medication.id}-${index}`} style={[
                    styles.medicationCard,
                    styles.archivedCard
                  ]}>
                    <View style={styles.medicationHeader}>
                      <View style={styles.medicationInfo}>
                        <View style={[
                          styles.medicationIcon, 
                          { backgroundColor: item.medication.color },
                          styles.medicationIconDisabled
                        ]}>
                          <Icon name="local-pharmacy" size={20} color="white" />
                        </View>
                        <View style={styles.medicationDetails}>
                          <Text style={[styles.medicationName, styles.medicationTextDisabled]}>
                            {item.medication.name}
                          </Text>
                          <Text style={[styles.medicationDosage, styles.medicationTextDisabled]}>
                            {item.medication.dosage}
                          </Text>
                          <Text style={[styles.medicationTime, styles.medicationTextDisabled]}>
                            {formatTime(item.medication.reminderTime)} • {item.timeUntil}
                          </Text>
                          <Text style={[
                            styles.statusText,
                            item.todayStatus === 'taken' ? styles.statusTextTaken : styles.statusTextSkipped
                          ]}>
                            {item.todayStatus === 'taken' ? '✓ Completed' : '○ Skipped'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.actionButtons}>
                      {item.todayStatus === 'taken' ? (
                        // Taken - completely disabled
                        <View style={[styles.actionButton, styles.disabledButton]}>
                          <Icon name="check-circle" size={20} color="#999" />
                          <Text style={styles.disabledButtonText}>Completed</Text>
                        </View>
                      ) : (
                        // Skipped - allow re-activation
                        <>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.takenButton]}
                            onPress={() => handleMedicationAction(item, 'taken')}
                          >
                            <Icon name="check" size={20} color="white" />
                            <Text style={styles.actionButtonText}>Take Now</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.actionButton, styles.undoButton]}
                            onPress={() => handleMedicationAction(item, 'undo')}
                          >
                            <Icon name="undo" size={20} color="white" />
                            <Text style={styles.actionButtonText}>Undo</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Collapsible History Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.historyHeader}
            onPress={() => setHistoryExpanded(!historyExpanded)}
          >
            <Text style={styles.sectionTitle}>📋 History</Text>
            <Icon 
              name={historyExpanded ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
          
          {historyExpanded && (
            <View style={styles.historyContent}>
              {/* Statistics */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statCardNumber}>{stats.totalTaken}</Text>
                  <Text style={styles.statCardLabel}>Taken</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statCardNumber}>{stats.totalSkipped}</Text>
                  <Text style={styles.statCardLabel}>Skipped</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statCardNumber}>{stats.complianceRate}%</Text>
                  <Text style={styles.statCardLabel}>Compliance</Text>
                </View>
              </View>

              {/* History Logs */}
              {Object.keys(groupedLogs).length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Icon name="history" size={40} color="#E0E0E0" />
                  <Text style={styles.emptyHistoryText}>No history yet</Text>
                </View>
              ) : (
                Object.entries(groupedLogs)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([date, logs]) => (
                    <View key={date} style={styles.dateGroup}>
                      <Text style={styles.dateHeader}>{formatDate(date)}</Text>
                      {(logs as MedicationLog[]).map((log) => {
                        const medication = medications.find(m => m.id === log.medicationId);
                        if (!medication) return null;
                        
                        return (
                          <SwipeableLogItem
                            key={log.id}
                            log={log}
                            medication={medication}
                            onDelete={deleteHistoryItem}
                            onPhotoPress={handlePhotoThumbnailPress}
                          />
                        );
                      })}
                    </View>
                  ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Camera Modal */}
      <CameraModal
        visible={cameraModalVisible}
        onClose={handleCameraModalClose}
        onPhotoCapture={handlePhotoCapture}
        medicationName={selectedMedication?.name || ''}
      />
      
      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        visible={photoViewerVisible}
        photoUri={selectedPhotoUri}
        medicationName={selectedPhotoMedication}
        photoTakenAt={selectedPhotoTakenAt}
        onClose={handlePhotoViewerClose}
      />
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
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingTop: 140,
  },
  scrollContent: {
    paddingBottom: 250, // Extra space for bottom tab bar and expanded content
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  medicationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicationCardTaken: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  medicationCardSkipped: {
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  archivedCard: {
    backgroundColor: '#f8f9fa',
    opacity: 0.8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  archivedContent: {
    marginTop: 8,
  },
  medicationHeader: {
    marginBottom: 12,
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicationIconDisabled: {
    opacity: 0.5,
  },
  medicationDetails: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  medicationTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  medicationTextDisabled: {
    color: '#999',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusTextTaken: {
    color: '#4CAF50',
  },
  statusTextSkipped: {
    color: '#FF6B6B',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  takenButton: {
    backgroundColor: '#4CAF50',
  },
  skippedButton: {
    backgroundColor: '#FF6B6B',
  },
  photoButton: {
    backgroundColor: '#2196F3',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    flex: 1,
  },
  undoButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  disabledButtonText: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyContent: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  dateGroup: {
    marginBottom: 20,
  },
  swipeableContainer: {
    marginBottom: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  deleteBackgroundText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  logItemAnimated: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    paddingLeft: 4,
  },
  logIcon: {
    marginRight: 12,
  },
  logDetails: {
    flex: 1,
  },
  logMedication: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  logTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logScheduledTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
    fontStyle: 'italic',
  },
  logStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  logStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default TrackScreen;