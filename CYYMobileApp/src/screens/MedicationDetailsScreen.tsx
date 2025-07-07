import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Database } from '../utils/database';
import { Medication, MedicationLog } from '../types/medication';
import { RootStackParamList } from '../types/navigation';
import { formatTime } from '../utils/timeUtils';
import { getDayAbbreviation } from '../utils/dateUtils';
import { GRADIENTS } from '../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../utils/constants';

const screenWidth = Dimensions.get('window').width;

type MedicationDetailsScreenRouteProp = RouteProp<RootStackParamList, 'MedicationDetails'>;

const MedicationDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<MedicationDetailsScreenRouteProp>();
  const { medicationId } = route.params;

  const [medication, setMedication] = useState<Medication | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    takenCount: 0,
    skippedCount: 0,
    complianceRate: 0,
    currentStreak: 0,
    timeDistribution: [] as Array<{hour: number, count: number}>
  });

  useEffect(() => {
    loadMedicationDetails();
  }, [medicationId]);

  const loadMedicationDetails = async () => {
    try {
      setLoading(true);
      
      // Load medication details
      const medicationData = await Database.getMedicationById(medicationId);
      if (!medicationData) {
        Alert.alert('Error', 'Medication not found');
        navigation.goBack();
        return;
      }
      setMedication(medicationData);

      // Load medication logs
      const medicationLogs = await Database.getLogsByMedicationId(medicationId);
      setLogs(medicationLogs);

      // Calculate statistics
      calculateStats(medicationLogs);
    } catch (error) {
      console.error('Error loading medication details:', error);
      Alert.alert('Error', 'Failed to load medication details');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: MedicationLog[]) => {
    const totalRecords = logs.length;
    const takenCount = logs.filter(log => log.status === 'taken').length;
    const skippedCount = logs.filter(log => log.status === 'skipped').length;
    const complianceRate = totalRecords > 0 ? Math.round((takenCount / totalRecords) * 100) : 0;

    // Calculate current streak
    const sortedLogs = [...logs].sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
    let currentStreak = 0;
    for (const log of sortedLogs) {
      if (log.status === 'taken') {
        currentStreak++;
      } else if (log.status === 'skipped') {
        break;
      }
    }

    // Calculate time distribution for taken medications
    const timeDistribution = new Map<number, number>();
    logs.filter(log => log.status === 'taken' && log.actualTime).forEach(log => {
      const hour = new Date(log.actualTime!).getHours();
      timeDistribution.set(hour, (timeDistribution.get(hour) || 0) + 1);
    });

    const timeDistributionArray = Array.from(timeDistribution.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    setStats({
      totalRecords,
      takenCount,
      skippedCount,
      complianceRate,
      currentStreak,
      timeDistribution: timeDistributionArray
    });
  };

  const editMedication = () => {
    if (medication) {
      navigation.navigate('AddMedication' as never, { medication } as never);
    }
  };

  const deleteMedication = async () => {
    if (!medication) return;

    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication.name}? This will also delete all associated logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Database.deleteMedication(medication.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'Failed to delete medication');
            }
          }
        }
      ]
    );
  };

  const renderTimeDistributionChart = () => {
    if (stats.timeDistribution.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Icon name="schedule" size={48} color="#E0E0E0" />
          <Text style={styles.emptyChartText}>No timing data available</Text>
        </View>
      );
    }

    const maxCount = Math.max(...stats.timeDistribution.map(d => d.count));
    const chartWidth = screenWidth - 80;
    const barWidth = Math.min(chartWidth / stats.timeDistribution.length - 4, 30);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {stats.timeDistribution.map(({ hour, count }, index) => {
            const barHeight = (count / maxCount) * 100;
            return (
              <View key={hour} style={styles.barContainer}>
                <View style={[styles.bar, { height: barHeight, width: barWidth }]}>
                  <LinearGradient
                    colors={['#6C5CE7', '#A29BFE']}
                    style={[styles.barGradient, { height: barHeight }]}
                  />
                </View>
                <Text style={styles.barLabel}>{hour}:00</Text>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.DETAILS}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Medication Details</Text>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </View>
    );
  }

  if (!medication) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={GRADIENTS.DETAILS}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Medication Details</Text>
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Icon name="error" size={64} color="#E0E0E0" />
          <Text style={styles.errorText}>Medication not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.DETAILS}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medication Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={editMedication} style={styles.headerAction}>
              <Icon name="edit" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteMedication} style={styles.headerAction}>
              <Icon name="delete" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Medication Info Card */}
        <View style={styles.medicationCard}>
          <View style={styles.medicationHeader}>
            <View style={[styles.medicationIcon, { backgroundColor: medication.color }]}>
              <Icon name="local-pharmacy" size={32} color="white" />
            </View>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDosage}>{medication.dosage}</Text>
              <Text style={[styles.medicationStatus, { color: medication.isActive ? '#4CAF50' : '#FF6B6B' }]}>
                {medication.isActive ? '● Active' : '● Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.medicationDetails}>
            <View style={styles.detailRow}>
              <Icon name="access-time" size={20} color="#666" />
              <Text style={styles.detailText}>Reminder Time: {formatTime(medication.reminderTime)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Icon name="notifications" size={20} color="#666" />
              <Text style={styles.detailText}>
                Notifications: {medication.notificationTypes?.join(', ') || 'notification'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Icon name="event" size={20} color="#666" />
              <Text style={styles.detailText}>
                Created: {medication.createdAt ? new Date(medication.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>

            <View style={styles.daysContainer}>
              <Text style={styles.daysLabel}>Reminder Days:</Text>
              <View style={styles.daysRow}>
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
          </View>

          {medication.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{medication.notes}</Text>
            </View>
          )}
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalRecords}</Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.takenCount}</Text>
              <Text style={styles.statLabel}>Taken</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{stats.skippedCount}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#6C5CE7' }]}>{stats.complianceRate}%</Text>
              <Text style={styles.statLabel}>Compliance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
          </View>
        </View>

        {/* Time Distribution Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Time Distribution</Text>
          <Text style={styles.chartSubtitle}>When you usually take this medication</Text>
          {renderTimeDistributionChart()}
        </View>

        {/* Recent Logs */}
        <View style={styles.logsCard}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {logs.length === 0 ? (
            <View style={styles.emptyLogs}>
              <Icon name="history" size={48} color="#E0E0E0" />
              <Text style={styles.emptyLogsText}>No activity recorded yet</Text>
            </View>
          ) : (
            <View style={styles.logsContainer}>
              {logs.slice(0, 5).map((log, index) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <Icon 
                      name={log.status === 'taken' ? 'check-circle' : 'cancel'} 
                      size={20} 
                      color={log.status === 'taken' ? '#4CAF50' : '#FF6B6B'} 
                    />
                    <Text style={[styles.logStatus, { 
                      color: log.status === 'taken' ? '#4CAF50' : '#FF6B6B' 
                    }]}>
                      {log.status === 'taken' ? 'Taken' : 'Skipped'}
                    </Text>
                    <Text style={styles.logDate}>
                      {new Date(log.scheduledTime).toLocaleDateString()}
                    </Text>
                  </View>
                  {log.actualTime && (
                    <Text style={styles.logTime}>
                      at {formatTime(new Date(log.actualTime).toTimeString().slice(0, 5))}
                    </Text>
                  )}
                  {log.notes && (
                    <Text style={styles.logNotes}>{log.notes}</Text>
                  )}
                </View>
              ))}
              {logs.length > 5 && (
                <Text style={styles.moreLogsText}>
                  and {logs.length - 5} more records...
                </Text>
              )}
            </View>
          )}
        </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 4,
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  medicationCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.LARGE,
    marginBottom: SPACING.MEDIUM,
    ...SHADOWS.MEDIUM,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  medicationIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  medicationDosage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  medicationStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  medicationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  daysContainer: {
    marginTop: 8,
  },
  daysLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  notesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.LARGE,
    marginBottom: SPACING.MEDIUM,
    ...SHADOWS.MEDIUM,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.LARGE,
    marginBottom: SPACING.MEDIUM,
    ...SHADOWS.MEDIUM,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barGradient: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  barCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  logsCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.LARGE,
    marginBottom: SPACING.LARGE,
    ...SHADOWS.MEDIUM,
  },
  logsContainer: {
    marginTop: 8,
  },
  logItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  logDate: {
    fontSize: 14,
    color: '#666',
  },
  logTime: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
  },
  logNotes: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    marginTop: 4,
    fontStyle: 'italic',
  },
  moreLogsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  emptyLogs: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLogsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
});

export default MedicationDetailsScreen;