import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('An error occurred', err));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.sections.app.about')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <MaterialCommunityIcons name="heart-pulse" size={64} color="#E53935" />
          </View>
          <Text style={styles.appName}>Cyber Nurse</Text>
          <Text style={styles.version}>{t('profile.sections.app.version')} 1.0.0</Text>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            Seu assistente virtual de enfermagem. Projetado para facilitar o controle de sua saúde, medicamentos, lembretes e relatórios de acompanhamento, tudo na palma da sua mão com cuidado e tecnologia.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desenvolvedor</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Image source={require('../../assets/images/inkludevs_logo.jpg')} style={styles.developerLogo} resizeMode="contain" />
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>InkluDevs</Text>
                <Text style={styles.cardSubtitle}>Feito com ❤️ para sua saúde</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links Úteis</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.linkItem} onPress={() => handleOpenLink('https://cybernurse.app')}>
              <MaterialCommunityIcons name="web" size={24} color="#757575" />
              <Text style={styles.linkText}>Website Oficial</Text>
              <MaterialCommunityIcons name="open-in-new" size={20} color="#BDBDBD" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.linkItem} onPress={() => handleOpenLink('mailto:suporte@cybernurse.app')}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#757575" />
              <Text style={styles.linkText}>Suporte Técnico</Text>
              <MaterialCommunityIcons name="open-in-new" size={20} color="#BDBDBD" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.linkItem} onPress={() => {}}>
              <MaterialCommunityIcons name="star-outline" size={24} color="#FBC02D" />
              <Text style={styles.linkText}>Avalie o App</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#BDBDBD" />
            </TouchableOpacity>
          </View>
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
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FCE4EC',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#424242',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  developerLogo: {
    width: 60,
    height: 40,
    borderRadius: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#757575',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0F0',
    marginLeft: 56,
  },
});
