import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.sections.app.privacy', 'Política de Privacidade')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="shield-check-outline" size={48} color="#43A047" />
          </View>
          <Text style={styles.title}>Política de Privacidade e LGPD</Text>
          <Text style={styles.lastUpdated}>Última atualização: Junho de 2026</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Coleta de Dados e APIs</Text>
          <Text style={styles.cardText}>
            Nós valorizamos sua privacidade e estamos comprometidos em proteger seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </Text>
          <Text style={styles.cardText}>
            Para garantir o funcionamento, melhoria contínua e viabilidade econômica do aplicativo, coletamos informações essenciais e utilizamos APIs de terceiros.
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.bold}>As informações coletadas incluem:</Text>{'\n'}
            • Dados sobre adesão aos tratamentos e interação com o app.{'\n'}
            • Identificadores de dispositivo pelo <Text style={styles.bold}>Google AdMob</Text> para publicidade direcionada.{'\n'}
            • Relatórios de falhas e logs de desempenho coletados pelo <Text style={styles.bold}>Google Crashlytics</Text>.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Dados Sensíveis, Saúde e Anonimização</Text>
          <Text style={styles.cardText}>
            Informações sobre medicamentos, protocolos nutricionais e saúde geral são classificadas como <Text style={styles.bold}>dados pessoais sensíveis</Text>. 
          </Text>
          <Text style={styles.cardText}>
            Para proteger a sua identidade, implementamos rotinas rigorosas de <Text style={styles.bold}>anonimização irreversível</Text>. Isso significa que seus padrões de saúde e adesão são extraídos e processados de forma que é tecnicamente impossível vinculá-los ao seu nome, CPF, e-mail ou identificação direta (conforme Art. 12 da LGPD).
          </Text>
          <Text style={[styles.cardText, styles.alertText]}>
            Ao aceitar esta Política de Privacidade, você concede consentimento expresso e destacado para que seus dados (estritamente de forma agregada e anonimizada) sejam comercializados, transferidos ou compartilhados com parceiros comerciais para fins de análise, pesquisa e publicidade.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Seus Direitos (Titular dos Dados)</Text>
          <Text style={styles.cardText}>
            Em conformidade com a LGPD, você possui os seguintes direitos em relação aos seus dados pessoais não-anonimizados mantidos por nós:{'\n\n'}
            • <Text style={styles.bold}>Confirmação e Acesso:</Text> Saber quais dados pessoais temos sobre você.{'\n'}
            • <Text style={styles.bold}>Correção:</Text> Solicitar a correção de dados incompletos ou desatualizados.{'\n'}
            • <Text style={styles.bold}>Exclusão:</Text> Solicitar a deleção da sua conta e dos seus dados associados de nossos bancos de dados.{'\n'}
            • <Text style={styles.bold}>Revogação do Consentimento:</Text> Você pode revogar este consentimento a qualquer momento excluindo sua conta.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ao utilizar o CyberNurse, você concorda com a coleta e com a anonimização dos seus dados sensíveis para as finalidades econômicas e analíticas aqui descritas.
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
    backgroundColor: '#E8F5E9',
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
    color: '#43A047',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#424242',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
    color: '#212121',
  },
  alertText: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    color: '#C62828',
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
