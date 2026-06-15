/**
 * Expo Router color tokens — Pokémon Center palette
 *
 * This file is consumed by Expo Router's default tab navigator and
 * any component that reads from `constants/Colors`.  It mirrors the
 * canonical palette defined in `src/theme/colors.ts` but in the
 * light/dark shape that Expo expects.
 */

const tintColorLight = '#E53935'; // Center Red
const tintColorDark = '#FF6F61'; // Coral Red (better contrast on dark bg)

export default {
  light: {
    text: '#212121',
    background: '#FFF8F8',
    tint: tintColorLight,
    tabIconDefault: '#757575',
    tabIconSelected: tintColorLight,
    // Extended tokens
    card: '#FFFFFF',
    border: '#E0E0E0',
    notification: '#D32F2F',
    primary: '#E53935',
    secondary: '#F48FB1',
    accent: '#3B4CCA',
    success: '#43A047',
    warning: '#FB8C00',
    error: '#D32F2F',
  },
  dark: {
    text: '#FAFAFA',
    background: '#1A1A1A',
    tint: tintColorDark,
    tabIconDefault: '#9E9E9E',
    tabIconSelected: tintColorDark,
    // Extended tokens
    card: '#2C2C2C',
    border: '#424242',
    notification: '#EF5350',
    primary: '#FF6F61',
    secondary: '#F48FB1',
    accent: '#7986CB',
    success: '#66BB6A',
    warning: '#FFA726',
    error: '#EF5350',
  },
};
