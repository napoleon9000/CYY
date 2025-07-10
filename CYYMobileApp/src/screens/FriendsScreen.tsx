import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { GRADIENTS, COMMON_COLORS } from '../constants/colors';
import { FriendService } from '../services/friendService';
import { MedicationShareService } from '../services/medicationShareService';
import { supabaseAuth } from '../services/supabase';
import { Friendship, SharedMedication, FriendReminder } from '../types/social';

type FriendsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Friends'>;

const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<FriendsScreenNavigationProp>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [sharedMedications, setSharedMedications] = useState<SharedMedication[]>([]);
  const [reminders, setReminders] = useState<FriendReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'friends' | 'shared' | 'reminders'>('friends');

  useFocusEffect(
    useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    try {
      const user = await supabaseAuth.getCurrentUser();
      setIsAuthenticated(!!user);
      if (user) {
        loadData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFriends(),
        loadFriendRequests(),
        loadSharedMedications(),
        loadReminders(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const data = await FriendService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const data = await FriendService.getFriendRequests();
      setFriendRequests(data);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadSharedMedications = async () => {
    try {
      const data = await MedicationShareService.getSharedMedications();
      setSharedMedications(data);
    } catch (error) {
      console.error('Error loading shared medications:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const data = await MedicationShareService.getFriendReminders();
      setReminders(data.filter(r => !r.read_at));
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await FriendService.acceptFriendRequest(requestId);
      await loadData();
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendService.rejectFriendRequest(requestId);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject request');
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendService.removeFriend(friendId);
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleViewSharedMedication = (medication: SharedMedication) => {
    navigation.navigate('FriendMedicationDetail', {
      friendId: medication.owner_id,
      medicationId: medication.medication_data.id,
      friendName: medication.owner?.display_name || medication.owner?.username || 'Friend',
    });
  };

  const handleMarkReminderRead = async (reminderId: string) => {
    try {
      await MedicationShareService.markReminderAsRead(reminderId);
      setReminders(reminders.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error marking reminder as read:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={GRADIENTS.HOME} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.unauthenticatedContainer}>
            <Icon name="people" size={80} color="#FFFFFF" />
            <Text style={styles.unauthenticatedTitle}>Login Required</Text>
            <Text style={styles.unauthenticatedText}>
              Please login to connect with friends and share medications
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const renderFriendItem = ({ item }: { item: Friendship }) => (
    <TouchableOpacity style={styles.friendCard}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>
          {(item.friend?.display_name || item.friend?.username || 'U')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {item.friend?.display_name || item.friend?.username}
        </Text>
        <Text style={styles.friendUsername}>@{item.friend?.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.friendAction}
        onPress={() => handleRemoveFriend(
          item.friend_id,
          item.friend?.display_name || item.friend?.username || 'Friend'
        )}
      >
        <Icon name="more-vert" size={24} color={COMMON_COLORS.SECONDARY_TEXT} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: Friendship }) => (
    <View style={styles.requestCard}>
      <View style={styles.friendAvatar}>
        <Text style={styles.avatarText}>
          {(item.user?.display_name || item.user?.username || 'U')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {item.user?.display_name || item.user?.username}
        </Text>
        <Text style={styles.friendUsername}>@{item.user?.username}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.requestButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Icon name="check" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item.id)}
        >
          <Icon name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSharedMedication = ({ item }: { item: SharedMedication }) => (
    <TouchableOpacity
      style={styles.medicationCard}
      onPress={() => handleViewSharedMedication(item)}
    >
      <Icon
        name={item.medication_data.icon || 'medication'}
        size={30}
        color={item.medication_data.color}
      />
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.medication_data.name}</Text>
        <Text style={styles.medicationOwner}>
          Shared by {item.owner?.display_name || item.owner?.username}
        </Text>
      </View>
      <Icon name="chevron-right" size={24} color={COMMON_COLORS.SECONDARY_TEXT} />
    </TouchableOpacity>
  );

  const renderReminder = ({ item }: { item: FriendReminder }) => (
    <View style={styles.reminderCard}>
      <View style={styles.reminderContent}>
        <Text style={styles.reminderFrom}>
          From {item.from_user?.display_name || item.from_user?.username}
        </Text>
        <Text style={styles.reminderMessage}>{item.message}</Text>
        <Text style={styles.reminderTime}>
          {new Date(item.sent_at).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={() => handleMarkReminderRead(item.id)}
      >
        <Icon name="close" size={20} color={COMMON_COLORS.SECONDARY_TEXT} />
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={GRADIENTS.HOME} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friends</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddFriend')}
          >
            <Icon name="person-add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'friends' && styles.activeTab]}
            onPress={() => setSelectedTab('friends')}
          >
            <Text style={[styles.tabText, selectedTab === 'friends' && styles.activeTabText]}>
              Friends ({friends.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'shared' && styles.activeTab]}
            onPress={() => setSelectedTab('shared')}
          >
            <Text style={[styles.tabText, selectedTab === 'shared' && styles.activeTabText]}>
              Shared ({sharedMedications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'reminders' && styles.activeTab]}
            onPress={() => setSelectedTab('reminders')}
          >
            <Text style={[styles.tabText, selectedTab === 'reminders' && styles.activeTabText]}>
              Reminders ({reminders.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {friendRequests.length > 0 && selectedTab === 'friends' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Friend Requests</Text>
                <FlatList
                  data={friendRequests}
                  renderItem={renderRequestItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}

            {selectedTab === 'friends' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Friends</Text>
                {friends.length === 0 ? (
                  <Text style={styles.emptyText}>No friends yet. Add some friends to share medications!</Text>
                ) : (
                  <FlatList
                    data={friends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}

            {selectedTab === 'shared' && (
              <View style={styles.section}>
                {sharedMedications.length === 0 ? (
                  <Text style={styles.emptyText}>No shared medications</Text>
                ) : (
                  <FlatList
                    data={sharedMedications}
                    renderItem={renderSharedMedication}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}

            {selectedTab === 'reminders' && (
              <View style={styles.section}>
                {reminders.length === 0 ? (
                  <Text style={styles.emptyText}>No new reminders</Text>
                ) : (
                  <FlatList
                    data={reminders}
                    renderItem={renderReminder}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unauthenticatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  unauthenticatedText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GRADIENTS.HOME[0],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COMMON_COLORS.PRIMARY_TEXT,
  },
  friendUsername: {
    fontSize: 14,
    color: COMMON_COLORS.SECONDARY_TEXT,
  },
  friendAction: {
    padding: 5,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  requestButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COMMON_COLORS.SUCCESS,
  },
  rejectButton: {
    backgroundColor: COMMON_COLORS.ERROR,
  },
  medicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
  },
  medicationInfo: {
    flex: 1,
    marginLeft: 15,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COMMON_COLORS.PRIMARY_TEXT,
  },
  medicationOwner: {
    fontSize: 14,
    color: COMMON_COLORS.SECONDARY_TEXT,
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderFrom: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COMMON_COLORS.PRIMARY_TEXT,
    marginBottom: 4,
  },
  reminderMessage: {
    fontSize: 14,
    color: COMMON_COLORS.PRIMARY_TEXT,
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 12,
    color: COMMON_COLORS.SECONDARY_TEXT,
  },
  dismissButton: {
    padding: 5,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
});

export default FriendsScreen;