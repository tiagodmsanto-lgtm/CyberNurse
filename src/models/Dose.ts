// ─────────────────────────────────────────────
// Dose entity — one per scheduled alarm event
// ─────────────────────────────────────────────

/**
 * Represents a single dose event generated from a Schedule.
 *
 * The alarm can ONLY be deactivated by providing a verification photo
 * proving the medication was consumed. There is NO dismiss button.
 *
 * `verificationScore` is a 0–1 confidence value from the AI model
 * (or 1.0 for manual / fallback verification).
 */
export interface Dose {
  id: string;
  scheduleId: string;
  medicationId: string;
  scheduledAt: number; // epoch ms — when the dose should be taken
  takenAt: number | null; // epoch ms — when it was actually taken
  status: DoseStatus;
  verificationPhoto: string | null; // local file URI
  verificationScore: number | null; // 0–1 confidence
  verificationMethod: VerificationMethod | null;
  notes: string | null;
}

/**
 * Lifecycle of a dose:
 *   pending  → alarm fires, waiting for action
 *   taken    → user took the medication (photo verified)
 *   missed   → window expired without action
 *   skipped  → caregiver / special override
 *   refused  → user explicitly refused (logged for history)
 */
export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped' | 'refused';

/**
 * How the dose was verified:
 *   ai       → on-device AI confirmed photo matches medication
 *   manual   → caregiver manually approved
 *   fallback → AI unavailable, photo stored for later review
 */
export type VerificationMethod = 'ai' | 'manual' | 'fallback';

/** Human-readable labels (pt-BR) for dose status */
export const DOSE_STATUS_LABELS: Record<DoseStatus, string> = {
  pending: 'Pendente',
  taken: 'Tomado',
  missed: 'Perdido',
  skipped: 'Pulado',
  refused: 'Recusado',
};

/** Icon names (MaterialCommunityIcons) for each status */
export const DOSE_STATUS_ICONS: Record<DoseStatus, string> = {
  pending: 'clock-outline',
  taken: 'check-circle',
  missed: 'close-circle',
  skipped: 'skip-next-circle',
  refused: 'cancel',
};
