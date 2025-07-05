import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Medication, MedicationLog } from '../types';
import { Database } from '../utils/database';

interface ReminderModalProps {
  visible: boolean;
  medication: Medication | null;
  onClose: () => void;
  onTaken: () => void;
  onSkipped: () => void;
  onSnooze: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({
  visible,
  medication,
  onClose,
  onTaken,
  onSkipped,
  onSnooze,
}) => {
  if (!medication) return null;

  const handleTaken = async () => {
    try {
      const log: MedicationLog = {
        id: Database.generateId(),
        medicationId: medication.id,
        scheduledTime: new Date(),
        actualTime: new Date(),
        status: 'taken',
        createdAt: new Date(),
      };
      
      await Database.saveMedicationLog(log);
      onTaken();
    } catch (error) {
      console.error('Error logging medication taken:', error);
    }
  };

  const handleSkipped = async () => {
    try {
      const log: MedicationLog = {
        id: Database.generateId(),
        medicationId: medication.id,
        scheduledTime: new Date(),
        status: 'skipped',
        createdAt: new Date(),
      };
      
      await Database.saveMedicationLog(log);
      onSkipped();
    } catch (error) {
      console.error('Error logging medication skipped:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[medication.color, medication.color + '80']}
            style={styles.header}
          >
            <View style={styles.medicationIcon}>
              <Icon name="local-pharmacy" size={48} color="white" />
            </View>
            <Text style={styles.title}>Time for your medication!</Text>
            <Text style={styles.medicationName}>{medication.name}</Text>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.dosageContainer}>
              <Icon name="healing" size={24} color="#666" />
              <Text style={styles.dosageText}>{medication.dosage}</Text>
            </View>

            <View style={styles.timeContainer}>
              <Icon name="access-time" size={20} color="#666" />
              <Text style={styles.timeText}>
                {new Date().toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>

            {medication.notes && (
              <View style={styles.notesContainer}>
                <Icon name="note" size={20} color="#666" />
                <Text style={styles.notesText}>{medication.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.snoozeButton]}
              onPress={onSnooze}
            >
              <Icon name="snooze" size={20} color="#FF9800" />
              <Text style={[styles.actionText, { color: '#FF9800' }]}>
                Snooze
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={handleSkipped}
            >
              <Icon name="cancel" size={20} color="#FF6B6B" />
              <Text style={[styles.actionText, { color: '#FF6B6B' }]}>
                Skip
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.takenButton]}
              onPress={handleTaken}
            >
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={[styles.actionText, { color: '#4CAF50' }]}>
                Taken
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  medicationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    padding: 24,
  },
  dosageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  dosageText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  snoozeButton: {
    backgroundColor: '#FFF3E0',
  },
  skipButton: {
    backgroundColor: '#FFEBEE',
  },
  takenButton: {
    backgroundColor: '#E8F5E8',
    borderRightWidth: 0,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ReminderModal;