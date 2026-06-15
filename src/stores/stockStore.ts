// ─────────────────────────────────────────────
// Zustand store — Stock / inventory management
// ─────────────────────────────────────────────

import { create } from 'zustand';
import type { Stock } from '../models/Stock';

// ── Types ──────────────────────────────────

export interface StockState {
  /** All stock records keyed by medicationId */
  stocks: Stock[];

  /** True while fetching from the database */
  isLoading: boolean;

  // ── Actions ──

  /** Replace the full stock list (e.g. after DB fetch) */
  setStocks: (stocks: Stock[]) => void;

  /** Set or update the quantity for a specific medication */
  updateStock: (medicationId: string, quantity: number) => void;

  /** Decrement stock by 1 (called when a dose is taken) */
  decrementStock: (medicationId: string) => void;

  /** Update a stock record with partial data */
  updateStockRecord: (medicationId: string, updates: Partial<Stock>) => void;

  /** Toggle loading state */
  setLoading: (loading: boolean) => void;

  // ── Derived getters ──

  /** Stocks where currentQuantity <= minThreshold */
  getLowStockAlerts: () => Stock[];

  /** Get stock for a specific medication */
  getStockByMedicationId: (medicationId: string) => Stock | undefined;

  /** Stocks with expired medications */
  getExpiredStocks: () => Stock[];
}

// ── Store ──────────────────────────────────

export const useStockStore = create<StockState>((set, get) => ({
  stocks: [],
  isLoading: false,

  setStocks: (stocks) => set({ stocks }),

  updateStock: (medicationId, quantity) =>
    set((state) => ({
      stocks: state.stocks.map((s) =>
        s.medicationId === medicationId
          ? { ...s, currentQuantity: quantity }
          : s,
      ),
    })),

  decrementStock: (medicationId) =>
    set((state) => ({
      stocks: state.stocks.map((s) =>
        s.medicationId === medicationId
          ? { ...s, currentQuantity: Math.max(0, s.currentQuantity - 1) }
          : s,
      ),
    })),

  updateStockRecord: (medicationId, updates) =>
    set((state) => ({
      stocks: state.stocks.map((s) =>
        s.medicationId === medicationId ? { ...s, ...updates } : s,
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  getLowStockAlerts: () =>
    get().stocks.filter((s) => s.currentQuantity <= s.minThreshold),

  getStockByMedicationId: (medicationId) =>
    get().stocks.find((s) => s.medicationId === medicationId),

  getExpiredStocks: () => {
    const now = Date.now();
    return get().stocks.filter(
      (s) => s.expiryDate !== null && s.expiryDate <= now,
    );
  },
}));
