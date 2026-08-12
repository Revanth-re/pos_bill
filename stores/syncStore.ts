import { create } from "zustand";

interface SyncState {
  pendingCount: number;
  syncing: boolean;
  setPendingCount: (n: number) => void;
  setSyncing: (v: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingCount: 0,
  syncing: false,
  setPendingCount: (n) => set({ pendingCount: n }),
  setSyncing: (v) => set({ syncing: v }),
}));
