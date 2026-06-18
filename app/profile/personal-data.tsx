import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUserProfileStore } from '../../src/stores/userProfileStore';

// ── Colors ──────────────────────────────────────────────
const C = {
  primary: '#E53935',
  primaryLight: '#FF6F61',
  background: '#FFF8F8',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#F5F0F0',
  white: '#FFFFFF',
};

// ── Component ──────────────────────────────────────────
export default function PersonalDataScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const storeData = useUserProfileStore((state) => state.data);
  const setPersonalData = useUserProfileStore((state) => state.setPersonalData);

  // Local state for the form
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');

  // Hydrate local state on mount
  useEffect(() => {
    setName(storeData.name || '');
    setAge(storeData.age || '');
    setWeight(storeData.weight || '');
    setHeight(storeData.height || '');
    setBloodType(storeData.bloodType || '');
    setAllergies(storeData.allergies || '');
    setChronicConditions(storeData.chronicConditions || '');
  }, [storeData]);

  const handleSave = () => {
    setPersonalData({
      name,
      age,
      weight,
      height,
      bloodType,
      allergies,
      chronicConditions,
    });
    
    Alert.alert(
      t('personalData.successAlert.title'),
      t('personalData.successAlert.message'),
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('personalData.headerTitle')}</Text>
        <View style={{ width: 24 }} /> {/* Balance for centering */}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={24} color={C.primary} />
          <Text style={styles.infoText}>
            {t('personalData.infoText')}
          </Text>
        </View>

        {/* Form Group */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>{t('personalData.accountSection')}</Text>
          <View style={styles.inputContainerFull}>
            <Text style={styles.inputLabel}>{t('personalData.displayName')}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-outline" size={20} color={C.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder={t('personalData.displayNamePlaceholder')}
                value={name}
                onChangeText={setName}
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>{t('personalData.basicMeasures')}</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.inputLabel}>{t('personalData.age')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="calendar-account" size={20} color={C.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('personalData.agePlaceholder')}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>
            
            <View style={styles.inputContainerHalf}>
              <Text style={styles.inputLabel}>{t('personalData.bloodType')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="water-outline" size={20} color={C.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('personalData.bloodTypePlaceholder')}
                  value={bloodType}
                  onChangeText={setBloodType}
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.inputLabel}>{t('personalData.weight')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="weight-kilogram" size={20} color={C.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('personalData.weightPlaceholder')}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>

            <View style={styles.inputContainerHalf}>
              <Text style={styles.inputLabel}>{t('personalData.height')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="human-male-height" size={20} color={C.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('personalData.heightPlaceholder')}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="number-pad"
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>{t('personalData.healthHistory')}</Text>

          <View style={styles.inputContainerFull}>
            <Text style={styles.inputLabel}>{t('personalData.allergies')}</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20} color={C.textSecondary} style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder={t('personalData.allergiesPlaceholder')}
                value={allergies}
                onChangeText={setAllergies}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>

          <View style={styles.inputContainerFull}>
            <Text style={styles.inputLabel}>{t('personalData.chronicConditions')}</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color={C.textSecondary} style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder={t('personalData.chronicConditionsPlaceholder')}
                value={chronicConditions}
                onChangeText={setChronicConditions}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <MaterialCommunityIcons name="content-save-outline" size={24} color={C.white} />
          <Text style={styles.saveButtonText}>{t('personalData.saveButton')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: C.primary,
    marginLeft: 12,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 24,
    backgroundColor: C.surface,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainerHalf: {
    width: '48%',
  },
  inputContainerFull: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: C.textPrimary,
    marginLeft: 10,
    height: '100%',
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: C.textPrimary,
    marginLeft: 10,
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});
