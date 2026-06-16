import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Spacing, BorderRadius } from '../../src/theme/spacing';
import { DoseCard } from '../../src/components/medication/DoseCard';
import type { DoseStatus } from '../../src/models/Dose';
import { router, useFocusEffect } from 'expo-router';
import { useDoseStore } from '../../src/stores';
import { generateDosesForDay, getDosesByDateRange, DoseWithMedication } from '../../src/services/medicationService';
import { getDayBounds } from '../../src/utils/dateUtils';
import { MEDICATION_FORM_ICONS, MedicationForm } from '../../src/models/Medication';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };
  return now.toLocaleDateString('pt-BR', options);
}

const formatDoseTime = (scheduledAt: number) => {
  const date = new Date(scheduledAt);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const doses = useDoseStore((state) => state.todayDoses) as DoseWithMedication[];

  const fetchDoses = useCallback(() => {
    try {
      // 1. Generate doses for today
      generateDosesForDay(new Date());
      
      // 2. Fetch bounds
      const bounds = getDayBounds(new Date());
      
      // 3. Query actual doses
      const dbDoses = getDosesByDateRange(bounds.start, bounds.end);
      
      // 4. Set in store
      useDoseStore.getState().setTodayDoses(dbDoses);
    } catch (e) {
      console.error('Failed to fetch today doses:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDoses();
    }, [fetchDoses])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoses();
    setTimeout(() => setRefreshing(false), 800);
  }, [fetchDoses]);

  const takenCount = doses.filter(d => d.status === 'taken').length;
  const totalCount = doses.length;
  const progressPercent = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

  const pendingDoses = doses.filter(d => d.status === 'pending');
  const completedDoses = doses.filter(d => d.status !== 'pending');
  const nextDose = pendingDoses[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                <Text style={styles.dateText}>{formatDate()}</Text>
              </View>
              <View style={styles.streakBadge}>
                <MaterialCommunityIcons name="fire" size={18} color="#FF6F61" />
                <Text style={styles.streakText}>7 dias</Text>
              </View>
            </View>

            {/* Progress Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progresso do Dia</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(progressPercent)}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressSubtext}>
                {takenCount} de {totalCount} medicamentos tomados
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Doses List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Next Dose Highlight */}
        {nextDose && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="bell-ring"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.sectionTitle}>Próxima Dose</Text>
            </View>
            <DoseCard
              medicationName={nextDose.medicationName}
              dosage={nextDose.dosage}
              time={formatDoseTime(nextDose.scheduledAt)}
              status={nextDose.status}
              iconName={MEDICATION_FORM_ICONS[nextDose.form as MedicationForm] || 'pill'}
              medicationColor={nextDose.color}
              onPress={() => {}}
              onTakePhoto={() => {
                router.push({
                  pathname: '/verification/camera',
                  params: { doseId: nextDose.id },
                });
              }}
            />
          </View>
        )}

        {/* Pending Doses */}
        {pendingDoses.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={Colors.warning}
              />
              <Text style={styles.sectionTitle}>
                Pendentes ({pendingDoses.length - 1})
              </Text>
            </View>
            {pendingDoses.slice(1).map((dose) => (
              <DoseCard
                key={dose.id}
                medicationName={dose.medicationName}
                dosage={dose.dosage}
                time={formatDoseTime(dose.scheduledAt)}
                status={dose.status}
                iconName={MEDICATION_FORM_ICONS[dose.form as MedicationForm] || 'pill'}
                medicationColor={dose.color}
                onPress={() => {}}
                onTakePhoto={() => {
                  router.push({
                    pathname: '/verification/camera',
                    params: { doseId: dose.id },
                  });
                }}
              />
            ))}
          </View>
        )}

        {/* Completed Doses */}
        {completedDoses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={Colors.success}
              />
              <Text style={styles.sectionTitle}>
                Concluídos ({completedDoses.length})
              </Text>
            </View>
            {completedDoses.map((dose) => (
              <DoseCard
                key={dose.id}
                medicationName={dose.medicationName}
                dosage={dose.dosage}
                time={formatDoseTime(dose.scheduledAt)}
                status={dose.status}
                iconName={MEDICATION_FORM_ICONS[dose.form as MedicationForm] || 'pill'}
                medicationColor={dose.color}
                onPress={() => {}}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {doses.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="pill-off"
              size={64}
              color={Colors.secondary}
            />
            <Text style={styles.emptyTitle}>Nenhum medicamento hoje</Text>
            <Text style={styles.emptySubtitle}>
              Adicione seus medicamentos para começar a receber lembretes
            </Text>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  headerSection: {
    overflow: 'hidden',
  },
  headerGradient: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    marginLeft: 4,
  },

  // Progress
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
  },
  progressSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },

  // Sections
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
});
