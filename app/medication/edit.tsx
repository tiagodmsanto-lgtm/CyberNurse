import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  getMedicationById, 
  getSchedulesByMedicationId, 
  getStockByMedicationId,
  updateSchedule,
  updateStockExpiry
} from '../../src/services/medicationService';

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
  black: '#000000',
};

type FrequencyType = 'daily' | 'specific_days' | 'interval';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function EditMedicationScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [medication, setMedication] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [stock, setStock] = useState<any>(null);

  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [intervalHours, setIntervalHours] = useState('8');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [expiryDate, setExpiryDate] = useState('');

  const getFrequencyOptions = (t: any) => [
    {
      key: 'daily',
      label: t('addMedication.frequency.daily', 'Todos os dias'),
      description: t('addMedication.frequency.dailyDesc', 'Uma ou mais vezes ao dia'),
      icon: 'calendar-today',
    },
    {
      key: 'specific_days',
      label: t('addMedication.frequency.specificDays', 'Dias específicos'),
      description: t('addMedication.frequency.specificDaysDesc', 'Ex: Seg, Qua, Sex'),
      icon: 'calendar-week',
    },
    {
      key: 'interval',
      label: t('addMedication.frequency.interval', 'Intervalo de horas'),
      description: t('addMedication.frequency.intervalDesc', 'Ex: A cada 8 horas'),
      icon: 'clock-fast',
    },
  ];

  useEffect(() => {
    if (!id) return;
    const dbMed = getMedicationById(id);
    if (!dbMed) {
      router.back();
      return;
    }
    setMedication(dbMed);

    const dbScheds = getSchedulesByMedicationId(id);
    if (dbScheds.length > 0) {
      const sched = dbScheds[0];
      setSchedule(sched);
      setFrequencyType(sched.frequencyType as FrequencyType);
      
      try {
        if (sched.frequencyType === 'specific_days') {
          const val = JSON.parse(sched.frequencyValue);
          if (val && val.days) setSelectedDays(val.days);
        } else if (sched.frequencyType === 'interval') {
          const val = JSON.parse(sched.frequencyValue);
          if (val && val.hours) setIntervalHours(String(val.hours));
        }
      } catch (e) {}
      
      setTimes(sched.times || ['08:00']);
    }

    const dbStock = getStockByMedicationId(id);
    if (dbStock) {
      setStock(dbStock);
      if (dbStock.expiryDate) {
        const d = new Date(dbStock.expiryDate);
        const dayStr = String(d.getDate()).padStart(2, '0');
        const monthStr = String(d.getMonth() + 1).padStart(2, '0');
        const yearStr = String(d.getFullYear());
        setExpiryDate(`${dayStr}/${monthStr}/${yearStr}`);
      }
    }
  }, [id]);

  const addTime = () => setTimes((prev) => [...prev, '12:00']);
  const removeTime = (index: number) => setTimes((prev) => prev.filter((_, i) => i !== index));

  const updateTime = (index: number, value: string) => {
    let formatted = value.replace(/[^0-9]/g, '');
    if (formatted.length > 4) formatted = formatted.slice(0, 4);
    if (formatted.length >= 3) {
      formatted = formatted.slice(0, 2) + ':' + formatted.slice(2);
    }
    setTimes((prev) => {
      const next = [...prev];
      next[index] = formatted;
      return next;
    });
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleExpiryDateChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length >= 3 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length >= 5) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    }
    setExpiryDate(formatted);
  };

  const handleSave = () => {
    if (!schedule) return;

    // Validate times
    if (times.length === 0 || !times.every(t => t.match(/^\d{2}:\d{2}$/))) {
      Alert.alert('Erro', 'Por favor, preencha todos os horários corretamente.');
      return;
    }

    const freqValue =
      frequencyType === 'daily'
        ? '{}'
        : frequencyType === 'specific_days'
        ? JSON.stringify({ days: selectedDays })
        : JSON.stringify({ hours: parseInt(intervalHours, 10) });

    try {
      updateSchedule(schedule.id, frequencyType, freqValue, JSON.stringify(times));

      if (stock) {
        let parsedExpiry: number | null = null;
        if (expiryDate.trim()) {
          const parts = expiryDate.split('/');
          if (parts.length === 3) {
            let year = parseInt(parts[2], 10);
            if (year < 100) year += 2000;
            const date = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            parsedExpiry = date.getTime();
          }
        }
        updateStockExpiry(stock.id, parsedExpiry);
      }

      router.back();
    } catch (e) {
      console.error('Failed to update medication:', e);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar as alterações.');
    }
  };

  if (!medication) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Medicamento</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Salvar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequência</Text>
          {getFrequencyOptions(t).map((option) => {
            const isSelected = frequencyType === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.frequencyCard, isSelected && styles.frequencyCardSelected]}
                onPress={() => setFrequencyType(option.key as FrequencyType)}
              >
                <View style={[styles.frequencyIconContainer, isSelected && styles.frequencyIconContainerSelected]}>
                  <MaterialCommunityIcons name={option.icon as any} size={24} color={isSelected ? C.white : C.textSecondary} />
                </View>
                <View style={styles.frequencyTextContainer}>
                  <Text style={[styles.frequencyLabel, isSelected && styles.frequencyLabelSelected]}>{option.label}</Text>
                  <Text style={styles.frequencyDescription}>{option.description}</Text>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Specific Days */}
        {frequencyType === 'specific_days' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dias da Semana</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, index) => {
                const isSelected = selectedDays.includes(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.weekdayChip, isSelected && styles.weekdayChipSelected]}
                    onPress={() => toggleDay(index)}
                  >
                    <Text style={[styles.weekdayText, isSelected && styles.weekdayTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Interval Hours */}
        {frequencyType === 'interval' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intervalo (Horas)</Text>
            <View style={styles.intervalRow}>
              {['4', '6', '8', '12'].map((h) => {
                const isSelected = intervalHours === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[styles.intervalChip, isSelected && styles.intervalChipSelected]}
                    onPress={() => setIntervalHours(h)}
                  >
                    <Text style={[styles.intervalText, isSelected && styles.intervalTextSelected]}>{h}h</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Times */}
        <View style={styles.section}>
          <View style={styles.timesHeader}>
            <Text style={styles.sectionTitle}>Horários</Text>
            <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
              <MaterialCommunityIcons name="plus" size={18} color={C.primary} />
              <Text style={styles.addTimeText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          {times.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <View style={styles.timeInputWrapper}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={C.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.timeInput}
                  value={time}
                  onChangeText={(v) => updateTime(index, v)}
                  placeholder="00:00"
                  placeholderTextColor={C.textSecondary}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              {times.length > 1 && (
                <TouchableOpacity style={styles.removeTimeButton} onPress={() => removeTime(index)}>
                  <MaterialCommunityIcons name="close-circle" size={24} color={C.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Expiry Date */}
        {stock && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Validade</Text>
            <View style={styles.timeInputWrapper}>
              <MaterialCommunityIcons name="calendar-end" size={20} color={C.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.timeInput}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={C.textSecondary}
                value={expiryDate}
                onChangeText={handleExpiryDateChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
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
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  saveButtonText: {
    color: C.white,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 16,
  },
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyCardSelected: {
    backgroundColor: C.secondaryLight,
    borderColor: C.primary,
  },
  frequencyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  frequencyIconContainerSelected: {
    backgroundColor: C.primary,
  },
  frequencyTextContainer: {
    flex: 1,
  },
  frequencyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 2,
  },
  frequencyLabelSelected: {
    color: C.primary,
  },
  frequencyDescription: {
    fontSize: 13,
    color: C.textSecondary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioOuterSelected: {
    borderColor: C.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primary,
  },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekdayChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  weekdayChipSelected: {
    backgroundColor: C.secondaryLight,
    borderColor: C.primary,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },
  weekdayTextSelected: {
    color: C.primary,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  intervalChipSelected: {
    backgroundColor: C.secondaryLight,
    borderColor: C.primary,
  },
  intervalText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSecondary,
  },
  intervalTextSelected: {
    color: C.primary,
  },
  timesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.secondaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: C.textPrimary,
  },
  removeTimeButton: {
    marginLeft: 12,
    padding: 4,
  },
});
