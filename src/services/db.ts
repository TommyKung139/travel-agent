import { db } from '../lib/firebase';
import { 
  collection, doc, setDoc, getDoc, 
  query, orderBy, onSnapshot, Timestamp 
} from 'firebase/firestore';
import type { ChatMessage, ExpenseItem } from './ai';

/**
 * Handles Firestore Database operations for Shuni Trips.
 * All trips are stored under users/{uid}/trips/{tripId}
 */

// Module 4: Simulated Database Table for Reward_Rules
export const Reward_Rules: Record<string, { name: string; spend_cap: number; bank: string }> = {
  'card-cathay-cube': { name: '國泰 CUBE 卡', spend_cap: 5000, bank: '國泰' },
  'card-taishin-gogo': { name: '台新 @GoGo 卡', spend_cap: 30000, bank: '台新' },
  'card-fubon-j': { name: '富邦 J 卡', spend_cap: 25000, bank: '富邦' },
  'card-esun-kumamon': { name: '玉山 熊本熊卡', spend_cap: 10000, bank: '玉山' }
};

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

  // Module 4: API Endpoint Simulation `/api/transactions/add`
  // Evaluates spending against Reward_Rules and returns the warning state for AI Dialogues
  async addTransactionWithCheck(
    uid: string, 
    tripId: string, 
    expense: ExpenseItem, 
    currentExpenses: ExpenseItem[]
  ): Promise<{ status: 'cash' | 'safe' | 'warning', cardName?: string, currentTotal: number, spendCap: number }> {
    if (!uid) throw new Error("Unauthorized");
    
    // Save to Firestore by injecting it as a hidden system message so it integrates with our log
    const hiddenMsgId = `msg-system-form-${expense.id}`;
    const hiddenMsg: ChatMessage = {
      id: hiddenMsgId,
      role: 'user', // System-level user insertion
      content: `[System Log] Hand-entered expense: ${expense.description}`,
      timestamp: expense.timestamp,
      expenses: [expense]
    };
    
    // Phase 16: Fire-and-forget background sync to avoid Vercel deadlocks on WebSocket
    this.addMessage(uid, tripId, hiddenMsg).catch(err => console.warn("Background system msg sync failed", err));

    if (!expense.paymentMethod || expense.paymentMethod === 'Cash' || expense.paymentMethod === '現金') {
      return { status: 'cash', currentTotal: expense.amount, spendCap: 0 };
    }

    // Identify card and calculate total limits
    let targetCardId = 'card-cathay-cube'; // fallback
    for (const [id, rule] of Object.entries(Reward_Rules)) {
      if (typeof expense.paymentMethod === 'string' && expense.paymentMethod.includes(rule.bank)) {
        targetCardId = id;
        break;
      }
    }

    const rule = Reward_Rules[targetCardId];
    // Sum current expenses on this card
    const cardSum = currentExpenses
      .filter(e => e.paymentMethod && e.paymentMethod.includes(rule.bank))
      .reduce((sum, e) => sum + e.amount, 0);
      
    const newTotal = cardSum + expense.amount;
    const isNearingLimit = newTotal >= (rule.spend_cap * 0.9);

    return {
      status: isNearingLimit ? 'warning' : 'safe',
      cardName: rule.name,
      currentTotal: newTotal,
      spendCap: rule.spend_cap
    };
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
