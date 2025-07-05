import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Database } from '../utils/database';
import { Medication, MedicationLog } from '../types';

interface GroupedLogs {
  [date: string]: MedicationLog[];
}

const HistoryScreen: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [groupedLogs, setGroupedLogs] = useState<GroupedLogs>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalTaken: 0,
    totalSkipped: 0,
    complianceRate: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [medsData, logsData] = await Promise.all([
        Database.getMedications(),
        Database.getMedicationLogs()
      ]);
      
      setMedications(medsData);
      setLogs(logsData);
      
      // Group logs by date
      const grouped = logsData.reduce((acc, log) => {
        const date = log.createdAt.toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(log);
        return acc;
      }, {} as GroupedLogs);
      
      setGroupedLogs(grouped);
      calculateStats(logsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (logs: MedicationLog[]) => {
    const taken = logs.filter(log => log.status === 'taken').length;
    const skipped = logs.filter(log => log.status === 'skipped').length;
    const total = taken + skipped;
    const complianceRate = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    // Calculate current streak (simplified)
    let currentStreak = 0;
    const sortedLogs = logs
      .filter(log => log.status === 'taken')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (sortedLogs.length > 0) {
      const today = new Date();
      const lastTaken = sortedLogs[0].createdAt;
      const diffTime = Math.abs(today.getTime() - lastTaken.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        currentStreak = 1;
        // Count consecutive days (simplified logic)
        for (let i = 1; i < sortedLogs.length; i++) {
          const prevDate = sortedLogs[i - 1].createdAt;
          const currDate = sortedLogs[i].createdAt;
          const daysDiff = Math.abs(prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysDiff <= 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
    
    setStats({
      totalTaken: taken,
      totalSkipped: skipped,
      complianceRate,
      currentStreak,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getMedicationName = (medicationId: string) => {
    const medication = medications.find(med => med.id === medicationId);
    return medication ? medication.name : 'Unknown Medication';
  };

  const getMedicationColor = (medicationId: string) => {
    const medication = medications.find(med => med.id === medicationId);
    return medication ? medication.color : '#6C5CE7';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return { name: 'check-circle', color: '#4CAF50' };
      case 'skipped':
        return { name: 'cancel', color: '#FF6B6B' };
      default:
        return { name: 'schedule', color: '#FF9800' };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#4CAF50', '#8BC34A']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Track your progress</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#8BC34A']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>Track your progress</Text>
      </LinearGradient>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.totalTaken}</Text>
              <Text style={styles.statLabel}>Taken</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="cancel" size={24} color="#FF6B6B" />
              <Text style={styles.statValue}>{stats.totalSkipped}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="trending-up" size={24} color="#6C5CE7" />
              <Text style={styles.statValue}>{stats.complianceRate}%</Text>
              <Text style={styles.statLabel}>Compliance</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="local-fire-department" size={24} color="#FF9800" />
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* History Logs */}
        {Object.keys(groupedLogs).length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyDescription}>
              Start taking your medications to see your progress here
            </Text>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {Object.keys(groupedLogs)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
              .map((date) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>{formatDate(date)}</Text>
                  {groupedLogs[date]
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .map((log) => {
                      const statusIcon = getStatusIcon(log.status);
                      return (
                        <View key={log.id} style={styles.logItem}>
                          <View 
                            style={[styles.medicationDot, { backgroundColor: getMedicationColor(log.medicationId) }]} 
                          />
                          <View style={styles.logContent}>
                            <View style={styles.logHeader}>
                              <Text style={styles.medicationName}>
                                {getMedicationName(log.medicationId)}
                              </Text>
                              <View style={styles.statusContainer}>
                                <Icon 
                                  name={statusIcon.name} 
                                  size={16} 
                                  color={statusIcon.color} 
                                />
                                <Text style={[styles.statusText, { color: statusIcon.color }]}>
                                  {log.status}
                                </Text>
                              </View>
                            </View>
                            
                            <View style={styles.logFooter}>
                              <Text style={styles.logTime}>
                                {formatTime(log.actualTime || log.scheduledTime)}
                              </Text>
                              {log.notes && (
                                <Text style={styles.logNotes} numberOfLines={2}>
                                  {log.notes}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
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
  statsContainer: {
    paddingVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
  historyContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  medicationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logTime: {
    fontSize: 14,
    color: '#666',
  },
  logNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
    marginLeft: 12,
  },
});

export default HistoryScreen;