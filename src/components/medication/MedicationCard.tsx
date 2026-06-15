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
import type { Medication } from '../../models/Medication';
import { MEDICATION_FORM_ICONS, MEDICATION_FORM_LABELS } from '../../models/Medication';

interface MedicationCardProps {
  medication: Medication;
  onPress: () => void;
  onEdit?: () => void;
  stockQuantity?: number;
  stockThreshold?: number;
}

export function MedicationCard({
  medication,
  onPress,
  onEdit,
  stockQuantity,
  stockThreshold = 5,
}: MedicationCardProps) {
  const iconName = MEDICATION_FORM_ICONS[medication.form] || 'medical-bag';
  const formLabel = MEDICATION_FORM_LABELS[medication.form] || 'Outro';
  const isLowStock = stockQuantity !== undefined && stockQuantity <= stockThreshold;

  return (
    <AppCard onPress={onPress} variant="default" style={styles.card}>
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: medication.color
                ? `${medication.color}20`
                : Colors.secondaryLight,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName as any}
            size={32}
            color={medication.color || Colors.primary}
          />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {medication.name}
          </Text>
          <Text style={styles.details}>
            {medication.dosage} • {formLabel}
          </Text>
          {medication.instructions && (
            <Text style={styles.instructions} numberOfLines={1}>
              {medication.instructions}
            </Text>
          )}

          {/* Stock indicator */}
          {stockQuantity !== undefined && (
            <View style={styles.stockRow}>
              <MaterialCommunityIcons
                name="package-variant"
                size={14}
                color={isLowStock ? Colors.warning : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.stockText,
                  isLowStock && styles.stockLow,
                ]}
              >
                {stockQuantity} un. restantes
              </Text>
              {isLowStock && (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockText}>Estoque baixo!</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!medication.isActive && (
            <View style={styles.archivedBadge}>
              <Text style={styles.archivedText}>Arquivado</Text>
            </View>
          )}
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={Colors.textSecondary}
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  details: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  instructions: {
    fontSize: 13,
    color: Colors.accent,
    marginTop: 2,
    fontStyle: 'italic',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stockText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  stockLow: {
    color: Colors.warning,
    fontWeight: '600',
  },
  lowStockBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: 6,
  },
  lowStockText: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: '700',
  },
  actionsContainer: {
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  editButton: {
    padding: 4,
    marginBottom: 4,
  },
  archivedBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
  },
  archivedText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
