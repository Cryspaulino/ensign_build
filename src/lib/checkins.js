import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

import { db, getAnonymousUser } from './firebase.js';

export async function saveCheckIn(entry) {
  const user = await getAnonymousUser();

  const docRef = await addDoc(
    collection(db, 'users', user.uid, 'checkins'),
    {
      mood: Number(entry.mood),
      energy: Number(entry.energy),
      stress: Number(entry.stress),
      habits: entry.habits,
      date: entry.date || new Date().toISOString(),
      createdAt: serverTimestamp()
    }
  );

  return docRef.id;
}

export async function getCheckIns() {
  const user = await getAnonymousUser();

  const checkinsQuery = query(
    collection(db, 'users', user.uid, 'checkins'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(checkinsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}