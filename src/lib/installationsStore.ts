import { useEffect, useState } from "react";
import { Installation, InstallationStatus } from "./types";
import { MOCK_INSTALLATIONS } from "./mockData";

/**
 * Lightweight in-memory store with a pub/sub so multiple components
 * stay in sync within a session. Swap this module for Supabase queries
 * later without touching consumers.
 */

type Listener = () => void;

let installations: Installation[] = [...MOCK_INSTALLATIONS];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const installationsStore = {
  list(): Installation[] {
    return installations;
  },
  get(id: string): Installation | undefined {
    return installations.find((i) => i.id === id);
  },
  add(installation: Installation) {
    installations = [installation, ...installations];
    emit();
  },
  updateStatus(id: string, status: InstallationStatus) {
    installations = installations.map((i) =>
      i.id === id ? { ...i, status } : i
    );
    emit();
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  nextId(): string {
    const max = installations
      .map((i) => parseInt(i.id.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n))
      .reduce((a, b) => Math.max(a, b), 2400);
    return `INST-${max + 1}`;
  },
};

export function useInstallations(): Installation[] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = installationsStore.subscribe(() => setTick((t) => t + 1));
    return () => { unsub; };
  }, []);
  return installationsStore.list();
}

export function useInstallation(id: string | undefined): Installation | undefined {
  const list = useInstallations();
  return id ? list.find((i) => i.id === id) : undefined;
}
