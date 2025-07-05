import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaPlus, FaHistory, FaCog, FaBell } from 'react-icons/fa';
import { db, Medication } from './db/database';
import { requestNotificationPermission } from './utils/notifications';
import HomePage from './components/HomePage';
import AddMedication from './components/AddMedication';
import MedicationHistory from './components/MedicationHistory';
import Settings from './components/Settings';
import ReminderModal from './components/ReminderModal';
import './App.css';

type TabType = 'home' | 'add' | 'history' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showReminder, setShowReminder] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<Medication | null>(null);

  useEffect(() => {
    // Request notification permission on app load
    requestNotificationPermission();
    
    // Load medications from database
    loadMedications();
    
    // Set up reminder checking interval
    const interval = setInterval(checkReminders, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const loadMedications = async () => {
    try {
      const meds = await db.medications.toArray();
      setMedications(meds);
    } catch (error) {
      console.error('Failed to load medications:', error);
    }
  };

  const checkReminders = async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();
    
    const allMedications = await db.medications.toArray();
    const activeMedications = allMedications.filter(med => med.isActive);
    
    for (const med of activeMedications) {
      if (med.reminderTime === currentTime && med.reminderDays.includes(currentDay)) {
        setCurrentReminder(med);
        setShowReminder(true);
        break;
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage medications={medications} onUpdate={loadMedications} />;
      case 'add':
        return <AddMedication onSave={() => { loadMedications(); setActiveTab('home'); }} />;
      case 'history':
        return <MedicationHistory />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="glass-morphism sticky top-0 z-50 p-4 border-b border-white/20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <FaBell className="text-3xl text-primary-600" />
              <span className="pulse-ring absolute top-0 right-0 h-3 w-3"></span>
              <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary-500"></span>
            </div>
            <h1 className="text-2xl font-bold gradient-text">MediMinder</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-gray-600 font-medium"
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-morphism border-t border-white/20">
        <div className="max-w-4xl mx-auto flex justify-around items-center py-2">
          {[
            { id: 'home', icon: FaHome, label: 'Home' },
            { id: 'add', icon: FaPlus, label: 'Add' },
            { id: 'history', icon: FaHistory, label: 'History' },
            { id: 'settings', icon: FaCog, label: 'Settings' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              <tab.icon className="text-xl mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Reminder Modal */}
      <AnimatePresence>
        {showReminder && currentReminder && (
          <ReminderModal
            medication={currentReminder}
            onClose={() => {
              setShowReminder(false);
              setCurrentReminder(null);
            }}
            onTaken={() => {
              setShowReminder(false);
              setCurrentReminder(null);
              loadMedications();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
