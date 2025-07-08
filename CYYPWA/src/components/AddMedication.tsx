import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPills, FaClock, FaBell, FaVolumeUp, FaMobileAlt, FaSave, FaPalette } from 'react-icons/fa';
import { db, getMedicationColors, Medication } from '../db/database';
import { useAuthUid } from '../hooks/useAuth';
import { pushMedicationToCloud } from '../utils/cloud';
import { playSound, vibrate } from '../utils/notifications';

interface AddMedicationProps {
  onSave: () => void;
}

const AddMedication: React.FC<AddMedicationProps> = ({ onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    reminderTime: '',
    reminderDays: [1, 2, 3, 4, 5], // Default weekdays
    notificationType: 'notification' as 'notification' | 'sound' | 'vibration',
    color: getMedicationColors()[0],
  });

  const uid = useAuthUid();

  const days = [
    { id: 0, name: 'Sun' },
    { id: 1, name: 'Mon' },
    { id: 2, name: 'Tue' },
    { id: 3, name: 'Wed' },
    { id: 4, name: 'Thu' },
    { id: 5, name: 'Fri' },
    { id: 6, name: 'Sat' },
  ];

  const notificationTypes = [
    { id: 'notification', icon: FaBell, label: 'Notification' },
    { id: 'sound', icon: FaVolumeUp, label: 'Sound' },
    { id: 'vibration', icon: FaMobileAlt, label: 'Vibration' },
  ];

  const toggleDay = (dayId: number) => {
    setFormData(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(dayId)
        ? prev.reminderDays.filter(d => d !== dayId)
        : [...prev.reminderDays, dayId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dosage || !formData.reminderTime) {
      vibrate([100, 50, 100]);
      return;
    }

    try {
      const newMedication: Medication = {
        ...formData,
        isActive: true,
        createdAt: new Date(),
        icon: 'FaPills',
      };

      const id = await db.medications.add(newMedication);
      newMedication.id = id;

      // Sync to cloud so friends can see (ignore errors if offline or not configured)
      if (uid) {
        pushMedicationToCloud(uid, newMedication).catch(console.warn);
      }

      playSound('success');
      onSave();
    } catch (error) {
      console.error('Failed to save medication:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800 mb-6"
      >
        Add New Medication
      </motion.h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Medication Name */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medication Name
          </label>
          <div className="relative">
            <FaPills className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-12 pr-4 py-3 glass-morphism rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="e.g., Aspirin"
            />
          </div>
        </motion.div>

        {/* Dosage */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dosage
          </label>
          <input
            type="text"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            className="w-full px-4 py-3 glass-morphism rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            placeholder="e.g., 100mg, 2 tablets"
          />
        </motion.div>

        {/* Reminder Time */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Time
          </label>
          <div className="relative">
            <FaClock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="time"
              value={formData.reminderTime}
              onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
              className="w-full pl-12 pr-4 py-3 glass-morphism rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </motion.div>

        {/* Reminder Days */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Days
          </label>
          <div className="flex justify-between space-x-2">
            {days.map((day) => (
              <motion.button
                key={day.id}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleDay(day.id)}
                className={`flex-1 py-3 px-2 rounded-2xl font-medium transition-all ${
                  formData.reminderDays.includes(day.id)
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                    : 'glass-morphism text-gray-600 hover:text-primary-600'
                }`}
              >
                {day.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Notification Type */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {notificationTypes.map((type) => (
              <motion.button
                key={type.id}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setFormData({ ...formData, notificationType: type.id as any });
                  // Preview the notification type
                  if (type.id === 'sound') playSound('gentle');
                  if (type.id === 'vibration') vibrate();
                }}
                className={`p-4 rounded-2xl transition-all ${
                  formData.notificationType === type.id
                    ? 'bg-gradient-to-r from-secondary-400 to-secondary-500 text-white shadow-lg'
                    : 'glass-morphism text-gray-600 hover:text-secondary-600'
                }`}
              >
                <type.icon className="text-2xl mx-auto mb-2" />
                <span className="text-xs">{type.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Color Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FaPalette className="inline mr-2" />
            Choose Color
          </label>
          <div className="flex space-x-3 flex-wrap">
            {getMedicationColors().map((color) => (
              <motion.button
                key={color}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setFormData({ ...formData, color })}
                className={`w-10 h-10 rounded-full shadow-lg transition-all ${
                  formData.color === color ? 'ring-4 ring-white ring-offset-2' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full button-primary flex items-center justify-center space-x-2"
        >
          <FaSave />
          <span>Save Medication</span>
        </motion.button>
      </form>
    </div>
  );
};

export default AddMedication;