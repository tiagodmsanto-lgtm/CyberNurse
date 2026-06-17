import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { getAllMedications } from '../../src/services/medicationService';
import { getDatabase } from '../../src/services/database';

// ── Types ──────────────────────────────────────────────
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface SettingsItem {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** Renders the right side content instead of the default chevron */
  trailing?: React.ReactNode;
  /** Text/icon color override */
  color?: string;
  /** If true, skip the chevron */
  noChevron?: boolean;
}

interface SettingsSection {
  title: string;
  subtitle?: string;
  items: SettingsItem[];
}

// ── Data ───────────────────────────────────────────────
const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Conta',
    items: [
      { icon: 'account-outline', title: 'Dados pessoais', onPress: () => router.push('/profile/personal-data') },
      { icon: 'bell-outline', title: 'Notificações' },
      { icon: 'translate', title: 'Idioma', trailing: (
        <Text style={{ fontSize: 14, color: '#757575', marginRight: 4 }}>
          Português
        </Text>
      )},
    ],
  },
  {
    title: 'Saúde',
    subtitle: 'Gerencie sua saúde e dados',
    items: [
      { icon: 'account-group-outline', title: 'Cuidadores' },
      { icon: 'chart-line', title: 'Relatórios' },
      { icon: 'download-outline', title: 'Exportar dados' },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: 'information-outline', title: 'Sobre o Cyber Nurse' },
      { icon: 'file-document-outline', title: 'Termos de uso' },
      { icon: 'shield-check-outline', title: 'Política de privacidade' },
      {
        icon: 'cellphone',
        title: 'Versão',
        trailing: (
          <Text style={{ fontSize: 14, color: '#757575' }}>1.0.0</Text>
        ),
        noChevron: true,
      },
    ],
  },
  {
    title: 'Conta',
    items: [
      {
        icon: 'logout',
        title: 'Sair',
        color: '#D32F2F',
        noChevron: true,
      },
    ],
  },
];

// ── Component ──────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [activeMedsCount, setActiveMedsCount] = useState(0);
  const [adherenceRate, setAdherenceRate] = useState(87);

  useFocusEffect(
    useCallback(() => {
      try {
        const meds = getAllMedications();
        setActiveMedsCount(meds.length);

        const db = getDatabase();
        const allDoses = db.getAllSync<{ status: string }>('SELECT status FROM doses');
        if (allDoses.length > 0) {
          const taken = allDoses.filter(d => d.status === 'taken').length;
          setAdherenceRate(Math.round((taken / allDoses.length) * 100));
        } else {
          setAdherenceRate(100);
        }
      } catch (e) {
        console.error('Failed to load stats for profile:', e);
      }
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Card ── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons
                name="account"
                size={48}
                color="#FFFFFF"
              />
            </View>
            {/* Camera overlay button */}
            <TouchableOpacity style={styles.cameraButton} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name="camera"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>Tiago Silva</Text>
          <Text style={styles.userEmail}>tiago.silva@email.com</Text>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeMedsCount}</Text>
              <Text style={styles.statLabel}>Medicamentos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{adherenceRate}%</Text>
              <Text style={styles.statLabel}>Adesão</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>Dias seguidos</Text>
            </View>
          </View>
        </View>

        {/* ── Settings Sections ── */}
        {SETTINGS_SECTIONS.map((section, sectionIdx) => (
          <View key={`section-${sectionIdx}`} style={styles.sectionContainer}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.subtitle && (
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              )}
            </View>

            {/* Section card */}
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIdx) => {
                const isLast = itemIdx === section.items.length - 1;
                const iconColor = item.color ?? '#212121';
                const textColor = item.color ?? '#212121';

                return (
                  <TouchableOpacity
                    key={`${sectionIdx}-${itemIdx}`}
                    style={[
                      styles.settingsRow,
                      !isLast && styles.settingsRowBorder,
                    ]}
                    activeOpacity={0.6}
                    onPress={item.onPress}
                  >
                    {/* Icon */}
                    <View
                      style={[
                        styles.settingsIconContainer,
                        {
                          backgroundColor: item.color
                            ? 'rgba(211, 47, 47, 0.08)'
                            : '#F5F0F0',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={iconColor}
                      />
                    </View>

                    {/* Title */}
                    <Text style={[styles.settingsTitle, { color: textColor }]}>
                      {item.title}
                    </Text>

                    {/* Trailing */}
                    <View style={styles.settingsTrailing}>
                      {item.trailing}
                      {!item.noChevron && (
                        <MaterialCommunityIcons
                          name="chevron-right"
                          size={22}
                          color="#BDBDBD"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footerText}>
          Cyber Nurse © 2025 by InkluDevs{'\n'}
          Feito com ❤️ para sua saúde
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F8',
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212121',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Avatar Card
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F48FB1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FCE4EC',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212121',
  },
  userEmail: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },

  // Quick stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F0F0',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E53935',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F5F0F0',
  },

  // Section
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#757575',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#BDBDBD',
    marginTop: 2,
  },

  // Settings Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0F0',
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  settingsTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Footer
  footerText: {
    fontSize: 13,
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
