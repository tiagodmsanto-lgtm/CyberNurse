// ─────────────────────────────────────────────
// Zustand store — General app-wide state
// ─────────────────────────────────────────────

import { create } from 'zustand';

// ── Types ──────────────────────────────────

export interface AppState {
  /** Whether the user has completed the onboarding flow */
  isOnboarded: boolean;

  /** User display name (set during onboarding) */
  userName: string;

  /** User profile photo URI (local file) */
  userPhoto: string | null;

  /** Whether push notifications are enabled */
  notificationsEnabled: boolean;

  /** Whether the database has been initialised this session */
  isDbReady: boolean;

  // ── Actions ──

  /** Mark onboarding as completed */
  setOnboarded: (value: boolean) => void;

  /** Update the user's display name */
  setUserName: (name: string) => void;

  /** Update or clear the user's profile photo */
  setUserPhoto: (uri: string | null) => void;

  /** Toggle notification permissions state */
  setNotificationsEnabled: (value: boolean) => void;

  /** Mark the database as initialised */
  setDbReady: (value: boolean) => void;

  /** Bulk-hydrate app state (e.g. from AsyncStorage on launch) */
  hydrate: (partial: Partial<AppState>) => void;
}

// ── Store ──────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  userName: '',
  userPhoto: null,
  notificationsEnabled: false,
  isDbReady: false,

  setOnboarded: (value) => set({ isOnboarded: value }),

  setUserName: (name) => set({ userName: name }),

  setUserPhoto: (uri) => set({ userPhoto: uri }),

  setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),

  setDbReady: (value) => set({ isDbReady: value }),

  hydrate: (partial) => set(partial),
}));
