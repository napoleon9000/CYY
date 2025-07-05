import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaCheck, FaTimes, FaClock, FaImage, FaChevronDown } from 'react-icons/fa';
import { db, MedicationLog, Medication } from '../db/database';

const MedicationHistory: React.FC = () => {
  const [logs, setLogs] = useState<(MedicationLog & { medication?: Medication })[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    loadLogs();
  }, [selectedDate]);

  const loadLogs = async () => {
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const medicationLogs = await db.medicationLogs
        .where('takenAt')
        .between(startOfDay, endOfDay)
        .toArray();

      // Fetch medication details for each log
      const logsWithMedication = await Promise.all(
        medicationLogs.map(async (log) => {
          const medication = await db.medications.get(log.medicationId);
          return { ...log, medication };
        })
      );

      setLogs(logsWithMedication);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDateButtons = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Medication History</h2>
        
        {/* Date Selector */}
        <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide">
          {getDateButtons().map((date, index) => (
            <motion.button
              key={date.toISOString()}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-4 py-3 rounded-2xl transition-all ${
                date.toDateString() === selectedDate.toDateString()
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'glass-morphism hover:shadow-md'
              }`}
            >
              <div className="text-xs font-medium">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-bold">
                {date.getDate()}
              </div>
              {isToday(date) && (
                <div className="text-xs mt-1">Today</div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Selected Date Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-morphism rounded-3xl p-6 text-center"
      >
        <FaCalendarAlt className="text-3xl text-primary-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-gray-800">{formatDate(selectedDate)}</h3>
      </motion.div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <FaClock className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No medication records for this date</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-morphism rounded-3xl overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id!)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: log.medication?.color || '#gray' }}
                    >
                      {log.skipped ? (
                        <FaTimes className="text-white text-xl" />
                      ) : (
                        <FaCheck className="text-white text-xl" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {log.medication?.name || 'Unknown Medication'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {log.medication?.dosage} • {formatTime(log.takenAt)}
                      </p>
                      {log.skipped && (
                        <span className="text-xs text-red-500 font-medium">Skipped</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {log.photoUrl && (
                      <FaImage className="text-gray-400" />
                    )}
                    <motion.div
                      animate={{ rotate: expandedLog === log.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FaChevronDown className="text-gray-400" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedLog === log.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <div className="pt-4 border-t border-gray-200/20 space-y-3">
                      {log.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Notes:</p>
                          <p className="text-sm text-gray-700">{log.notes}</p>
                        </div>
                      )}
                      {log.photoUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Photo Evidence:</p>
                          <img
                            src={log.photoUrl}
                            alt="Medication taken"
                            className="w-full h-48 object-cover rounded-2xl"
                          />
                        </div>
                      )}
                      {log.snoozedUntil && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Snoozed until:</span>{' '}
                          {formatTime(log.snoozedUntil)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Statistics Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism rounded-3xl p-6"
      >
        <h3 className="font-bold text-gray-800 mb-4">Today's Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-500">
              {logs.filter(l => !l.skipped).length}
            </div>
            <div className="text-xs text-gray-600">Taken</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">
              {logs.filter(l => l.skipped).length}
            </div>
            <div className="text-xs text-gray-600">Skipped</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-500">
              {logs.length > 0 ? Math.round((logs.filter(l => !l.skipped).length / logs.length) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-600">Compliance</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MedicationHistory;