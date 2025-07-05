import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { Database, MEDICATION_COLORS } from '../utils/database';
import { requestNotificationPermission, scheduleWeeklyReminders } from '../utils/notifications';
import { Medication } from '../types';

const AddMedicationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    reminderTime: '',
    reminderDays: [1, 2, 3, 4, 5], // Default weekdays
    notificationTypes: ['notification'] as ('notification' | 'sound' | 'vibration')[],
    color: MEDICATION_COLORS[0],
    notes: '',
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const days = [
    { id: 0, name: 'Sun', full: 'Sunday' },
    { id: 1, name: 'Mon', full: 'Monday' },
    { id: 2, name: 'Tue', full: 'Tuesday' },
    { id: 3, name: 'Wed', full: 'Wednesday' },
    { id: 4, name: 'Thu', full: 'Thursday' },
    { id: 5, name: 'Fri', full: 'Friday' },
    { id: 6, name: 'Sat', full: 'Saturday' },
  ];

  const notificationTypes = [
    { id: 'notification', icon: 'notifications', label: 'Notification' },
    { id: 'sound', icon: 'volume-up', label: 'Sound' },
    { id: 'vibration', icon: 'phone-android', label: 'Vibration' },
    { id: 'all', icon: 'notifications-active', label: 'All' },
  ];

  const toggleDay = (dayId: number) => {
    setFormData(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(dayId)
        ? prev.reminderDays.filter(d => d !== dayId)
        : [...prev.reminderDays, dayId],
    }));
  };

  const toggleNotificationType = (type: 'notification' | 'sound' | 'vibration') => {
    setFormData(prev => ({
      ...prev,
      notificationTypes: prev.notificationTypes.includes(type)
        ? prev.notificationTypes.filter(t => t !== type)
        : [...prev.notificationTypes, type],
    }));
  };

  const toggleAllNotifications = () => {
    const allTypes: ('notification' | 'sound' | 'vibration')[] = ['notification', 'sound', 'vibration'];
    const hasAllTypes = allTypes.every(type => formData.notificationTypes.includes(type));
    
    setFormData(prev => ({
      ...prev,
      notificationTypes: hasAllTypes ? [] : allTypes,
    }));
  };

  const isAllNotificationsSelected = () => {
    const allTypes: ('notification' | 'sound' | 'vibration')[] = ['notification', 'sound', 'vibration'];
    return allTypes.every(type => formData.notificationTypes.includes(type));
  };

  const handleTimeConfirm = (time: Date) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    setFormData(prev => ({ ...prev, reminderTime: `${hours}:${minutes}` }));
    setShowTimePicker(false);
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return 'Select time';
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    if (!formData.dosage.trim()) {
      Alert.alert('Error', 'Please enter the dosage');
      return;
    }

    if (!formData.reminderTime) {
      Alert.alert('Error', 'Please select a reminder time');
      return;
    }

    if (formData.reminderDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const newMedication: Medication = {
        id: Database.generateId(),
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        reminderTime: formData.reminderTime,
        reminderDays: formData.reminderDays,
        notificationTypes: formData.notificationTypes,
        isActive: true,
        color: formData.color,
        icon: 'pill',
        notes: formData.notes.trim(),
        createdAt: now,
        updatedAt: now,
      };

      await Database.saveMedication(newMedication);
      
      // Request notification permission and schedule reminders
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        scheduleWeeklyReminders(newMedication);
      } else {
        Alert.alert(
          'Notification Permission',
          'Notifications are disabled. You can enable them in Settings to receive medication reminders.'
        );
      }
      
      Alert.alert('Success', 'Medication added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6C5CE7', '#A29BFE']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Add Medication</Text>
            <Text style={styles.headerSubtitle}>Create a new reminder</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Medication Name */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Medication Name *</Text>
          <View style={styles.inputContainer}>
            <Icon name="local-pharmacy" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Aspirin, Vitamin D"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>
        </View>

        {/* Dosage */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Dosage *</Text>
          <View style={styles.inputContainer}>
            <Icon name="healing" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 100mg, 2 tablets"
              value={formData.dosage}
              onChangeText={(text) => setFormData(prev => ({ ...prev, dosage: text }))}
            />
          </View>
        </View>

        {/* Reminder Time */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Reminder Time *</Text>
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Icon name="access-time" size={20} color="#666" style={styles.inputIcon} />
            <Text style={[styles.timePickerText, !formData.reminderTime && styles.placeholder]}>
              {formatTimeDisplay(formData.reminderTime)}
            </Text>
            <Icon name="expand-more" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Days Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Reminder Days *</Text>
          <View style={styles.daysContainer}>
            {days.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  formData.reminderDays.includes(day.id) && styles.dayButtonActive
                ]}
                onPress={() => toggleDay(day.id)}
              >
                <Text style={[
                  styles.dayButtonText,
                  formData.reminderDays.includes(day.id) && styles.dayButtonTextActive
                ]}>
                  {day.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notification Type */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Alert Type</Text>
          <View style={styles.notificationContainer}>
            {notificationTypes.slice(0, 3).map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.notificationButton,
                  formData.notificationTypes.includes(type.id as any) && styles.notificationButtonActive
                ]}
                onPress={() => toggleNotificationType(type.id as any)}
              >
                <Icon 
                  name={type.icon} 
                  size={24} 
                  color={formData.notificationTypes.includes(type.id as any) ? 'white' : '#666'} 
                />
                <Text style={[
                  styles.notificationButtonText,
                  formData.notificationTypes.includes(type.id as any) && styles.notificationButtonTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.notificationButton,
                isAllNotificationsSelected() && styles.notificationButtonActive
              ]}
              onPress={toggleAllNotifications}
            >
              <Icon 
                name="notifications-active" 
                size={24} 
                color={isAllNotificationsSelected() ? 'white' : '#666'} 
              />
              <Text style={[
                styles.notificationButtonText,
                isAllNotificationsSelected() && styles.notificationButtonTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Choose Color</Text>
          <View style={styles.colorContainer}>
            {MEDICATION_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  formData.color === color && styles.colorButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, color }))}
              >
                {formData.color === color && (
                  <Icon name="check" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <View style={styles.inputContainer}>
            <Icon name="note" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Additional notes..."
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={['#6C5CE7', '#A29BFE']}
            style={styles.submitGradient}
          >
            <Icon name="save" size={24} color="white" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Save Medication'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Time Picker Modal */}
      <DatePicker
        modal
        open={showTimePicker}
        date={selectedTime}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={() => setShowTimePicker(false)}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  placeholder: {
    color: '#999',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dayButtonActive: {
    backgroundColor: '#6C5CE7',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  notificationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationButtonActive: {
    backgroundColor: '#6C5CE7',
  },
  notificationButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  notificationButtonTextActive: {
    color: 'white',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: '#333',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});

export default AddMedicationScreen;