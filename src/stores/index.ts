// ─────────────────────────────────────────────
// Barrel export for all Zustand stores
// ─────────────────────────────────────────────

export { useAppStore } from './appStore';
export { useDoseStore } from './doseStore';
export { useMedicationStore } from './medicationStore';
export { useStockStore } from './stockStore';

// Re-export state types for consumers that need them
export type { AppState } from './appStore';
export type { DoseState } from './doseStore';
export type { MedicationState } from './medicationStore';
export type { StockState } from './stockStore';
