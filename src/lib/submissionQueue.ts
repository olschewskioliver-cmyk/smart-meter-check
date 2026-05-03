import type { PhotoCheck, StepKey } from "./types";

export interface PendingSubmission {
  id: string;
  timestamp: number;
  userId: string;
  meterNumber: string;
  photos: Array<{ step: StepKey; dataUrl: string }>;
  results: PhotoCheck[];
  needsAiAnalysis: boolean;
}

const DB_NAME = "ovag-smart-meter";
const DB_VERSION = 1;
const STORE = "pending_submissions";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(
  db: IDBDatabase,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(submission: Omit<PendingSubmission, "id" | "timestamp">) {
  const db = await openDB();
  const item: PendingSubmission = {
    ...submission,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  await tx(db, "readwrite", (s) => s.add(item));
  db.close();
}

export async function getAll(): Promise<PendingSubmission[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => { resolve(req.result); db.close(); };
    req.onerror = () => reject(req.error);
  });
}

export async function remove(id: string) {
  const db = await openDB();
  await tx(db, "readwrite", (s) => s.delete(id));
  db.close();
}

export async function count(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).count();
    req.onsuccess = () => { resolve(req.result); db.close(); };
    req.onerror = () => reject(req.error);
  });
}
