import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'large' | 'transparent';
}

export function AppHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
  variant = 'default',
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        variant === 'transparent' ? styles.transparent : styles.solid,
        { paddingTop: insets.top + Spacing.sm },
        style,
      ]}
    >
      <StatusBar
        barStyle={variant === 'transparent' ? 'dark-content' : 'light-content'}
        backgroundColor={variant === 'transparent' ? 'transparent' : Colors.primary}
        translucent={variant === 'transparent'}
      />
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {leftAction}
        </View>
        <View style={styles.titleContainer}>
          <Text
            style={[
              variant === 'large' ? styles.titleLarge : styles.title,
              variant === 'transparent' ? styles.titleDark : styles.titleLight,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                variant === 'transparent' ? styles.subtitleDark : styles.subtitleLight,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.rightContainer}>
          {rightAction}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  solid: {
    backgroundColor: Colors.primary,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  leftContainer: {
    width: 44,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: '700',
  },
  titleLight: {
    color: Colors.white,
  },
  titleDark: {
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  subtitleLight: {
    color: 'rgba(255,255,255,0.8)',
  },
  subtitleDark: {
    color: Colors.textSecondary,
  },
});
