import { firestore } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  getDocs,
  DocumentReference,
  DocumentData,
  QuerySnapshot,
  DocumentChange,
} from 'firebase/firestore';
import { Medication } from '../db/database';

export const addFriend = async (uid: string, friendId: string) => {
  if (uid === friendId) return;
  const ref = doc(firestore, 'users', uid, 'friends', friendId);
  await setDoc(ref, { friendId, createdAt: Date.now() });
};

export const getFriends = async (uid: string): Promise<string[]> => {
  const snapshot = await getDocs(collection(firestore, 'users', uid, 'friends'));
  return snapshot.docs.map((d) => d.id as string);
};

export const pushMedicationToCloud = async (uid: string, medication: Medication) => {
  if (!medication.id) return;
  const medRef = doc(firestore, 'users', uid, 'medications', medication.id.toString());
  await setDoc(medRef, medication);
};

export const listenToReminders = (
  uid: string,
  onReminder: (data: DocumentData, docRef: DocumentReference<DocumentData>) => void,
  options: { autoAck?: boolean } = { autoAck: true }
) => {
  const q = query(collection(firestore, 'reminders'), where('targetId', '==', uid), where('sent', '==', false));
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        onReminder(data, change.doc.ref);
        if (options.autoAck) {
          updateDoc(change.doc.ref, { sent: true });
        }
      }
    });
  });
};

export const sendReminder = async (
  senderId: string,
  targetId: string,
  medicationId: number,
  medicationName: string
) => {
  await addDoc(collection(firestore, 'reminders'), {
    senderId,
    targetId,
    medicationId,
    medicationName,
    sent: false,
    createdAt: Date.now(),
  });
};