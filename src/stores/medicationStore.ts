// ─────────────────────────────────────────────
// Zustand store — Medication state management
// ─────────────────────────────────────────────

import { create } from 'zustand';
import type { Medication, MedicationForm } from '../models/Medication';

// ── Types ──────────────────────────────────

export interface MedicationState {
  /** All medications registered by the user */
  medications: Medication[];

  /** Currently viewed / being-edited medication */
  selectedMedication: Medication | null;

  /** True while fetching from the database */
  isLoading: boolean;

  // ── Actions ──

  /** Replace the full medication list (e.g. after DB fetch) */
  setMedications: (meds: Medication[]) => void;

  /** Append a newly-created medication */
  addMedication: (med: Medication) => void;

  /** Patch one medication by id (partial update) */
  updateMedication: (id: string, updates: Partial<Medication>) => void;

  /** Remove a medication by id */
  removeMedication: (id: string) => void;

  /** Set or clear the currently selected medication */
  selectMedication: (med: Medication | null) => void;

  /** Toggle loading state */
  setLoading: (loading: boolean) => void;

  /** Return only active medications */
  getActiveMedications: () => Medication[];

  /** Find a single medication by id */
  getMedicationById: (id: string) => Medication | undefined;
}

// ── Store ──────────────────────────────────

export const useMedicationStore = create<MedicationState>((set, get) => ({
  medications: [],
  selectedMedication: null,
  isLoading: false,

  setMedications: (meds) => set({ medications: meds }),

  addMedication: (med) =>
    set((state) => ({
      medications: [...state.medications, med],
    })),

  updateMedication: (id, updates) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m,
      ),
      // Keep selectedMedication in sync if it's the one being updated
      selectedMedication:
        state.selectedMedication?.id === id
          ? { ...state.selectedMedication, ...updates, updatedAt: Date.now() }
          : state.selectedMedication,
    })),

  removeMedication: (id) =>
    set((state) => ({
      medications: state.medications.filter((m) => m.id !== id),
      // Clear selection if the removed medication was selected
      selectedMedication:
        state.selectedMedication?.id === id ? null : state.selectedMedication,
    })),

  selectMedication: (med) => set({ selectedMedication: med }),

  setLoading: (loading) => set({ isLoading: loading }),

  getActiveMedications: () =>
    get().medications.filter((m) => m.isActive),

  getMedicationById: (id) =>
    get().medications.find((m) => m.id === id),
}));
