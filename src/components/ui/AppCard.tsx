import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle | (ViewStyle | undefined | false)[];
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'highlight';
  padding?: keyof typeof Spacing;
}

export function AppCard({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
}: AppCardProps) {
  const variantStyles: Record<string, ViewStyle> = {
    default: {
      shadowColor: Colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    elevated: {
      shadowColor: Colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 6,
    },
    outlined: {
      borderWidth: 1,
      borderColor: Colors.surfaceAlt,
    },
    highlight: {
      backgroundColor: Colors.secondaryLight,
      borderWidth: 1,
      borderColor: Colors.secondary,
    },
  };

  const cardStyle: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    { padding: Spacing[padding] },
    ...(Array.isArray(style) ? style.filter(Boolean) as ViewStyle[] : style ? [style] : []),
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
});
