import { db } from '../lib/firebase';
import { 
  collection, doc, setDoc, getDoc, 
  query, orderBy, onSnapshot, Timestamp 
} from 'firebase/firestore';
import type { ChatMessage } from './ai';

/**
 * Handles Firestore Database operations for Shuni Trips.
 * All trips are stored under users/{uid}/trips/{tripId}
 */

export const dbService = {
  // Ensure a trip document exists and return its data
  async getOrInitializeTrip(uid: string, tripId: string = 'default') {
    if (!uid) return null;
    const tripRef = doc(db, 'users', uid, 'trips', tripId);
    const snap = await getDoc(tripRef);
    if (!snap.exists()) {
      await setDoc(tripRef, {
        createdAt: Timestamp.now(),
        phase: 'idle',
      });
      return { phase: 'idle' };
    }
    return snap.data();
  },

  // Update trip-level state (travelPlan, postTripStatus, phase)
  async updateTripState(uid: string, tripId: string, data: any) {
    if (!uid) return;
    const tripRef = doc(db, 'users', uid, 'trips', tripId);
    await setDoc(tripRef, data, { merge: true });
  },

  // Save a new chat message to a trip's subcollection
  async addMessage(uid: string, tripId: string, message: ChatMessage) {
    if (!uid) return;
    const msgsRef = collection(db, 'users', uid, 'trips', tripId, 'messages');
    await setDoc(doc(msgsRef, message.id), {
      ...message,
      timestamp: Timestamp.fromDate(new Date(message.timestamp))
    });
  },

  // Real-time listener for messages
  subscribeToMessages(uid: string, tripId: string, callback: (msgs: ChatMessage[]) => void) {
    if (!uid) return () => {};
    const msgsQuery = query(
      collection(db, 'users', uid, 'trips', tripId, 'messages'), 
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(msgsQuery, (snapshot) => {
      const msgs = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as ChatMessage;
      });
      callback(msgs);
    });
  },

  // Real-time listener for trip core data
  subscribeToTripData(uid: string, tripId: string, callback: (data: any) => void) {
    if (!uid) return () => {};
    const tripRef = doc(db, 'users', uid, 'trips', tripId);
    
    return onSnapshot(tripRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    });
  }
};
