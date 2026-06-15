/**
 * Date utility functions for Cyber Nurse
 */

/**
 * Format time from 'HH:mm' string to a display-friendly format
 */
export function formatTime(time: string): string {
  return time;
}

/**
 * Get the greeting based on current hour
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Format date to localized string in Portuguese
 */
export function formatDate(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };
  return date.toLocaleDateString('pt-BR', options);
}

/**
 * Format a timestamp to a short date string
 */
export function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get the start and end of a day as timestamps
 */
export function getDayBounds(date: Date = new Date()): {
  start: number;
  end: number;
} {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

/**
 * Get the number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(date2.getTime() - date1.getTime()) / oneDay);
}

/**
 * Calculate days remaining based on stock and daily consumption
 */
export function daysOfStockRemaining(
  currentQuantity: number,
  dailyDoses: number
): number {
  if (dailyDoses <= 0) return Infinity;
  return Math.floor(currentQuantity / dailyDoses);
}

/**
 * Get a list of month names in Portuguese
 */
export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

/**
 * Get a list of weekday names in Portuguese (short)
 */
export const WEEKDAY_NAMES_PT = [
  'Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb',
] as const;
