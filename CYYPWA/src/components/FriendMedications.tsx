import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPills, 
  FaClock, 
  FaBell, 
  FaCheckCircle,
  FaExclamationCircle,
  FaCalendarAlt
} from 'react-icons/fa';
import { db, Friend, Medication, MedicationLog } from '../db/database';
import { reminderAPI } from '../utils/api';
import { format, isToday, isPast, parseISO } from 'date-fns';

interface FriendMedicationsProps {
  friend: Friend;
  onBack: () => void;
}

interface SharedMedicationStatus {
  medication: Medication;
  takenToday: boolean;
  lastTaken?: Date;
  missedDose: boolean;
}

const FriendMedications: React.FC<FriendMedicationsProps> = ({ friend, onBack }) => {
  const [sharedMedications, setSharedMedications] = useState<SharedMedicationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<number | null>(null);

  useEffect(() => {
    loadFriendMedications();
    // Refresh every minute to check for missed doses
    const interval = setInterval(loadFriendMedications, 60000);
    return () => clearInterval(interval);
  }, [friend]);

  const loadFriendMedications = async () => {
    try {
      // Get medications shared by this friend
      const medications = await db.medications
        .where('id')
        .anyOf(friend.sharedWithMe)
        .toArray();

      // Get today's logs for these medications
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const statusList: SharedMedicationStatus[] = await Promise.all(
        medications.map(async (med) => {
          // Get today's log
          const todayLog = await db.medicationLogs
            .where('medicationId')
            .equals(med.id!)
            .and(log => {
              const logDate = new Date(log.takenAt);
              logDate.setHours(0, 0, 0, 0);
              return logDate.getTime() === today.getTime();
            })
            .first();

          // Check if dose is missed
          const now = new Date();
          const [hours, minutes] = med.reminderTime.split(':').map(Number);
          const scheduledTime = new Date();
          scheduledTime.setHours(hours, minutes, 0, 0);
          
          const missedDose = !todayLog && isPast(scheduledTime) && med.isActive;

          return {
            medication: med,
            takenToday: !!todayLog && !todayLog.skipped,
            lastTaken: todayLog?.takenAt,
            missedDose
          };
        })
      );

      setSharedMedications(statusList);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load friend medications:', error);
      setIsLoading(false);
    }
  };

  const handleSendReminder = async (medication: Medication) => {
    setSendingReminder(medication.id!);
    
    try {
      await reminderAPI.sendReminder(
        friend.friendId,
        medication.id!,
        medication.name,
        `Hey ${friend.friendName}! Just a friendly reminder to take your ${medication.name} (${medication.dosage}). Hope you're doing well! 💊`,
        'missed'
      );
      
      // Show success notification
      alert(`Reminder sent to ${friend.friendName}!`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder. Please try again.');
    } finally {
      setSendingReminder(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <button
          onClick={onBack}
          className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
        >
          ← Back to Friends
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
            {friend.friendName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{friend.friendName}'s Medications</h1>
            <p className="text-gray-600">
              {sharedMedications.length} medication{sharedMedications.length !== 1 ? 's' : ''} shared with you
            </p>
          </div>
        </div>
      </motion.div>

      {/* Medications List */}
      <div className="space-y-4">
        {sharedMedications.map((status, index) => (
          <motion.div
            key={status.medication.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-morphism p-6 rounded-2xl ${
              status.missedDose ? 'border-2 border-red-300' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: status.medication.color + '20' }}
                  >
                    <FaPills style={{ color: status.medication.color }} className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{status.medication.name}</h3>
                    <p className="text-gray-600">{status.medication.dosage}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <FaClock className="text-gray-500" />
                    <span>{status.medication.reminderTime}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <FaCalendarAlt className="text-gray-500" />
                    <span>
                      {status.medication.reminderDays.map(day => 
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                      ).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-3">
                  {status.takenToday ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <FaCheckCircle />
                      <span className="text-sm">
                        Taken today at {format(status.lastTaken!, 'h:mm a')}
                      </span>
                    </div>
                  ) : status.missedDose ? (
                    <div className="flex items-center space-x-2 text-red-600">
                      <FaExclamationCircle />
                      <span className="text-sm font-medium">
                        Missed dose - scheduled for {status.medication.reminderTime}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <FaClock />
                      <span className="text-sm">
                        Scheduled for {status.medication.reminderTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Send Reminder Button */}
              {status.missedDose && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendReminder(status.medication)}
                  disabled={sendingReminder === status.medication.id}
                  className="ml-4 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <FaBell />
                  <span>
                    {sendingReminder === status.medication.id ? 'Sending...' : 'Send Reminder'}
                  </span>
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}

        {sharedMedications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FaPills className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No medications shared with you yet</p>
          </div>
        )}
      </div>

      {/* Summary Card */}
      {sharedMedications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass-morphism p-6 rounded-2xl"
        >
          <h3 className="text-lg font-semibold mb-4">Today's Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {sharedMedications.filter(s => s.takenToday).length}
              </div>
              <div className="text-sm text-gray-600">Taken</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {sharedMedications.filter(s => s.missedDose).length}
              </div>
              <div className="text-sm text-gray-600">Missed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {sharedMedications.filter(s => !s.takenToday && !s.missedDose).length}
              </div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FriendMedications;