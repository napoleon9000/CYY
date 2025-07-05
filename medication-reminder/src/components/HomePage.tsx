import React from 'react';
import { motion } from 'framer-motion';
import { FaPills, FaClock, FaBell, FaToggleOn, FaToggleOff, FaTrash } from 'react-icons/fa';
import { Medication, db } from '../db/database';
import { playSound } from '../utils/notifications';

interface HomePageProps {
  medications: Medication[];
  onUpdate: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ medications, onUpdate }) => {
  const toggleMedication = async (id: number, isActive: boolean) => {
    try {
      await db.medications.update(id, { isActive: !isActive });
      playSound('success');
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle medication:', error);
    }
  };

  const deleteMedication = async (id: number) => {
    try {
      await db.medications.delete(id);
      playSound('success');
      onUpdate();
    } catch (error) {
      console.error('Failed to delete medication:', error);
    }
  };

  const getDayAbbreviation = (day: number) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[day];
  };

  if (medications.length === 0) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <FaPills className="text-6xl text-gray-300 mx-auto mb-4 animate-float" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No Medications Yet</h2>
        <p className="text-gray-500">Tap the + button to add your first medication reminder</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800 mb-6"
      >
        Your Medications
      </motion.h2>

      {medications.map((medication, index) => (
        <motion.div
          key={medication.id}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-morphism rounded-3xl p-6 card-float"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: medication.color }}
                >
                  <FaPills className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{medication.name}</h3>
                  <p className="text-sm text-gray-600">{medication.dosage}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaClock className="text-sm" />
                  <span className="text-sm font-medium">{medication.reminderTime}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FaBell className="text-sm" />
                  <span className="text-sm capitalize">{medication.notificationType}</span>
                </div>
              </div>

              <div className="flex space-x-1">
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <span
                    key={day}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      medication.reminderDays.includes(day)
                        ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {getDayAbbreviation(day)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleMedication(medication.id!, medication.isActive)}
                className={`transition-all ${medication.isActive ? 'text-green-500' : 'text-gray-400'}`}
              >
                {medication.isActive ? (
                  <FaToggleOn className="text-3xl" />
                ) : (
                  <FaToggleOff className="text-3xl" />
                )}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => deleteMedication(medication.id!)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <FaTrash className="text-lg" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default HomePage;