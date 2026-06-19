import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { addContact } from '../../src/services/supportNetworkService';

const C = {
  primary: '#E53935',
  background: '#FFF8F8',
  white: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#F5F0F0',
};

const PROFESSIONS = [
  'doctor', 'cardiologist', 'nurse', 'pharmacist', 
  'physiotherapist', 'nutritionist', 'psychologist', 'dentist', 'other'
];

const RELATIONS = [
  'parent', 'child', 'spouse', 'sibling', 'friend', 'other'
];

export default function SupportNetworkAddScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [bondType, setBondType] = useState<'personal' | 'professional'>('personal');
  const [relation, setRelation] = useState('other');
  const [profession, setProfession] = useState('doctor');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('supportNetwork.alerts.error'), t('supportNetwork.alerts.fillRequired'));
      return;
    }

    try {
      addContact({
        name: name.trim(),
        type: bondType,
        relation: bondType === 'personal' ? relation : '',
        profession: bondType === 'professional' ? profession : null,
        phone: phone.trim(),
        email: email.trim(),
        notifyMissed: 1,
      });
      router.back();
    } catch (e) {
      console.error('Save failed', e);
      Alert.alert(t('supportNetwork.alerts.error'), 'Houve um erro interno ao salvar.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="close" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('supportNetwork.addContact')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
        
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('supportNetwork.name')}</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="account" size={20} color={C.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder={t('supportNetwork.namePlaceholder')}
              placeholderTextColor="#BDBDBD"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Bond Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('supportNetwork.bondType')}</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentBtn, bondType === 'personal' && styles.segmentBtnActive]}
              onPress={() => setBondType('personal')}
            >
              <Text style={[styles.segmentText, bondType === 'personal' && styles.segmentTextActive]}>
                {t('supportNetwork.bondPersonal')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, bondType === 'professional' && styles.segmentBtnActive]}
              onPress={() => setBondType('professional')}
            >
              <Text style={[styles.segmentText, bondType === 'professional' && styles.segmentTextActive]}>
                {t('supportNetwork.bondProfessional')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Selection */}
        {bondType === 'personal' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('supportNetwork.relationLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {RELATIONS.map(rel => (
                <TouchableOpacity
                  key={rel}
                  style={[styles.chip, relation === rel && styles.chipActive]}
                  onPress={() => setRelation(rel)}
                >
                  <Text style={[styles.chipText, relation === rel && styles.chipTextActive]}>
                    {t(`supportNetwork.relations.${rel}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('supportNetwork.professionLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {PROFESSIONS.map(prof => (
                <TouchableOpacity
                  key={prof}
                  style={[styles.chip, profession === prof && styles.chipActive]}
                  onPress={() => setProfession(prof)}
                >
                  <Text style={[styles.chipText, profession === prof && styles.chipTextActive]}>
                    {t(`supportNetwork.professions.${prof}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('supportNetwork.phone')}</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="phone" size={20} color={C.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder={t('supportNetwork.phonePlaceholder')}
              placeholderTextColor="#BDBDBD"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('supportNetwork.email')}</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="email" size={20} color={C.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder={t('supportNetwork.emailPlaceholder')}
              placeholderTextColor="#BDBDBD"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t('supportNetwork.save')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  scrollContent: { padding: 16 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: C.textPrimary },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F5F0F0',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: C.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: '500', color: C.textSecondary },
  segmentTextActive: { color: C.textPrimary, fontWeight: '700' },
  chipsScroll: { flexDirection: 'row', overflow: 'visible' },
  chip: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderColor: C.primary,
  },
  chipText: { fontSize: 14, color: C.textSecondary, fontWeight: '500' },
  chipTextActive: { color: C.primary, fontWeight: '700' },
  footer: {
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveBtn: {
    backgroundColor: C.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },
});
