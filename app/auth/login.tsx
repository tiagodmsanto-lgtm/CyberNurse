import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import auth from '@react-native-firebase/auth';
import { restoreDataFromCloud } from '../../src/services/syncService';

const C = {
  primary: '#E53935',
  background: '#FFF8F8',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  white: '#FFFFFF',
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Erro', 'Preencha todos os campos.');
    setIsLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
      // Após o login, é essencial restaurar os dados da nuvem para preencher o userProfileStore.
      // Sem isso, o _layout achará que o perfil está incompleto e jogará o usuário de volta para o login.
      try {
        await restoreDataFromCloud();
      } catch (restoreError) {
        console.warn('Nenhum backup encontrado ou erro ao restaurar:', restoreError);
      }
      
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        Alert.alert('Erro', 'Email ou senha incorretos.');
      } else {
        Alert.alert('Erro', 'Não foi possível fazer login: ' + e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="heart-pulse" size={64} color={C.primary} />
          <Text style={styles.title}>Bem-vindo de volta!</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar gerenciando sua saúde.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={20} color={C.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Seu e-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#BDBDBD"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={C.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#BDBDBD"
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => Alert.alert('Aviso', 'Funcionalidade em desenvolvimento.')}>
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? 'Carregando...' : 'Entrar'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerText}>Cadastre-se agora</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: C.textPrimary, marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: C.textSecondary, textAlign: 'center', marginTop: 8 },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: C.textPrimary },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { color: C.primary, fontSize: 14, fontWeight: '600' },
  button: {
    backgroundColor: C.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: C.textSecondary, fontSize: 15 },
  registerText: { color: C.primary, fontSize: 15, fontWeight: 'bold', marginLeft: 6 },
});
