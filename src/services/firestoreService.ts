import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  writeBatch,
  onSnapshot, 
  query, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Transaction, Agent, Investor, ActivityLog, OwnerSettings } from '../types';

function isOfflineOrUnavailable(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const code = (error as any)?.code;
  return (
    code === 'unavailable' ||
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes("backend didn't respond") ||
    msg.includes('could not reach cloud firestore')
  );
}

export function subscribeToUserData(
  userId: string,
  callbacks: {
    onTransactions: (txs: Transaction[]) => void;
    onAgents: (agents: Agent[]) => void;
    onInvestors: (investors: Investor[]) => void;
    onLogs: (logs: ActivityLog[]) => void;
    onSettings: (settings: OwnerSettings | null) => void;
  }
): () => void {
  const unsubs: Unsubscribe[] = [];

  // Transactions Listener
  const txColPath = `users/${userId}/transactions`;
  const txQuery = query(collection(db, txColPath));
  const unsubTx = onSnapshot(
    txQuery,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((d) => items.push(d.data() as Transaction));
      callbacks.onTransactions(items);
    },
    (error) => {
      if (isOfflineOrUnavailable(error)) {
        console.warn(`Firestore operating offline for ${txColPath}`);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, txColPath);
    }
  );
  unsubs.push(unsubTx);

  // Agents Listener
  const agentsColPath = `users/${userId}/agents`;
  const unsubAgents = onSnapshot(
    collection(db, agentsColPath),
    (snapshot) => {
      const items: Agent[] = [];
      snapshot.forEach((d) => items.push(d.data() as Agent));
      callbacks.onAgents(items);
    },
    (error) => {
      if (isOfflineOrUnavailable(error)) {
        console.warn(`Firestore operating offline for ${agentsColPath}`);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, agentsColPath);
    }
  );
  unsubs.push(unsubAgents);

  // Investors Listener
  const invColPath = `users/${userId}/investors`;
  const unsubInvestors = onSnapshot(
    collection(db, invColPath),
    (snapshot) => {
      const items: Investor[] = [];
      snapshot.forEach((d) => items.push(d.data() as Investor));
      callbacks.onInvestors(items);
    },
    (error) => {
      if (isOfflineOrUnavailable(error)) {
        console.warn(`Firestore operating offline for ${invColPath}`);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, invColPath);
    }
  );
  unsubs.push(unsubInvestors);

  // Logs Listener
  const logsColPath = `users/${userId}/logs`;
  const unsubLogs = onSnapshot(
    collection(db, logsColPath),
    (snapshot) => {
      const items: ActivityLog[] = [];
      snapshot.forEach((d) => items.push(d.data() as ActivityLog));
      callbacks.onLogs(items);
    },
    (error) => {
      if (isOfflineOrUnavailable(error)) {
        console.warn(`Firestore operating offline for ${logsColPath}`);
        return;
      }
      handleFirestoreError(error, OperationType.LIST, logsColPath);
    }
  );
  unsubs.push(unsubLogs);

  // Settings Listener
  const settingsDocPath = `users/${userId}/settings/current`;
  const unsubSettings = onSnapshot(
    doc(db, settingsDocPath),
    (snapshot) => {
      if (snapshot.exists()) {
        callbacks.onSettings(snapshot.data() as OwnerSettings);
      } else {
        callbacks.onSettings(null);
      }
    },
    (error) => {
      if (isOfflineOrUnavailable(error)) {
        console.warn(`Firestore operating offline for ${settingsDocPath}`);
        return;
      }
      handleFirestoreError(error, OperationType.GET, settingsDocPath);
    }
  );
  unsubs.push(unsubSettings);

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

/**
 * Deeply strips all undefined properties from an object so Firestore setDoc does not throw
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export async function saveTransactionToFirestore(userId: string, tx: Transaction): Promise<void> {
  const docPath = `users/${userId}/transactions/${tx.id}`;
  try {
    const payload = sanitizeForFirestore({
      ...tx,
      userId,
    });
    await setDoc(doc(db, docPath), payload, { merge: true });
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      console.warn(`Firestore operating offline for ${docPath}`);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteTransactionFromFirestore(userId: string, txId: string): Promise<void> {
  const docPath = `users/${userId}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, docPath));
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      console.warn(`Firestore operating offline for ${docPath}`);
      return;
    }
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function saveAgentToFirestore(userId: string, agent: Agent): Promise<void> {
  const docPath = `users/${userId}/agents/${agent.id}`;
  try {
    const payload = sanitizeForFirestore({
      ...agent,
      userId,
    });
    await setDoc(doc(db, docPath), payload, { merge: true });
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      console.warn(`Firestore operating offline for ${docPath}`);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function saveInvestorToFirestore(userId: string, investor: Investor): Promise<void> {
  const docPath = `users/${userId}/investors/${investor.id}`;
  try {
    const payload = sanitizeForFirestore({
      ...investor,
      userId,
    });
    await setDoc(doc(db, docPath), payload, { merge: true });
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      console.warn(`Firestore operating offline for ${docPath}`);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function saveLogToFirestore(userId: string, log: ActivityLog): Promise<void> {
  const docPath = `users/${userId}/logs/${log.id}`;
  try {
    const payload = sanitizeForFirestore({
      ...log,
      customerOrAgent: log.customerOrAgent || '',
      userId,
    });
    await setDoc(doc(db, docPath), payload);
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      console.warn(`Firestore operating offline for ${docPath}`);
      return;
    }
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function saveSettingsToFirestore(userId: string, settings: OwnerSettings): Promise<void> {
  const docPath = `users/${userId}/settings/current`;
  try {
    const payload = sanitizeForFirestore({
      ...settings,
      userId,
    });
    await setDoc(doc(db, docPath), payload, { merge: true });
  } catch (error) {
    if (isOfflineOrUnavailable(error)) {
      console.warn(`Firestore operating offline for ${docPath}`);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function clearAllUserDataFromFirestore(userId: string): Promise<void> {
  const collectionsToClear = ['transactions', 'agents', 'investors', 'logs'];
  for (const colName of collectionsToClear) {
    const colPath = `users/${userId}/${colName}`;
    try {
      const snap = await getDocs(collection(db, colPath));
      if (!snap.empty) {
        // Chunk deletions in batches of up to 400
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 400);
          chunk.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        }
      }
    } catch (error) {
      console.error(`Error clearing collection ${colPath}:`, error);
      // Attempt best-effort per collection without breaking execution
    }
  }
}
