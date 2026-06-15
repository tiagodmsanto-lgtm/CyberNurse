/**
 * App-wide constants for Cyber Nurse
 */

export const APP_NAME = 'Cyber Nurse';
export const APP_VERSION = '1.0.0';

/** Maximum number of snoozes allowed before forcing photo verification */
export const MAX_SNOOZES = 2;

/** Snooze intervals in minutes */
export const SNOOZE_INTERVALS = [5, 10] as const;

/** Maximum number of AI verification attempts before allowing manual fallback */
export const MAX_VERIFICATION_ATTEMPTS = 3;

/** Minimum AI confidence score to accept verification (0-1) */
export const MIN_VERIFICATION_SCORE = 0.75;

/** Default stock alert threshold (units) */
export const DEFAULT_STOCK_THRESHOLD = 5;

/** Alarm escalation intervals in minutes */
export const ALARM_ESCALATION = {
  NORMAL: 5,       // First 5 minutes: normal alarm
  INCREASED: 10,   // 5-10 min: volume increases
  INTENSE: 15,     // 10-15 min: continuous vibration + intense sound
  CAREGIVER: 15,   // 15+ min: notify caregiver
  REFUSED: 30,     // 30+ min: mark as "Dose Refused"
} as const;

/** Medication form types with their display info */
export const MEDICATION_FORMS = [
  { key: 'comprimido', label: 'Comprimido', icon: 'pill' },
  { key: 'capsula', label: 'Cápsula', icon: 'capsules' },
  { key: 'liquido', label: 'Líquido', icon: 'bottle-tonic' },
  { key: 'injecao', label: 'Injeção', icon: 'needle' },
  { key: 'pomada', label: 'Pomada', icon: 'tube' },
  { key: 'gotas', label: 'Gotas', icon: 'eyedropper' },
  { key: 'outro', label: 'Outro', icon: 'medical-bag' },
] as const;

/** Frequency type options */
export const FREQUENCY_TYPES = [
  { key: 'daily', label: 'Diariamente', icon: 'calendar-today' },
  { key: 'specific_days', label: 'Dias específicos', icon: 'calendar-week' },
  { key: 'interval', label: 'A cada X horas', icon: 'clock-fast' },
] as const;

/** Meal relation options */
export const MEAL_RELATIONS = [
  { key: 'before', label: 'Antes da refeição', icon: 'food-off' },
  { key: 'during', label: 'Durante a refeição', icon: 'food' },
  { key: 'after', label: 'Após a refeição', icon: 'food-apple' },
  { key: 'none', label: 'Sem relação', icon: 'minus-circle-outline' },
] as const;

/** Days of the week */
export const WEEKDAYS = [
  { key: 0, short: 'Dom', full: 'Domingo' },
  { key: 1, short: 'Seg', full: 'Segunda' },
  { key: 2, short: 'Ter', full: 'Terça' },
  { key: 3, short: 'Qua', full: 'Quarta' },
  { key: 4, short: 'Qui', full: 'Quinta' },
  { key: 5, short: 'Sex', full: 'Sexta' },
  { key: 6, short: 'Sáb', full: 'Sábado' },
] as const;
