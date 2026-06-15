// ─────────────────────────────────────────────
// Medication entity — core model for the app
// ─────────────────────────────────────────────

/**
 * Represents a single medication the user is tracking.
 * Timestamps are stored as Unix epoch milliseconds.
 */
export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g. '500mg'
  form: MedicationForm;
  color: string; // hex color for UI chip / card accent
  photoUri: string | null;
  instructions: string | null;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  isActive: boolean;
}

/** Supported medication presentation forms (pt-BR keys) */
export type MedicationForm =
  | 'comprimido'
  | 'capsula'
  | 'liquido'
  | 'injecao'
  | 'pomada'
  | 'gotas'
  | 'outro';

/** Human-readable labels (pt-BR) for each form */
export const MEDICATION_FORM_LABELS: Record<MedicationForm, string> = {
  comprimido: 'Comprimido',
  capsula: 'Cápsula',
  liquido: 'Líquido',
  injecao: 'Injeção',
  pomada: 'Pomada',
  gotas: 'Gotas',
  outro: 'Outro',
};

/**
 * MaterialCommunityIcons icon names for each medication form.
 * These map to react-native-vector-icons / @expo/vector-icons.
 */
export const MEDICATION_FORM_ICONS: Record<MedicationForm, string> = {
  comprimido: 'pill',
  capsula: 'capsules',
  liquido: 'bottle-tonic',
  injecao: 'needle',
  pomada: 'tube',
  gotas: 'eyedropper',
  outro: 'medical-bag',
};
