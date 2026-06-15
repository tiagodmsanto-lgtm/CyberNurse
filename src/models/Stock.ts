// ─────────────────────────────────────────────
// Stock entity — medication inventory tracking
// ─────────────────────────────────────────────

/**
 * Tracks inventory for a single medication.
 *
 * When `currentQuantity` drops below `minThreshold`, the app
 * should push a low-stock reminder notification.
 *
 * Dates are epoch milliseconds; `null` = not set.
 */
export interface Stock {
  id: string;
  medicationId: string;
  currentQuantity: number;
  minThreshold: number; // alert when currentQuantity <= this
  expiryDate: number | null; // epoch ms
  lastRefillDate: number | null; // epoch ms
}
