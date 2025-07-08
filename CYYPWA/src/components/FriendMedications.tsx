import React, { useEffect, useState } from 'react';
import type { FC } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { firestore } from '../firebase';
import { Medication } from '../db/database';
import { motion } from 'framer-motion';
import { FaBell } from 'react-icons/fa';
import { useAuthUid } from '../hooks/useAuth';
import { sendReminder } from '../utils/cloud';

interface Props {
  friendId: string;
}

const FriendMedications: FC<Props> = ({ friendId }) => {
  const [meds, setMeds] = useState<Medication[]>([]);
  const uid = useAuthUid();

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(firestore, 'users', friendId, 'medications'));
      const list: Medication[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as Medication);
      setMeds(list);
    };
    fetch().catch(console.error);
  }, [friendId]);

  const handleRemind = (med: Medication) => {
    if (!uid) return;
    sendReminder(uid, friendId, med.id!, med.name).catch(console.error);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Friend's Medications</h2>
      {meds.map((med: Medication) => (
        <motion.div key={med.id} className="glass-morphism rounded-2xl p-4 flex justify-between items-center">
          <div>
            <h3 className="font-semibold">{med.name}</h3>
            <p className="text-xs text-gray-500">{med.dosage} at {med.reminderTime}</p>
          </div>
          <button
            onClick={() => handleRemind(med)}
            className="button-primary flex items-center space-x-1 text-sm px-3 py-1"
          >
            <FaBell />
            <span>Remind</span>
          </button>
        </motion.div>
      ))}
      {meds.length === 0 && <p className="text-sm text-gray-500">No shared medications.</p>}
    </div>
  );
};

export default FriendMedications;