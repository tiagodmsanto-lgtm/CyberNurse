/**
 * Cyber Nurse — Theme Barrel
 *
 * Re-exports every design-system token and builds a React Native Paper
 * MD3 theme that maps the Pokémon Center palette onto Paper's color
 * system.  Wrap the root layout with:
 *
 *   <PaperProvider theme={PaperTheme}> … </PaperProvider>
 */

export { Colors, type ColorKey, type ColorValue } from './colors';
export { Typography, FontWeight, type TypographyVariant } from './typography';
export { Spacing, BorderRadius, type SpacingKey, type BorderRadiusKey } from './spacing';

// ── React Native Paper MD3 Theme ───────────────────────────────────
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { Colors } from './colors';

/**
 * Custom MD3 theme for React Native Paper.
 *
 * We keep the default shape / animation tokens from Paper and only
 * override the color layer so every Paper component (Button, Card,
 * FAB, etc.) renders with our Pokémon Center palette out of the box.
 */
export const PaperTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 4, // Paper multiplies this internally for different components
  colors: {
    ...MD3LightTheme.colors,

    // ── Primary ──────────────────────────────────────
    primary: Colors.primary,
    onPrimary: Colors.white,
    primaryContainer: Colors.secondaryLight,
    onPrimaryContainer: Colors.primaryDark,

    // ── Secondary ────────────────────────────────────
    secondary: Colors.secondary,
    onSecondary: Colors.white,
    secondaryContainer: Colors.secondaryLight,
    onSecondaryContainer: Colors.primaryDark,

    // ── Tertiary (mapped to accent / Pokémon Blue) ──
    tertiary: Colors.accent,
    onTertiary: Colors.white,
    tertiaryContainer: '#E8EAF6', // very light blue tint
    onTertiaryContainer: '#1A237E', // deep blue

    // ── Error ────────────────────────────────────────
    error: Colors.error,
    onError: Colors.white,
    errorContainer: '#FFCDD2',
    onErrorContainer: '#B71C1C',

    // ── Background & Surface ─────────────────────────
    background: Colors.background,
    onBackground: Colors.textPrimary,
    surface: Colors.surface,
    onSurface: Colors.textPrimary,
    surfaceVariant: Colors.surfaceAlt,
    onSurfaceVariant: Colors.textSecondary,
    surfaceDisabled: 'rgba(33,33,33,0.12)',
    onSurfaceDisabled: 'rgba(33,33,33,0.38)',

    // ── Outline ──────────────────────────────────────
    outline: '#BDBDBD',
    outlineVariant: '#E0E0E0',

    // ── Elevation overlay ────────────────────────────
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: Colors.surface,
      level2: Colors.surfaceAlt,
      level3: Colors.surfaceAlt,
      level4: Colors.surfaceAlt,
      level5: Colors.surfaceAlt,
    },

    // ── Misc ─────────────────────────────────────────
    shadow: Colors.cardShadow,
    scrim: Colors.overlay,
    inverseSurface: Colors.textPrimary,
    inverseOnSurface: Colors.surface,
    inversePrimary: Colors.primaryLight,
    backdrop: Colors.overlay,
  },
};

/**
 * Convenience object that groups every token namespace under a single
 * import when you don't need the Paper theme:
 *
 *   import { theme } from '@/src/theme';
 *   theme.colors.primary   // '#E53935'
 *   theme.spacing.md       // 16
 */
import { Spacing, BorderRadius } from './spacing';
import { Typography } from './typography';

export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
} as const;

export type AppTheme = typeof theme;

export default theme;
