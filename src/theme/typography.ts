import { TextStyle } from 'react-native';

/**
 * Cyber Nurse — Typography Scale
 *
 * Uses the system font stack for now.  Once Inter is loaded via
 * expo-font the `fontFamily` values can be swapped in one place.
 *
 * Every text element in the app should reference one of these variants
 * to guarantee a consistent typographic hierarchy.
 */

/** Base font family — swap to 'Inter' once loaded */
const FONT_FAMILY = undefined; // undefined = system default

/** Weight map for readability */
const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const Typography = {
  h1: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  } satisfies TextStyle,

  h2: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.2,
  } satisfies TextStyle,

  h3: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0,
  } satisfies TextStyle,

  h4: {
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: FontWeight.medium,
    letterSpacing: 0,
  } satisfies TextStyle,

  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.15,
  } satisfies TextStyle,

  bodySmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.25,
  } satisfies TextStyle,

  caption: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: FontWeight.regular,
    letterSpacing: 0.4,
  } satisfies TextStyle,

  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.1,
  } satisfies TextStyle,

  button: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  } satisfies TextStyle,
} as const;

/** Type-safe typography variant key */
export type TypographyVariant = keyof typeof Typography;

export { FontWeight };
export default Typography;
