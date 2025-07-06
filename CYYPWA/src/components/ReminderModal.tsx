import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaClock, FaCamera, FaCheck, FaTimes, FaRedo } from 'react-icons/fa';
import { Medication, db } from '../db/database';
import { playSound, vibrate } from '../utils/notifications';

interface ReminderModalProps {
  medication: Medication;
  onClose: () => void;
  onTaken: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ medication, onClose, onTaken }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Failed to access camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPhotoUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleTaken = async () => {
    try {
      await db.medicationLogs.add({
        medicationId: medication.id!,
        takenAt: new Date(),
        photoUrl: photoUrl || undefined,
        skipped: false,
        notes: notes || undefined,
      });
      playSound('success');
      onTaken();
    } catch (error) {
      console.error('Failed to log medication:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await db.medicationLogs.add({
        medicationId: medication.id!,
        takenAt: new Date(),
        skipped: true,
        notes: notes || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to log skip:', error);
    }
  };

  const handleSnooze = async (minutes: number) => {
    try {
      const snoozedUntil = new Date();
      snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);
      
      await db.notifications.add({
        medicationId: medication.id!,
        scheduledFor: snoozedUntil,
        sent: false,
        snoozedUntil,
      });
      
      vibrate();
      onClose();
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-100">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block mb-4"
          >
            <FaBell className="text-5xl text-primary-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Time for your medication!</h2>
          <div
            className="inline-block px-4 py-2 rounded-full text-white font-medium"
            style={{ backgroundColor: medication.color }}
          >
            {medication.name}
          </div>
          <p className="text-gray-600 mt-2">{medication.dosage}</p>
        </div>

        {/* Camera Section */}
        {!showCamera && !photoUrl && (
          <div className="p-6">
            <button
              onClick={startCamera}
              className="w-full glass-morphism rounded-2xl p-4 flex items-center justify-center space-x-3 hover:shadow-lg transition-shadow"
            >
              <FaCamera className="text-xl text-gray-600" />
              <span className="font-medium text-gray-700">Take Photo Evidence</span>
            </button>
          </div>
        )}

        {/* Camera View */}
        {showCamera && (
          <div className="p-6">
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={takePhoto}
                  className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                  <FaCamera className="text-2xl text-gray-700" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={stopCamera}
                  className="w-12 h-12 bg-red-500 rounded-full shadow-lg flex items-center justify-center"
                >
                  <FaTimes className="text-xl text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {photoUrl && (
          <div className="p-6">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={photoUrl} alt="Medication evidence" className="w-full h-48 object-cover" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setPhotoUrl(null);
                  startCamera();
                }}
                className="absolute top-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
              >
                <FaRedo className="text-gray-700" />
              </motion.button>
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="px-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes (optional)"
            className="w-full p-3 glass-morphism rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
          />
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTaken}
            className="w-full button-primary flex items-center justify-center space-x-2"
          >
            <FaCheck />
            <span>I took my medication</span>
          </motion.button>

          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 30].map((minutes) => (
              <motion.button
                key={minutes}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSnooze(minutes)}
                className="glass-morphism rounded-xl py-2 text-sm font-medium text-gray-700 hover:shadow-md transition-shadow"
              >
                <FaClock className="inline mr-1 text-xs" />
                {minutes}m
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSkip}
            className="w-full px-6 py-3 glass-morphism rounded-2xl font-medium text-red-600 hover:shadow-md transition-all"
          >
            Skip this dose
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReminderModal;