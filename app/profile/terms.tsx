import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.sections.app.terms', 'Termos de Uso')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#E53935" />
          </View>
          <Text style={styles.title}>Termos de Uso</Text>
          <Text style={styles.lastUpdated}>Última atualização: Junho de 2026</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Propósito do Aplicativo</Text>
          <Text style={styles.cardText}>
            O CyberNurse é uma ferramenta de auxílio na manutenção de tratamentos medicamentosos e rotinas de saúde. Nosso objetivo é proporcionar organização e lembrar o paciente de suas tarefas diárias.
          </Text>
          <Text style={[styles.cardText, styles.highlightText]}>
            IMPORTANTE: O CyberNurse NÃO substitui orientações médicas profissionais, diagnósticos ou tratamentos. A responsabilidade por seguir as prescrições médicas corretas é inteiramente do usuário.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Cadastro e Dados Obrigatórios (LGPD)</Text>
          <Text style={styles.cardText}>
            Para utilizar o aplicativo de forma segura e para que o sistema funcione corretamente, exigimos a criação de uma conta (Autenticação) e o preenchimento de um Perfil de Saúde, contemplando: Identificação, Dados Antropométricos e Dados Clínicos.
          </Text>
          <Text style={styles.cardText}>
            A coleta dessas informações obedece estritamente à <Text style={{fontWeight: 'bold'}}>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</Text>. Você tem o direito de solicitar a exclusão de seus dados a qualquer momento através do botão "Sair e Apagar Tudo" no aplicativo.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Contas e Backup em Nuvem</Text>
          <Text style={styles.cardText}>
            Com a criação da sua conta, o CyberNurse realizará backups seguros (cópias de segurança) criptografados na nuvem para evitar perda de dados. Você é responsável por manter o sigilo de suas credenciais de acesso (e-mail e senha).
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>4. Uso Aceitável</Text>
          <Text style={styles.cardText}>
            O usuário se compromete a inserir dados verdadeiros referentes aos seus próprios tratamentos (ou dos quais é responsável legal) e a não utilizar a plataforma para fins ilícitos, engenharia reversa ou subversão dos sistemas de segurança.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ao continuar utilizando o CyberNurse, você declara ter lido, compreendido e aceitado integralmente estes Termos de Uso e a nossa Política de Privacidade.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F8',
  },
  header: {
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  section: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E53935',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#424242',
    marginBottom: 12,
  },
  highlightText: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    color: '#E65100',
    fontWeight: '600',
    overflow: 'hidden',
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
