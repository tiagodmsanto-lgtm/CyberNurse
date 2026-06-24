// ─────────────────────────────────────────────
// Zustand store — Dose state management
// ─────────────────────────────────────────────

import { create } from 'zustand';
import type { Dose, DoseStatus, VerificationMethod } from '../models/Dose';

// ── Types ──────────────────────────────────

export interface DoseState {
  /** Doses for the currently displayed day */
  todayDoses: Dose[];

  /** True while fetching from the database */
  isLoading: boolean;

  // ── Actions ──

  /** Replace today's dose list (e.g. after DB fetch or day change) */
  setTodayDoses: (doses: Dose[]) => void;

  /**
   * Update a single dose's status.
   * When status is 'taken', `takenAt` is automatically set to now
   * unless explicitly provided.
   */
  updateDoseStatus: (
    id: string,
    status: DoseStatus,
    takenAt?: number,
  ) => void;

  /**
   * Record photo verification for a dose.
   * This is the ONLY way to deactivate an active alarm —
   * there is NO dismiss button.
   */
  verifyDose: (
    id: string,
    photoUri: string,
    score: number,
    method: VerificationMethod,
    notes?: string
  ) => void;

  /** Toggle loading state */
  setLoading: (loading: boolean) => void;

  // ── Derived getters ──

  /** Doses that are still pending */
  getPendingDoses: () => Dose[];

  /** Doses already taken today */
  getTakenDoses: () => Dose[];

  /** Doses that were missed */
  getMissedDoses: () => Dose[];

  /** Get a single dose by id */
  getDoseById: (id: string) => Dose | undefined;
}

// ── Store ──────────────────────────────────

export const useDoseStore = create<DoseState>((set, get) => ({
  todayDoses: [],
  isLoading: false,

  setTodayDoses: (doses) => set({ todayDoses: doses }),

  updateDoseStatus: (id, status, takenAt) =>
    set((state) => ({
      todayDoses: state.todayDoses.map((d) =>
        d.id === id
          ? {
              ...d,
              status,
              takenAt: status === 'taken' ? (takenAt ?? Date.now()) : d.takenAt,
            }
          : d,
      ),
    })),

  verifyDose: (id, photoUri, score, method) =>
    set((state) => ({
      todayDoses: state.todayDoses.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'taken' as DoseStatus,
              takenAt: Date.now(),
              verificationPhoto: photoUri,
              verificationScore: score,
              verificationMethod: method,
              notes: notes || d.notes,
            }
          : d,
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  getPendingDoses: () =>
    get().todayDoses.filter((d) => d.status === 'pending'),

  getTakenDoses: () =>
    get().todayDoses.filter((d) => d.status === 'taken'),

  getMissedDoses: () =>
    get().todayDoses.filter((d) => d.status === 'missed'),

  getDoseById: (id) =>
    get().todayDoses.find((d) => d.id === id),
}));
