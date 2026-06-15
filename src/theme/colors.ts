/**
 * Cyber Nurse — Pokémon Center Color Palette
 *
 * Every color used in the app should come from this file.
 * Semantic names make it easy to swap palettes later without hunting
 * through component code.
 */

export const Colors = {
  // ── Brand ────────────────────────────────────────────
  /** Center Red — primary brand color */
  primary: '#E53935',
  /** Coral Red — lighter brand accent */
  primaryLight: '#FF6F61',
  /** Deep Red — pressed / dark variant */
  primaryDark: '#B71C1C',

  // ── Secondary ────────────────────────────────────────
  /** Nurse Pink — secondary brand color */
  secondary: '#F48FB1',
  /** Soft Pink — very light secondary tint */
  secondaryLight: '#FCE4EC',

  // ── Accent ───────────────────────────────────────────
  /** Pokémon Blue — call-to-action & links */
  accent: '#3B4CCA',

  // ── Surfaces ─────────────────────────────────────────
  /** Warm White — root background */
  background: '#FFF8F8',
  /** Clinical White — card / modal surfaces */
  surface: '#FFFFFF',
  /** Soft Gray — alternate surface (e.g. input fields) */
  surfaceAlt: '#F5F0F0',

  // ── Text ─────────────────────────────────────────────
  textPrimary: '#212121',
  textSecondary: '#757575',

  // ── Feedback ─────────────────────────────────────────
  /** Heal Green — success states */
  success: '#43A047',
  /** Amber — warning states */
  warning: '#FB8C00',
  /** Alert Red — error / destructive states */
  error: '#D32F2F',

  // ── Utility ──────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  cardShadow: 'rgba(0,0,0,0.08)',
} as const;

/** Type-safe color key union */
export type ColorKey = keyof typeof Colors;

/** Type-safe color value union */
export type ColorValue = (typeof Colors)[ColorKey];

export default Colors;
