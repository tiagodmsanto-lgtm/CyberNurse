// ─────────────────────────────────────────────
// User & Caregiver entities
// ─────────────────────────────────────────────

/** The primary app user / patient */
export interface User {
  id: string;
  name: string;
  email: string;
  photoUri: string | null;
  createdAt: number; // epoch ms
}

/**
 * A trusted person who can receive alerts when the user
 * misses a dose. Multiple caregivers can be registered.
 */
export interface Caregiver {
  id: string;
  name: string;
  phone: string;
  email: string;
  relation: string; // e.g. 'Mãe', 'Médico', 'Enfermeiro'
  notifyMissed: boolean;
}
