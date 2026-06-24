import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { useUserProfileStore } from '../../src/stores/userProfileStore';
import { backupDataToCloud } from '../../src/services/syncService';

const C = {
  primary: '#E53935',
  primaryLight: '#FFCDD2',
  background: '#FFF8F8',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  white: '#FFFFFF',
  border: '#EEEEEE',
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const setPersonalData = useUserProfileStore((state) => state.setPersonalData);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = auth().currentUser;

  // Formulário Step 1: Identificação e Conta
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [biologicalGender, setBiologicalGender] = useState('');

  // Formulário Step 2: Antropometria
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [healthGoals, setHealthGoals] = useState('');

  // Formulário Step 3: Clínico
  const [chronicConditions, setChronicConditions] = useState('');
  const [medicationAllergies, setMedicationAllergies] = useState('');
  const [foodIntolerances, setFoodIntolerances] = useState('');

  const nextStep = () => {
    if (step === 1) {
      if (!name || !email || (!currentUser && !password) || !age || !biologicalGender) {
        return Alert.alert('Atenção', 'Preencha todos os campos da etapa de Identificação.');
      }
      setStep(2);
    } else if (step === 2) {
      if (!weight || !height || !activityLevel) {
        return Alert.alert('Atenção', 'Preencha peso, altura e nível de atividade física.');
      }
      setStep(3);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleFinish = async () => {
    if (!chronicConditions && !medicationAllergies && !foodIntolerances) {
       // Permite campos vazios no passo 3 se a pessoa for saudável
    }

    setIsLoading(true);
    try {
      // 1. Criar conta no Firebase apenas se for um usuário novo
      if (!currentUser) {
        await auth().createUserWithEmailAndPassword(email, password);
      }
      
      // 2. Salvar dados localmente
      setPersonalData({
        name,
        email,
        age,
        biologicalGender,
        weight,
        height,
        activityLevel,
        healthGoals,
        chronicConditions,
        medicationAllergies,
        foodIntolerances,
      });

      // 3. Fazer o primeiro backup (opcional mas bom para garantir)
      try {
        await backupDataToCloud();
      } catch (e) {
        console.warn('Backup inicial falhou, mas conta criada:', e);
      }

      Alert.alert(
        'Tudo Certo!',
        'Seu perfil foi criado e configurado com sucesso.',
        [{ text: 'Começar', onPress: () => router.replace('/(tabs)') }]
      );

    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert('Erro', 'Este e-mail já está em uso.');
      } else if (e.code === 'auth/weak-password') {
        Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao criar a conta: ' + e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.stepCircle, step >= s ? styles.stepCircleActive : null]}>
            <Text style={[styles.stepText, step >= s ? styles.stepTextActive : null]}>{s}</Text>
          </View>
          {s < 3 && <View style={[styles.stepLine, step > s ? styles.stepLineActive : null]} />}
        </View>
      ))}
    </View>
  );

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (step > 1) {
              prevStep();
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/auth/login');
            }
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Criar Conta</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>1. Identificação Essencial</Text>
            <Text style={styles.sectionSubtitle}>Estes dados não poderão ser alterados depois.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo / Apelido</Text>
              <TextInput style={styles.input} placeholder="Como deseja ser chamado" value={name} onChangeText={setName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput 
                style={[styles.input, currentUser && { backgroundColor: '#F5F5F5', color: '#9E9E9E' }]} 
                placeholder="Seu e-mail de acesso" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none" 
                editable={!currentUser}
              />
            </View>

            {!currentUser && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha (Mínimo 6 caracteres)</Text>
                <TextInput style={styles.input} placeholder="Crie uma senha segura" value={password} onChangeText={setPassword} secureTextEntry />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Idade</Text>
              <TextInput style={styles.input} placeholder="Ex: 35" value={age} onChangeText={setAge} keyboardType="number-pad" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sexo</Text>
              {renderSelectable(['Masculino', 'Feminino', 'Prefiro não responder'], biologicalGender, setBiologicalGender)}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>2. Estilo de Vida e Antropometria</Text>
            <Text style={styles.sectionSubtitle}>Isso nos ajuda a sugerir metas nutricionais e hídricas.</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Peso atual (kg)</Text>
                <TextInput style={styles.input} placeholder="Ex: 75.5" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput style={styles.input} placeholder="Ex: 175" value={height} onChangeText={setHeight} keyboardType="number-pad" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nível de Atividade Física</Text>
              {renderSelectable(['Nenhuma', '1 a 2x', '3 a 4x', '5 a 6x', '7x ou mais'], activityLevel, setActivityLevel)}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Metas de Saúde (Opcional)</Text>
              <TextInput style={styles.input} placeholder="Ex: Emagrecimento, Hipertrofia, Manutenção..." value={healthGoals} onChangeText={setHealthGoals} />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>3. Informações Clínicas (Sensíveis)</Text>
            <Text style={styles.sectionSubtitle}>Para evitar interações perigosas, preencha com atenção. Deixe em branco se não houver.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Patologias / Doenças Crônicas</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Ex: Hipertensão, Diabetes, Asma..." value={chronicConditions} onChangeText={setChronicConditions} multiline />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alergias a Medicamentos</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Ex: Dipirona, Penicilina..." value={medicationAllergies} onChangeText={setMedicationAllergies} multiline />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Intolerâncias Alimentares</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Ex: Lactose, Glúten, Amendoim..." value={foodIntolerances} onChangeText={setFoodIntolerances} multiline />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.button} onPress={step === 3 ? handleFinish : nextStep} disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Salvando...' : step === 3 ? 'Finalizar Cadastro' : 'Continuar'}
          </Text>
          {!isLoading && step < 3 && <MaterialCommunityIcons name="arrow-right" size={20} color={C.white} style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: C.textPrimary },
  stepIndicatorContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  stepCircleActive: { backgroundColor: C.primary },
  stepText: { color: '#757575', fontWeight: 'bold', fontSize: 14 },
  stepTextActive: { color: C.white },
  stepLine: { width: 40, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: C.primary },
  scrollContent: { padding: 24 },
  formSection: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: C.textPrimary, marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 6 },
  input: { backgroundColor: C.surface, borderRadius: 10, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: C.border, fontSize: 16, color: C.textPrimary },
  textArea: { height: 80, textAlignVertical: 'top', paddingVertical: 12 },
  footer: { paddingHorizontal: 24, paddingTop: 16, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border },
  button: { flexDirection: 'row', backgroundColor: C.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonText: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  selectableContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectableButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  selectableButtonActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  selectableText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },
  selectableTextActive: { color: C.primary, fontWeight: 'bold' },
});
