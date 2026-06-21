import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  getMedicationById, 
  getSchedulesByMedicationId, 
  getStockByMedicationId, 
  deleteMedication, 
  archiveMedication 
} from '../../src/services/medicationService';
import { useMedicationStore } from '../../src/stores';
import { MEDICATION_FORM_ICONS, MEDICATION_FORM_LABELS, MedicationForm } from '../../src/models/Medication';
import { FREQUENCY_TYPE_LABELS, MEAL_RELATION_LABELS, FrequencyType, MealRelation } from '../../src/models/Schedule';
import { formatShortDate } from '../../src/utils/dateUtils';
import { useTranslation } from 'react-i18next';

const C = {
  primary: '#E53935',
  primaryLight: '#FF6F61',
  primaryDark: '#B71C1C',
  secondary: '#F48FB1',
  secondaryLight: '#FCE4EC',
  accent: '#3B4CCA',
  background: '#FFF8F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F0F0',
  textPrimary: '#212121',
  textSecondary: '#757575',
  success: '#43A047',
  warning: '#FB8C00',
  error: '#D32F2F',
  white: '#FFFFFF',
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={20} color={C.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function MedicationDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [medication, setMedication] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [stock, setStock] = useState<any>(null);
  const [adherence, setAdherence] = useState<number>(100);

  const loadData = useCallback(() => {
    if (!id) return;
    try {
      const dbMed = getMedicationById(id);
      if (dbMed) {
        setMedication(dbMed);
        
        const dbScheds = getSchedulesByMedicationId(id);
        setSchedule(dbScheds[0] || null);
        
        const dbStock = getStockByMedicationId(id);
        setStock(dbStock);

        const db = require('../../src/services/database').getDatabase();
        const medDoses = db.getAllSync('SELECT status FROM doses WHERE medicationId = ?', [id]);
        if (medDoses.length > 0) {
          const takenCount = medDoses.filter((d: any) => d.status === 'taken').length;
          setAdherence(Math.round((takenCount / medDoses.length) * 100));
        } else {
          setAdherence(100);
        }
      }
    } catch (e) {
      console.error('Failed to load medication details:', e);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = () => {
    if (!medication) return;
    Alert.alert(
      t('medDetail.alerts.deleteTitle'),
      t('medDetail.alerts.deleteMsg', { name: medication.name }),
      [
        { text: t('medDetail.alerts.cancel'), style: 'cancel' },
        {
          text: t('medDetail.alerts.delete'),
          style: 'destructive',
          onPress: () => {
            try {
              deleteMedication(medication.id);
              useMedicationStore.getState().removeMedication(medication.id);
              router.back();
            } catch (e) {
              console.error('Failed to delete medication:', e);
              Alert.alert(t('medDetail.alerts.error'), t('medDetail.alerts.deleteError'));
            }
          },
        },
      ]
    );
  };

  const handleArchive = () => {
    if (!medication) return;
    try {
      archiveMedication(medication.id);
      useMedicationStore.getState().updateMedication(medication.id, { isActive: false });
      Alert.alert(
        t('medDetail.alerts.archivedTitle'),
        t('medDetail.alerts.archivedMsg', { name: medication.name }),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      console.error('Failed to archive medication:', e);
      Alert.alert(t('medDetail.alerts.error'), t('medDetail.alerts.archiveError'));
    }
  };

  if (!medication) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.textSecondary }}>{t('medDetail.loading')}</Text>
      </View>
    );
  }

  const iconName = MEDICATION_FORM_ICONS[medication.form as MedicationForm] || 'medical-bag';
  const formLabel = MEDICATION_FORM_LABELS[medication.form as MedicationForm] || 'Outro';
  const currentStock = stock ? stock.currentQuantity : 0;
  const minStock = stock ? stock.minThreshold : 5;
  const expiryLabel = stock && stock.expiryDate ? formatShortDate(stock.expiryDate) : t('medDetail.noExpiry');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('medDetail.title')}</Text>
        <TouchableOpacity
          onPress={() => router.push(`/medication/edit?id=${medication.id}`)}
          style={styles.editButton}
        >
          <MaterialCommunityIcons name="pencil" size={20} color={C.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Medication Hero */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: `${medication.color}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={iconName as any}
              size={48}
              color={medication.color}
            />
          </View>
          <Text style={styles.heroName}>{medication.name}</Text>
          <Text style={styles.heroDosage}>{medication.dosage} • {formLabel}</Text>
          {medication.instructions && (
            <View style={styles.instructionBadge}>
              <MaterialCommunityIcons
                name="information-outline"
                size={14}
                color={C.accent}
              />
              <Text style={styles.instructionText}>{medication.instructions}</Text>
            </View>
          )}
        </View>

        {/* Adherence */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('medDetail.adherenceTitle')}</Text>
          <View style={styles.adherenceRow}>
            <View style={styles.adherenceCircle}>
              <Text style={styles.adherencePercent}>{adherence}%</Text>
            </View>
            <View style={styles.adherenceInfo}>
              <Text style={styles.adherenceLabel}>{t('medDetail.adherenceSubtitle')}</Text>
              <View style={styles.adherenceBarBg}>
                <View
                  style={[
                    styles.adherenceBarFill,
                    { width: `${adherence}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('medDetail.scheduleTitle')}</Text>
          <InfoRow 
            icon="calendar-repeat" 
            label={t('medDetail.freqLabel')} 
            value={schedule ? FREQUENCY_TYPE_LABELS[schedule.frequencyType as FrequencyType] : 'Diariamente'} 
          />
          <InfoRow 
            icon="silverware-fork-knife" 
            label={t('medDetail.mealLabel')} 
            value={schedule ? MEAL_RELATION_LABELS[schedule.mealRelation as MealRelation] : t('medDetail.noRelation')} 
          />
          <View style={styles.timesRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={C.textSecondary} />
            <Text style={styles.infoLabel}>{t('medDetail.timesLabel')}</Text>
            <View style={styles.timeBadges}>
              {schedule && schedule.times ? schedule.times.map((time: string, i: number) => (
                <View key={i} style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>{time}</Text>
                </View>
              )) : (
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>—</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stock */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('medDetail.stockTitle')}</Text>
          <InfoRow icon="package-variant" label={t('medDetail.qtyLabel')} value={`${currentStock} ${t('medDetail.units')}`} />
          <InfoRow icon="alert-circle-outline" label={t('medDetail.alertLabel')} value={`${minStock} ${t('medDetail.units')}`} />
          <InfoRow icon="calendar-end" label={t('medDetail.expiryLabel')} value={expiryLabel} />
          <View style={styles.stockBar}>
            <View
              style={[
                styles.stockBarFill,
                {
                  width: `${Math.min((currentStock / 60) * 100, 100)}%`,
                  backgroundColor: currentStock <= minStock ? C.warning : C.success,
                },
              ]}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={handleArchive}>
            <MaterialCommunityIcons name="archive-outline" size={22} color={C.textSecondary} />
            <Text style={styles.actionText}>{t('medDetail.archiveBtn')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={C.error} />
            <Text style={[styles.actionText, { color: C.error }]}>{t('medDetail.deleteBtn')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={C.error} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.white,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Hero
  heroCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: C.textPrimary,
  },
  heroDosage: {
    fontSize: 16,
    color: C.textSecondary,
    marginTop: 4,
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  instructionText: {
    fontSize: 13,
    color: C.accent,
    fontWeight: '500',
    marginLeft: 6,
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 12,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: C.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },

  // Times
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  timeBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  timeBadge: {
    backgroundColor: C.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },

  // Adherence
  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adherenceCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: C.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adherencePercent: {
    fontSize: 18,
    fontWeight: '700',
    color: C.success,
  },
  adherenceInfo: {
    flex: 1,
  },
  adherenceLabel: {
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 8,
  },
  adherenceBarBg: {
    height: 6,
    backgroundColor: C.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  adherenceBarFill: {
    height: '100%',
    backgroundColor: C.success,
    borderRadius: 3,
  },

  // Stock bar
  stockBar: {
    height: 6,
    backgroundColor: C.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Actions
  actionsCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 15,
    color: C.textPrimary,
    flex: 1,
    marginLeft: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: C.surfaceAlt,
    marginLeft: 48,
  },
});
