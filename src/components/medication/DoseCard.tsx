import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { AppCard } from '../ui/AppCard';
import type { DoseStatus } from '../../models/Dose';

interface DoseCardProps {
  medicationName: string;
  dosage: string;
  time: string;
  status: DoseStatus;
  iconName: string;
  medicationColor?: string;
  onPress: () => void;
  onTakePhoto?: () => void;
}

const STATUS_CONFIG: Record<DoseStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  pending: {
    label: 'Pendente',
    color: Colors.warning,
    bgColor: '#FFF3E0',
    icon: 'clock-outline',
  },
  taken: {
    label: 'Tomado ✓',
    color: Colors.success,
    bgColor: '#E8F5E9',
    icon: 'check-circle',
  },
  missed: {
    label: 'Perdido',
    color: Colors.error,
    bgColor: '#FFEBEE',
    icon: 'close-circle',
  },
  skipped: {
    label: 'Pulado',
    color: Colors.textSecondary,
    bgColor: Colors.surfaceAlt,
    icon: 'skip-next-circle',
  },
  refused: {
    label: 'Recusado',
    color: Colors.error,
    bgColor: '#FFEBEE',
    icon: 'cancel',
  },
};

export function DoseCard({
  medicationName,
  dosage,
  time,
  status,
  iconName,
  medicationColor,
  onPress,
  onTakePhoto,
}: DoseCardProps) {
  const config = STATUS_CONFIG[status];
  const isPending = status === 'pending';

  return (
    <AppCard
      onPress={onPress}
      variant={isPending ? 'elevated' : 'default'}
      style={[
        styles.card,
        isPending && styles.pendingCard,
      ]}
    >
      <View style={styles.content}>
        {/* Medication Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: medicationColor ? `${medicationColor}20` : Colors.secondaryLight },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName as any}
            size={28}
            color={medicationColor || Colors.primary}
          />
        </View>

        {/* Medication Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.medicationName} numberOfLines={1}>
            {medicationName}
          </Text>
          <Text style={styles.dosage}>{dosage}</Text>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>

        {/* Status / Action */}
        <View style={styles.actionContainer}>
          {isPending ? (
            <TouchableOpacity
              style={styles.takePhotoButton}
              onPress={onTakePhoto}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="camera"
                size={20}
                color={Colors.white}
              />
              <Text style={styles.takePhotoText}>Foto</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
              <MaterialCommunityIcons
                name={config.icon as any}
                size={16}
                color={config.color}
              />
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          )}
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dosage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  actionContainer: {
    marginLeft: Spacing.sm,
  },
  takePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  takePhotoText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
