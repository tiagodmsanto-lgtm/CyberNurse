/**
 * Cyber Nurse — Spacing & Border Radius Tokens
 *
 * Built on a 4-pt grid so every measurement is a multiple of 4.
 * Import `Spacing` for margins / paddings and `BorderRadius` for
 * rounded corners throughout the app.
 */

export const Spacing = {
  /** 4 px — hairline gaps, icon padding */
  xs: 4,
  /** 8 px — tight spacing */
  sm: 8,
  /** 16 px — default spacing */
  md: 16,
  /** 24 px — section gaps */
  lg: 24,
  /** 32 px — large section separation */
  xl: 32,
  /** 48 px — hero / splash spacing */
  xxl: 48,
} as const;

export const BorderRadius = {
  /** 8 px — subtle rounding (chips, small buttons) */
  sm: 8,
  /** 12 px — medium rounding (inputs, small cards) */
  md: 12,
  /** 16 px — card rounding (main card style) */
  lg: 16,
  /** 24 px — pill-shaped elements */
  xl: 24,
  /** 9999 px — fully circular */
  full: 9999,
} as const;

/** Type-safe spacing key */
export type SpacingKey = keyof typeof Spacing;

/** Type-safe border radius key */
export type BorderRadiusKey = keyof typeof BorderRadius;

export default Spacing;
