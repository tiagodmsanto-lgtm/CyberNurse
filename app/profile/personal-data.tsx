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
import auth from '@react-native-firebase/auth';
import { backupDataToCloud, restoreDataFromCloud, BACKUP_TIMESTAMP_KEY } from '../../src/services/syncService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../../src/services/database';

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

  // States for editable fields
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [healthGoals, setHealthGoals] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [medicationAllergies, setMedicationAllergies] = useState('');
  const [foodIntolerances, setFoodIntolerances] = useState('');

  // Auth / Backup states
  const [user, setUser] = useState(auth().currentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((u) => {
      setUser(u);
      if (u) loadLastBackupTime();
    });
    return subscriber;
  }, []);

  const loadLastBackupTime = async () => {
    try {
      const ts = await AsyncStorage.getItem(BACKUP_TIMESTAMP_KEY);
      if (ts) {
        const date = new Date(parseInt(ts, 10));
        setLastBackup(`${date.toLocaleDateString()} às ${date.toLocaleTimeString()}`);
      }
    } catch (e) {}
  };

  // Hydrate local state on mount
  useEffect(() => {
    setWeight(storeData.weight || '');
    setHeight(storeData.height || '');
    setActivityLevel(storeData.activityLevel || '');
    setHealthGoals(storeData.healthGoals || '');
    setChronicConditions(storeData.chronicConditions || '');
    setMedicationAllergies(storeData.medicationAllergies || '');
    setFoodIntolerances(storeData.foodIntolerances || '');
  }, [storeData]);

  const handleSave = () => {
    setPersonalData({
      weight,
      height,
      activityLevel,
      healthGoals,
      chronicConditions,
      medicationAllergies,
      foodIntolerances,
    });
    
    Alert.alert(
      t('personalData.successAlert.title', 'Sucesso'),
      t('personalData.successAlert.message', 'Seus dados foram atualizados com sucesso.'),
      [{ text: 'OK' }]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja desconectar? Todos os dados médicos salvos apenas neste celular serão APAGADOS por segurança.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair e Apagar Tudo', 
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Limpa o perfil
              useUserProfileStore.getState().clearPersonalData();
              
              // 2. Limpa o SQLite local
              const db = getDatabase();
              db.runSync('DELETE FROM medications');
              db.runSync('DELETE FROM schedules');
              db.runSync('DELETE FROM doses');
              db.runSync('DELETE FROM stock');

              // 3. Desloga
              await auth().signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Erro ao sair:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao tentar sair da conta.');
            }
          }
        }
      ]
    );
  };

  const doBackup = async () => {
    try {
      setIsAuthLoading(true);
      await backupDataToCloud();
      await loadLastBackupTime();
      Alert.alert('Sucesso', 'Backup realizado com sucesso no Firestore!');
    } catch (e: any) {
      Alert.alert('Erro', 'Não foi possível realizar o backup: ' + e.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const doRestore = async () => {
    Alert.alert(
      'Atenção',
      'Isso irá apagar seus dados locais atuais e baixar o último backup da nuvem. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Restaurar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsAuthLoading(true);
              await restoreDataFromCloud();
              Alert.alert('Sucesso', 'Dados restaurados com sucesso! Reinicie o app para ver as mudanças.');
            } catch (e: any) {
              Alert.alert('Erro', 'Não foi possível restaurar: ' + e.message);
            } finally {
              setIsAuthLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderSelectable = (options: string[], selected: string, onSelect: (val: string) => void) => (
    <View style={styles.selectableContainer}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.selectableButton, selected === opt && styles.selectableButtonActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.selectableText, selected === opt && styles.selectableTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
        <Text style={styles.headerTitle}>{t('personalData.headerTitle', 'Dados Pessoais')}</Text>
        <View style={{ width: 24 }} /> {/* Balance for centering */}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={24} color={C.primary} />
          <Text style={styles.infoText}>
            Alguns dados são travados por segurança para não comprometer os relatórios e inteligência do CyberNurse.
          </Text>
        </View>

        {/* Informações Fixas */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>1. Identificação (Somente Leitura)</Text>
          
          <View style={styles.readOnlyContainer}>
             <Text style={styles.readOnlyLabel}>Nome</Text>
             <Text style={styles.readOnlyValue}>{storeData.name}</Text>
          </View>
          <View style={styles.readOnlyContainer}>
             <Text style={styles.readOnlyLabel}>E-mail</Text>
             <Text style={styles.readOnlyValue}>{user?.email || storeData.email}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={[styles.readOnlyContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.readOnlyLabel}>Idade</Text>
              <Text style={styles.readOnlyValue}>{storeData.age}</Text>
            </View>
            <View style={[styles.readOnlyContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.readOnlyLabel}>Gênero</Text>
              <Text style={styles.readOnlyValue}>{storeData.biologicalGender}</Text>
            </View>
          </View>
        </View>

        {/* Antropometria Editável */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>2. Antropometria & Estilo de Vida</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainerHalf}>
              <Text style={styles.inputLabel}>Peso atual (kg)</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="weight-kilogram" size={20} color={C.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 75.5"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>

            <View style={styles.inputContainerHalf}>
              <Text style={styles.inputLabel}>Altura (cm)</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="human-male-height" size={20} color={C.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 175"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="number-pad"
                  placeholderTextColor="#BDBDBD"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputContainerFull}>
            <Text style={styles.inputLabel}>Nível de Atividade Física</Text>
            {renderSelectable(['Nenhuma', '1 a 2x', '3 a 4x', '5 a 6x', '7x ou mais'], activityLevel, setActivityLevel)}
          </View>

          <View style={styles.inputContainerFull}>
            <Text style={styles.inputLabel}>Metas de Saúde</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="flag-checkered" size={20} color={C.textSecondary} />
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Emagrecimento, Hipertrofia..."
                value={healthGoals}
                onChangeText={setHealthGoals}
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>
        </View>

        {/* Clínico Editável */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>3. Informações Clínicas</Text>

          <View style={styles.inputContainerFull}>
            <Text style={styles.inputLabel}>Patologias Crônicas</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color={C.textSecondary} style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder="Ex: Hipertensão, Diabetes..."
                value={chronicConditions}
                onChangeText={setChronicConditions}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>

          <View style={styles.inputContainerFull}>
            <Text style={styles.inputLabel}>Alergias a Medicamentos</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <MaterialCommunityIcons name="pill" size={20} color={C.textSecondary} style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder="Ex: Dipirona, Penicilina..."
                value={medicationAllergies}
                onChangeText={setMedicationAllergies}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>

          <View style={styles.inputContainerFull}>
            <Text style={styles.inputLabel}>Intolerâncias Alimentares</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <MaterialCommunityIcons name="food-apple-outline" size={20} color={C.textSecondary} style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder="Ex: Lactose, Glúten..."
                value={foodIntolerances}
                onChangeText={setFoodIntolerances}
                multiline
                textAlignVertical="top"
                placeholderTextColor="#BDBDBD"
              />
            </View>
          </View>
        </View>

        {/* Conta e Backup Group */}
        <View style={styles.formGroup}>
          <Text style={styles.sectionTitle}>Nuvem & Segurança</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12 }}>
            <MaterialCommunityIcons name="check-circle" size={24} color={C.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: C.textPrimary }}>Conta Protegida</Text>
              <Text style={{ fontSize: 14, color: C.textSecondary }}>Seus dados estão seguros na nuvem.</Text>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={{ color: C.primary, fontWeight: 'bold' }}>Sair</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>
            Último backup: {lastBackup || 'Nenhum'}
          </Text>

          <TouchableOpacity style={[styles.authButton, { backgroundColor: C.primary, marginBottom: 12 }]} onPress={doBackup} disabled={isAuthLoading}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={20} color={C.white} style={{ marginRight: 8 }} />
            <Text style={[styles.authButtonText, { color: C.white }]}>{isAuthLoading ? 'Aguarde...' : 'Fazer Backup Agora'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.authButton, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.primary }]} onPress={doRestore} disabled={isAuthLoading}>
            <MaterialCommunityIcons name="cloud-download-outline" size={20} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.authButtonText, { color: C.primary }]}>{isAuthLoading ? 'Aguarde...' : 'Restaurar Dados'}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Floating Save Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <MaterialCommunityIcons name="content-save-outline" size={24} color={C.white} />
          <Text style={styles.saveButtonText}>{t('personalData.saveButton', 'Salvar Alterações')}</Text>
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
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: C.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#D32F2F',
    fontSize: 14,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: C.textPrimary,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainerHalf: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputContainerFull: {
    marginBottom: 16,
    marginHorizontal: 4,
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
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: C.textPrimary,
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: C.textPrimary,
    minHeight: 76,
  },
  readOnlyContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  readOnlyValue: {
    fontSize: 16,
    color: '#424242',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.background,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveButton: {
    backgroundColor: C.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectableContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  selectableButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  selectableButtonActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  selectableText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
  selectableTextActive: { color: C.primary, fontWeight: 'bold' },
});
