// ─────────────────────────────────────────────
// Schedule entity — controls when alarms fire
// ─────────────────────────────────────────────

/**
 * Defines a recurring schedule for a given medication.
 * A medication may have multiple schedules (e.g. morning + evening).
 *
 * `frequencyValue` is a JSON string whose shape depends on `frequencyType`:
 *   - daily         → `{}`                        (every day)
 *   - specific_days → `{ "days": [0,1,3,5] }`     (0=Sun … 6=Sat)
 *   - interval      → `{ "hours": 8 }`            (every N hours)
 *
 * `times` contains one or more 'HH:mm' strings (24-hour format).
 * `startDate` / `endDate` are epoch milliseconds; `null` endDate = continuous.
 */
export interface Schedule {
  id: string;
  medicationId: string;
  frequencyType: FrequencyType;
  frequencyValue: string; // JSON — see doc above
  times: string[]; // e.g. ['08:00', '20:00']
  startDate: number; // epoch ms
  endDate: number | null; // null = continuous
  mealRelation: MealRelation;
}

/** How often the medication should be taken */
export type FrequencyType = 'daily' | 'specific_days' | 'interval';

/** Relation of the dose to meals — affects reminder copy */
export type MealRelation = 'before' | 'during' | 'after' | 'none';

/** Human-readable labels (pt-BR) for meal relation */
export const MEAL_RELATION_LABELS: Record<MealRelation, string> = {
  before: 'Antes da refeição',
  during: 'Durante a refeição',
  after: 'Após a refeição',
  none: 'Sem relação',
};

/** Human-readable labels (pt-BR) for frequency type */
export const FREQUENCY_TYPE_LABELS: Record<FrequencyType, string> = {
  daily: 'Diariamente',
  specific_days: 'Dias específicos',
  interval: 'A cada intervalo',
};
