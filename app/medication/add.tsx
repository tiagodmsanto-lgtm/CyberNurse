import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createMedication, generateDosesForDay, searchMedications, searchAlimentos } from '../../src/services/medicationService';
import { getDatabase, generateId } from '../../src/services/database';
import { useMedicationStore } from '../../src/stores';
import { logMedicationAdded } from '../../src/services/analytics';

// ─── Inline Color Palette (Pokémon Center) ──────────────
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
  overlay: 'rgba(0,0,0,0.5)',
  cardShadow: 'rgba(0,0,0,0.08)',
} as const;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────
type MedicationFormType =
  | 'comprimido'
  | 'capsula'
  | 'liquido'
  | 'injecao'
  | 'pomada'
  | 'gotas'
  | 'outro';

type FrequencyType = 'daily' | 'specific_days' | 'interval';

interface FormItem {
  key: MedicationFormType;
  label: string;
  icon: string;
}

interface FrequencyOption {
  key: FrequencyType;
  label: string;
  description: string;
  icon: string;
}

// ─── Constants ──────────────────────────────────────────
const FORM_OPTIONS: FormItem[] = [
  { key: 'comprimido', label: 'Comprimido', icon: 'pill' },
  { key: 'capsula', label: 'Cápsula', icon: 'pill' },
  { key: 'liquido', label: 'Líquido', icon: 'bottle-tonic' },
  { key: 'injecao', label: 'Injeção', icon: 'needle' },
  { key: 'pomada', label: 'Pomada', icon: 'medical-bag' },
  { key: 'gotas', label: 'Gotas', icon: 'eyedropper' },
  { key: 'outro', label: 'Outro', icon: 'medical-bag' },
];

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    key: 'daily',
    label: 'Diariamente',
    description: 'Todos os dias',
    icon: 'calendar-today',
  },
  {
    key: 'specific_days',
    label: 'Dias específicos',
    description: 'Escolher dias da semana',
    icon: 'calendar-week',
  },
  {
    key: 'interval',
    label: 'Intervalo',
    description: 'A cada X horas',
    icon: 'clock-fast',
  },
];

const STEP_LABELS = ['Medicamento', 'Horários', 'Estoque', 'Revisão'];

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const COLOR_PRESETS = [
  '#E53935', '#3B4CCA', '#43A047', '#FB8C00',
  '#7E57C2', '#F48FB1', '#00897B', '#5C6BC0',
];

// ─── Component ──────────────────────────────────────────
export default function AddMedicationScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const stepAnim = useRef(new Animated.Value(0)).current;

  // Step state
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Name + Dosage + Form
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedForm, setSelectedForm] = useState<MedicationFormType | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [instructions, setInstructions] = useState('');

  // Autocomplete state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    if (text.length >= 3) {
      try {
        const meds = searchMedications(text, 5);
        const foods = searchAlimentos(text, 3);
        setSearchResults([...meds, ...foods]);
        setShowDropdown(true);
      } catch (e) {
        console.warn('Autocomplete query error:', e);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, []);

  // Step 2: Schedule
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [intervalHours, setIntervalHours] = useState('8');
  const [times, setTimes] = useState<string[]>(['08:00']);

  // Step 3: Stock
  const [initialQuantity, setInitialQuantity] = useState('');
  const [minThreshold, setMinThreshold] = useState('5');
  const [expiryDate, setExpiryDate] = useState('');

  // ─── Navigation helpers ───────────────────────────────
  const animateStep = useCallback((toStep: number) => {
    Animated.spring(stepAnim, {
      toValue: toStep,
      useNativeDriver: false,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [stepAnim]);

  const goNext = useCallback(() => {
    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      animateStep(nextStep);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [currentStep, animateStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      animateStep(prevStep);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      router.back();
    }
  }, [currentStep, animateStep]);

  // ─── Validation per step ──────────────────────────────
  const isStepValid = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return name.trim().length > 0 && dosage.trim().length > 0 && selectedForm !== null;
      case 1:
        return times.length > 0 && times.every((t) => t.match(/^\d{2}:\d{2}$/));
      case 2:
        return true; // Stock is optional
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, name, dosage, selectedForm, times]);

  // ─── Add / remove schedule time ───────────────────────
  const addTime = useCallback(() => {
    setTimes((prev) => [...prev, '12:00']);
  }, []);

  const removeTime = useCallback((index: number) => {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateTime = useCallback((index: number, value: string) => {
    // Auto-format: insert colon after 2 digits
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
  }, []);

  // ─── Toggle weekday ───────────────────────────────────
  const toggleDay = useCallback((day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort()
    );
  }, []);

  // ─── Save handler ─────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!selectedForm) return;

    try {
      // 1. Create medication in DB
      const newMed = createMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        form: selectedForm as any,
        color: selectedColor,
        photoUri: null,
        instructions: instructions.trim() || null,
        isActive: true,
      });

      // 2. Create schedule in DB
      const freqValue =
        frequencyType === 'daily'
          ? '{}'
          : frequencyType === 'specific_days'
          ? JSON.stringify({ days: selectedDays })
          : JSON.stringify({ hours: parseInt(intervalHours, 10) });

      const db = getDatabase();
      const scheduleId = generateId();
      db.runSync(
        `INSERT INTO schedules 
           (id, medicationId, frequencyType, frequencyValue, times, startDate, endDate, mealRelation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scheduleId,
          newMed.id,
          frequencyType,
          freqValue,
          JSON.stringify(times),
          Date.now(),
          null,
          'none',
        ]
      );

      // 3. Create stock in DB
      const qty = parseFloat(initialQuantity);
      const threshold = parseFloat(minThreshold) || 5;
      
      let parsedExpiry: number | null = null;
      if (expiryDate.trim()) {
        const [dayStr, monthStr, yearStr] = expiryDate.split('/');
        if (dayStr && monthStr && yearStr) {
          let year = parseInt(yearStr, 10);
          // Correção do Bug de Date do Javascript: 
          // Anos < 100 são traduzidos para 19xx. '24' vira 1924 se não corrigirmos.
          if (year < 100) {
            year += 2000;
          }
          const date = new Date(
            year,
            parseInt(monthStr, 10) - 1,
            parseInt(dayStr, 10)
          );
          parsedExpiry = date.getTime();
        }
      }

      const stockId = generateId();
      db.runSync(
        `INSERT INTO stock 
           (id, medicationId, currentQuantity, minThreshold, expiryDate, lastRefillDate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          stockId,
          newMed.id,
          isNaN(qty) ? 0 : qty,
          threshold,
          parsedExpiry,
          Date.now(),
        ]
      );

      // 4. Generate doses for today
      generateDosesForDay(new Date());

      // 5. Update medication store
      useMedicationStore.getState().addMedication(newMed);
      
      // Log event to Analytics
      logMedicationAdded(newMed.name, times.length);

      if (Platform.OS === 'web') {
        window.alert(`Medicamento Salvo!\n${name} (${dosage}) foi adicionado com sucesso.`);
      } else {
        Alert.alert(
          'Medicamento Salvo! 💊',
          `${name} (${dosage}) foi adicionado com sucesso.`,
          [{ text: 'OK' }]
        );
      }
      
      // Automatically redirect to the medications tab
      router.replace('/medications');
    } catch (error) {
      console.error('Failed to save medication:', error);
      Alert.alert('Erro', 'Não foi possível salvar o medicamento.');
    }
  }, [
    name,
    dosage,
    selectedForm,
    selectedColor,
    instructions,
    frequencyType,
    selectedDays,
    intervalHours,
    times,
    initialQuantity,
    minThreshold,
    expiryDate,
  ]);

  // ─── Get the form label ───────────────────────────────
  const getFormLabel = (key: MedicationFormType): string =>
    FORM_OPTIONS.find((f) => f.key === key)?.label || 'Outro';

  const getFormIcon = (key: MedicationFormType): string =>
    FORM_OPTIONS.find((f) => f.key === key)?.icon || 'medical-bag';

  const getFreqLabel = (key: FrequencyType): string =>
    FREQUENCY_OPTIONS.find((f) => f.key === key)?.label || '';

  // ═════════════════════════════════════════════════════
  // STEP 1: Name + Dosage + Form
  // ═════════════════════════════════════════════════════
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informações do Medicamento</Text>
      <Text style={styles.stepDescription}>
        Preencha os dados básicos do seu medicamento
      </Text>

      {/* Name Input */}
      <View style={[styles.inputGroup, { zIndex: 10 }]}>
        <Text style={styles.inputLabel}>Nome do Medicamento *</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons
            name="pill"
            size={20}
            color={name ? C.primary : C.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Losartana"
            placeholderTextColor={C.textSecondary}
            value={name}
            onChangeText={handleNameChange}
            autoCapitalize="words"
            returnKeyType="next"
            onFocus={() => { if (name.length >= 3) setShowDropdown(true); }}
            onBlur={() => {
              setTimeout(() => setShowDropdown(false), 500);
            }}
          />
        </View>
        {showDropdown && searchResults.length > 0 && (
          <View style={styles.autocompleteDropdown}>
            {searchResults.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.autocompleteItem}
                onPress={() => {
                  setName(item.name);
                  if (item.dosage && item.dosage !== 'N/A') setDosage(item.dosage);
                  setShowDropdown(false);
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.autocompleteTextName}>{item.name}</Text>
                <Text style={styles.autocompleteTextDesc}>{item.dosage || item.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Dosage Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Dosagem *</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons
            name="scale-balance"
            size={20}
            color={dosage ? C.primary : C.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Ex: 50mg"
            placeholderTextColor={C.textSecondary}
            value={dosage}
            onChangeText={setDosage}
            returnKeyType="next"
          />
        </View>
      </View>

      {/* Form Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Forma Farmacêutica *</Text>
        <View style={styles.formGrid}>
          {FORM_OPTIONS.map((form) => {
            const isSelected = selectedForm === form.key;
            return (
              <TouchableOpacity
                key={form.key}
                style={[
                  styles.formCard,
                  isSelected && styles.formCardSelected,
                ]}
                onPress={() => setSelectedForm(form.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.formIconCircle,
                    isSelected && styles.formIconCircleSelected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={form.icon as any}
                    size={28}
                    color={isSelected ? C.white : C.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.formLabel,
                    isSelected && styles.formLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {form.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Color Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Cor de Identificação</Text>
        <View style={styles.colorRow}>
          {COLOR_PRESETS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColor === color && styles.colorDotSelected,
              ]}
              onPress={() => setSelectedColor(color)}
              activeOpacity={0.7}
            >
              {selectedColor === color && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={C.white}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Instruções (opcional)</Text>
        <View style={[styles.inputWrapper, styles.inputWrapperMultiline]}>
          <TextInput
            style={[styles.textInput, styles.textInputMultiline]}
            placeholder="Ex: Tomar em jejum, 30 min antes do café..."
            placeholderTextColor={C.textSecondary}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>
    </View>
  );

  // ═════════════════════════════════════════════════════
  // STEP 2: Schedule
  // ═════════════════════════════════════════════════════
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Horários e Frequência</Text>
      <Text style={styles.stepDescription}>
        Defina quando você deve tomar este medicamento
      </Text>

      {/* Frequency Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Frequência</Text>
        {FREQUENCY_OPTIONS.map((option) => {
          const isSelected = frequencyType === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.frequencyCard,
                isSelected && styles.frequencyCardSelected,
              ]}
              onPress={() => setFrequencyType(option.key)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.frequencyIconContainer,
                  isSelected && styles.frequencyIconContainerSelected,
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon as any}
                  size={24}
                  color={isSelected ? C.white : C.textSecondary}
                />
              </View>
              <View style={styles.frequencyTextContainer}>
                <Text
                  style={[
                    styles.frequencyLabel,
                    isSelected && styles.frequencyLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.frequencyDescription}>
                  {option.description}
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Specific Days */}
      {frequencyType === 'specific_days' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Dias da Semana</Text>
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label, index) => {
              const isSelected = selectedDays.includes(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekdayChip,
                    isSelected && styles.weekdayChipSelected,
                  ]}
                  onPress={() => toggleDay(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      isSelected && styles.weekdayTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Interval Hours */}
      {frequencyType === 'interval' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Intervalo (horas)</Text>
          <View style={styles.intervalRow}>
            {['4', '6', '8', '12'].map((h) => {
              const isSelected = intervalHours === h;
              return (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.intervalChip,
                    isSelected && styles.intervalChipSelected,
                  ]}
                  onPress={() => setIntervalHours(h)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.intervalText,
                      isSelected && styles.intervalTextSelected,
                    ]}
                  >
                    {h}h
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Times */}
      <View style={styles.inputGroup}>
        <View style={styles.timesHeader}>
          <Text style={styles.inputLabel}>Horários</Text>
          <TouchableOpacity
            style={styles.addTimeButton}
            onPress={addTime}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus" size={18} color={C.primary} />
            <Text style={styles.addTimeText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
        {times.map((time, index) => (
          <View key={index} style={styles.timeRow}>
            <View style={styles.timeInputWrapper}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={C.primary}
                style={styles.inputIcon}
              />
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
              <TouchableOpacity
                style={styles.removeTimeButton}
                onPress={() => removeTime(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={24}
                  color={C.error}
                />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  // ═════════════════════════════════════════════════════
  // STEP 3: Stock
  // ═════════════════════════════════════════════════════
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Controle de Estoque</Text>
      <Text style={styles.stepDescription}>
        Acompanhe a quantidade e validade do medicamento
      </Text>

      {/* Decorative stock icon */}
      <View style={styles.stockIconRow}>
        <View style={styles.stockIconCircle}>
          <MaterialCommunityIcons
            name="package-variant"
            size={40}
            color={C.primary}
          />
        </View>
      </View>

      {/* Initial Quantity */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Quantidade Inicial</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons
            name="counter"
            size={20}
            color={initialQuantity ? C.primary : C.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Ex: 30"
            placeholderTextColor={C.textSecondary}
            value={initialQuantity}
            onChangeText={setInitialQuantity}
            keyboardType="number-pad"
            returnKeyType="next"
          />
          <Text style={styles.inputSuffix}>unidades</Text>
        </View>
      </View>

      {/* Minimum Threshold */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Alerta de Estoque Baixo</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons
            name="alert-outline"
            size={20}
            color={C.warning}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Ex: 5"
            placeholderTextColor={C.textSecondary}
            value={minThreshold}
            onChangeText={setMinThreshold}
            keyboardType="number-pad"
            returnKeyType="next"
          />
          <Text style={styles.inputSuffix}>unidades</Text>
        </View>
        <Text style={styles.inputHint}>
          Você será notificado quando restar essa quantidade
        </Text>
      </View>

      {/* Expiry Date */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Data de Validade (opcional)</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={20}
            color={expiryDate ? C.primary : C.textSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.textInput}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={C.textSecondary}
            value={expiryDate}
            onChangeText={(v) => {
              let formatted = v.replace(/[^0-9]/g, '');
              if (formatted.length > 8) formatted = formatted.slice(0, 8);
              if (formatted.length >= 5) {
                formatted =
                  formatted.slice(0, 2) +
                  '/' +
                  formatted.slice(2, 4) +
                  '/' +
                  formatted.slice(4);
              } else if (formatted.length >= 3) {
                formatted =
                  formatted.slice(0, 2) + '/' + formatted.slice(2);
              }
              setExpiryDate(formatted);
            }}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      </View>
    </View>
  );

  // ═════════════════════════════════════════════════════
  // STEP 4: Review
  // ═════════════════════════════════════════════════════
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Revisão Final</Text>
      <Text style={styles.stepDescription}>
        Confirme as informações antes de salvar
      </Text>

      {/* Medication Summary Card */}
      <View style={styles.reviewCard}>
        {/* Header with icon + name */}
        <View style={styles.reviewHeader}>
          <View
            style={[
              styles.reviewIconCircle,
              { backgroundColor: `${selectedColor}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={(selectedForm ? getFormIcon(selectedForm) : 'pill') as any}
              size={36}
              color={selectedColor}
            />
          </View>
          <View style={styles.reviewHeaderText}>
            <Text style={styles.reviewName}>{name || '—'}</Text>
            <Text style={styles.reviewDosage}>
              {dosage || '—'} • {selectedForm ? getFormLabel(selectedForm) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.reviewDivider} />

        {/* Details rows */}
        {instructions ? (
          <ReviewRow
            icon="note-text-outline"
            label="Instruções"
            value={instructions}
          />
        ) : null}
        <ReviewRow
          icon="calendar-clock"
          label="Frequência"
          value={
            frequencyType === 'daily'
              ? 'Diariamente'
              : frequencyType === 'specific_days'
              ? `${selectedDays.map((d) => WEEKDAY_LABELS[d]).join(', ')}`
              : `A cada ${intervalHours}h`
          }
        />
        <ReviewRow
          icon="clock-outline"
          label="Horários"
          value={times.join(', ')}
        />
        {initialQuantity ? (
          <ReviewRow
            icon="package-variant"
            label="Estoque Inicial"
            value={`${initialQuantity} unidades`}
          />
        ) : null}
        {minThreshold ? (
          <ReviewRow
            icon="alert-outline"
            label="Alerta"
            value={`Quando restar ${minThreshold} un.`}
            iconColor={C.warning}
          />
        ) : null}
        {expiryDate ? (
          <ReviewRow
            icon="calendar-remove"
            label="Validade"
            value={expiryDate}
          />
        ) : null}
      </View>

      {/* Confirmation note */}
      <View style={styles.confirmNote}>
        <MaterialCommunityIcons
          name="information-outline"
          size={18}
          color={C.accent}
        />
        <Text style={styles.confirmNoteText}>
          Você poderá editar essas informações a qualquer momento nas
          configurações do medicamento.
        </Text>
      </View>
    </View>
  );

  // ─── Step content switcher ────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name={currentStep === 0 ? 'close' : 'arrow-left'}
            size={24}
            color={C.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Novo Medicamento</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Step Indicator ── */}
      <View style={styles.stepperContainer}>
        {STEP_LABELS.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          return (
            <View key={index} style={styles.stepperItem}>
              {/* Connector line (before) */}
              {index > 0 && (
                <View
                  style={[
                    styles.stepperLine,
                    styles.stepperLineBefore,
                    (isCompleted || isCurrent) && styles.stepperLineActive,
                  ]}
                />
              )}

              {/* Circle */}
              <View
                style={[
                  styles.stepperCircle,
                  isCompleted && styles.stepperCircleCompleted,
                  isCurrent && styles.stepperCircleCurrent,
                ]}
              >
                {isCompleted ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color={C.white}
                  />
                ) : (
                  <Text
                    style={[
                      styles.stepperNumber,
                      isCurrent && styles.stepperNumberCurrent,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.stepperLabel,
                  (isCompleted || isCurrent) && styles.stepperLabelActive,
                ]}
              >
                {label}
              </Text>

              {/* Connector line (after) */}
              {index < STEP_LABELS.length - 1 && (
                <View
                  style={[
                    styles.stepperLine,
                    styles.stepperLineAfter,
                    isCompleted && styles.stepperLineActive,
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: `${((currentStep + 1) / STEP_LABELS.length) * 100}%`,
            },
          ]}
        />
      </View>

      {/* ── Scrollable Step Content ── */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom Action Bar ── */}
      <View
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}
      >
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={goBack}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={C.primary}
            />
            <Text style={styles.secondaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[
            styles.primaryButton,
            !isStepValid() && styles.primaryButtonDisabled,
          ]}
          onPress={currentStep === 3 ? handleSave : goNext}
          activeOpacity={0.8}
          disabled={!isStepValid()}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep === 3 ? 'Salvar Medicamento' : 'Próximo'}
          </Text>
          <MaterialCommunityIcons
            name={currentStep === 3 ? 'check' : 'arrow-right'}
            size={20}
            color={C.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Review Row Sub-component ───────────────────────────
function ReviewRow({
  icon,
  label,
  value,
  iconColor,
}: {
  icon: string;
  label: string;
  value: string;
  iconColor?: string;
}) {
  return (
    <View style={reviewStyles.row}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={iconColor || C.textSecondary}
      />
      <View style={reviewStyles.textContainer}>
        <Text style={reviewStyles.label}>{label}</Text>
        <Text style={reviewStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: C.textPrimary,
    fontWeight: '600',
  },
});

// ─── Main Styles ────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  stepperItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepperCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.surfaceAlt,
    zIndex: 1,
  },
  stepperCircleCurrent: {
    borderColor: C.primary,
    backgroundColor: C.white,
  },
  stepperCircleCompleted: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  stepperNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSecondary,
  },
  stepperNumberCurrent: {
    color: C.primary,
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textSecondary,
    marginTop: 4,
  },
  stepperLabelActive: {
    color: C.primary,
  },
  stepperLine: {
    position: 'absolute',
    top: 14,
    height: 2,
    backgroundColor: C.surfaceAlt,
    zIndex: 0,
  },
  stepperLineBefore: {
    right: '50%',
    left: -4,
  },
  stepperLineAfter: {
    left: '50%',
    right: -4,
  },
  stepperLineActive: {
    backgroundColor: C.primary,
  },

  // Progress bar
  progressBarBg: {
    height: 3,
    backgroundColor: C.surfaceAlt,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: 2,
  },

  // Scroll
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },

  // Step container
  stepContainer: {},
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 15,
    color: C.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },

  // Input groups
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.surfaceAlt,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperMultiline: {
    height: 90,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: C.textPrimary,
    paddingVertical: 0,
  },
  textInputMultiline: {
    height: 60,
    textAlignVertical: 'top',
  },
  inputSuffix: {
    fontSize: 14,
    color: C.textSecondary,
    fontWeight: '500',
    marginLeft: 8,
  },
  inputHint: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Form grid
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  formCard: {
    width: (SCREEN_WIDTH - 32 - 30) / 4,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.surfaceAlt,
  },
  formCardSelected: {
    borderColor: C.primary,
    backgroundColor: '#FFF0F0',
  },
  formIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  formIconCircleSelected: {
    backgroundColor: C.primary,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSecondary,
    textAlign: 'center',
  },
  formLabelSelected: {
    color: C.primary,
    fontWeight: '700',
  },

  // Color picker
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: C.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // Frequency cards
  frequencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.surfaceAlt,
    padding: 14,
    marginBottom: 10,
  },
  frequencyCardSelected: {
    borderColor: C.primary,
    backgroundColor: '#FFF0F0',
  },
  frequencyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyIconContainerSelected: {
    backgroundColor: C.primary,
  },
  frequencyTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  frequencyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
  },
  frequencyLabelSelected: {
    color: C.primary,
  },
  frequencyDescription: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: C.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.primary,
  },

  // Weekday chips
  weekdayRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weekdayChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.surfaceAlt,
  },
  weekdayChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSecondary,
  },
  weekdayTextSelected: {
    color: C.white,
  },

  // Interval chips
  intervalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intervalChip: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.surfaceAlt,
  },
  intervalChipSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  intervalText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textSecondary,
  },
  intervalTextSelected: {
    color: C.white,
  },

  // Times
  timesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  timeInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.surfaceAlt,
    paddingHorizontal: 14,
    height: 52,
  },
  timeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: C.textPrimary,
    letterSpacing: 2,
    paddingVertical: 0,
  },
  removeTimeButton: {
    padding: 4,
  },

  // Stock
  stockIconRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stockIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Review
  reviewCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
  reviewName: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
  },
  reviewDosage: {
    fontSize: 15,
    color: C.textSecondary,
    marginTop: 2,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: C.surfaceAlt,
    marginBottom: 4,
  },

  // Confirm note
  confirmNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EDE7F6',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  confirmNoteText: {
    flex: 1,
    fontSize: 13,
    color: C.accent,
    lineHeight: 19,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.primary,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.primary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: C.primary,
    borderRadius: 14,
    gap: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: C.surfaceAlt,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
  },
  
  // Autocomplete
  autocompleteDropdown: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primaryLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  autocompleteItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceAlt,
    backgroundColor: C.white,
  },
  autocompleteTextName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  autocompleteTextDesc: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
});
