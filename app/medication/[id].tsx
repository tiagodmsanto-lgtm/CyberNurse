import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Mock medication data
const MOCK_MEDICATION = {
  id: '1',
  name: 'Metformina',
  dosage: '850mg',
  form: 'Comprimido',
  color: '#3B4CCA',
  instructions: 'Tomar após o almoço',
  iconName: 'pill',
  schedule: {
    frequency: 'Diariamente',
    times: ['08:00', '12:00', '20:00'],
    mealRelation: 'Após refeição',
  },
  stock: {
    current: 23,
    min: 5,
    expiry: '15/12/2026',
  },
  adherence: 87,
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const med = MOCK_MEDICATION;

  const handleDelete = () => {
    Alert.alert(
      'Excluir Medicamento',
      `Deseja realmente excluir ${med.name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <TouchableOpacity
          onPress={() => {}}
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
              { backgroundColor: `${med.color}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={med.iconName as any}
              size={48}
              color={med.color}
            />
          </View>
          <Text style={styles.heroName}>{med.name}</Text>
          <Text style={styles.heroDosage}>{med.dosage} • {med.form}</Text>
          {med.instructions && (
            <View style={styles.instructionBadge}>
              <MaterialCommunityIcons
                name="information-outline"
                size={14}
                color={C.accent}
              />
              <Text style={styles.instructionText}>{med.instructions}</Text>
            </View>
          )}
        </View>

        {/* Adherence */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adesão ao Tratamento</Text>
          <View style={styles.adherenceRow}>
            <View style={styles.adherenceCircle}>
              <Text style={styles.adherencePercent}>{med.adherence}%</Text>
            </View>
            <View style={styles.adherenceInfo}>
              <Text style={styles.adherenceLabel}>Taxa de adesão dos últimos 30 dias</Text>
              <View style={styles.adherenceBarBg}>
                <View
                  style={[
                    styles.adherenceBarFill,
                    { width: `${med.adherence}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agendamento</Text>
          <InfoRow icon="calendar-repeat" label="Frequência" value={med.schedule.frequency} />
          <InfoRow icon="silverware-fork-knife" label="Refeição" value={med.schedule.mealRelation} />
          <View style={styles.timesRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={C.textSecondary} />
            <Text style={styles.infoLabel}>Horários</Text>
            <View style={styles.timeBadges}>
              {med.schedule.times.map((time, i) => (
                <View key={i} style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>{time}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stock */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estoque</Text>
          <InfoRow icon="package-variant" label="Quantidade" value={`${med.stock.current} unidades`} />
          <InfoRow icon="alert-circle-outline" label="Alerta em" value={`${med.stock.min} unidades`} />
          <InfoRow icon="calendar-end" label="Validade" value={med.stock.expiry} />
          <View style={styles.stockBar}>
            <View
              style={[
                styles.stockBarFill,
                {
                  width: `${Math.min((med.stock.current / 60) * 100, 100)}%`,
                  backgroundColor: med.stock.current <= med.stock.min ? C.warning : C.success,
                },
              ]}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionRow} onPress={() => {}}>
            <MaterialCommunityIcons name="archive-outline" size={22} color={C.textSecondary} />
            <Text style={styles.actionText}>Arquivar medicamento</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={C.error} />
            <Text style={[styles.actionText, { color: C.error }]}>Excluir medicamento</Text>
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
