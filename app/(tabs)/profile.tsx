import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

import { getAllMedications, rescheduleAllAlarms } from '../../src/services/medicationService';
import { getDatabase } from '../../src/services/database';
import { useUserProfileStore } from '../../src/stores/userProfileStore';
import { useAppStore } from '../../src/stores/appStore';
import auth from '@react-native-firebase/auth';

// ── Types ──────────────────────────────────────────────
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface SettingsItem {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  color?: string;
  noChevron?: boolean;
}

interface SettingsSection {
  title: string;
  subtitle?: string;
  items: SettingsItem[];
}

// ── Component ──────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const userName = useUserProfileStore((state) => state.data.name) || t('profile.userNameFallback');
  
  const [activeMedsCount, setActiveMedsCount] = useState(0);
  const [adherenceRate, setAdherenceRate] = useState(87);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  
  const { alarmSound, setAlarmSound } = useAppStore();
  const [showSoundModal, setShowSoundModal] = useState(false);

  const handleLogout = () => {
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
              useUserProfileStore.getState().clearPersonalData();
              const db = getDatabase();
              db.runSync('DELETE FROM medications');
              db.runSync('DELETE FROM schedules');
              db.runSync('DELETE FROM doses');
              db.runSync('DELETE FROM stock');
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
  
  // ── Data ───────────────────────────────────────────────
  const SETTINGS_SECTIONS: SettingsSection[] = [
    {
      title: t('profile.sections.appSettings.title'),
      items: [
        { icon: 'account-outline', title: t('profile.sections.appSettings.personalData'), onPress: () => router.push('/profile/personal-data') },
        {
          icon: 'music-note',
          title: 'Som do Alarme',
          trailing: (
            <Text style={{ fontSize: 14, color: '#757575' }}>
              {alarmSound === 'alarm' ? 'Padrão 01' : 'Padrão 02'}
            </Text>
          ),
          onPress: () => setShowSoundModal(true),
        },
      ],
    },
    {
      title: t('profile.sections.health.title'),
      subtitle: t('profile.sections.health.subtitle'),
      items: [
        { icon: 'account-group-outline', title: t('supportNetwork.title'), onPress: () => router.push('/profile/support-network') },
        { icon: 'chart-line', title: t('profile.sections.health.reports'), onPress: () => router.push('/reports') },
      ],
    },
    {
      title: t('profile.sections.app.title'),
      items: [
        { icon: 'information-outline', title: t('profile.sections.app.about'), onPress: () => router.push('/profile/about') },
        { icon: 'file-document-outline', title: t('profile.sections.app.terms'), onPress: () => router.push('/profile/terms') },
        { icon: 'shield-check-outline', title: t('profile.sections.app.privacy'), onPress: () => router.push('/profile/privacy') },
        {
          icon: 'cellphone',
          title: t('profile.sections.app.version'),
          trailing: (
            <Text style={{ fontSize: 14, color: '#757575' }}>1.0.0</Text>
          ),
          noChevron: true,
        },
      ],
    },
    {
      title: t('profile.sections.account.title'),
      items: [
        {
          icon: 'crown',
          title: 'Versão PREMIUM',
          color: '#FBC02D',
          onPress: () => router.push('/premium/paywall'),
        },
        {
          icon: 'logout',
          title: t('profile.sections.account.logout'),
          color: '#D32F2F',
          noChevron: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

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
      
      const loadProfileImage = async () => {
        try {
          const uri = await AsyncStorage.getItem('profileImageUri');
          if (uri) setProfileImageUri(uri);
        } catch (e) {
          console.error('Failed to load profile image:', e);
        }
      };
      loadProfileImage();
    }, [])
  );

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setProfileImageUri(uri);
        await AsyncStorage.setItem('profileImageUri', uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('profile.alerts.error'), t('profile.alerts.imagePickError'));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.headerTitle')}</Text>
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
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={{ width: 88, height: 88, borderRadius: 44 }} />
              ) : (
                <MaterialCommunityIcons
                  name="account"
                  size={48}
                  color="#FFFFFF"
                />
              )}
            </View>
            {/* Camera overlay button */}
            <TouchableOpacity style={styles.cameraButton} activeOpacity={0.7} onPress={handlePickImage}>
              <MaterialCommunityIcons
                name="camera"
                size={16}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>tiago.silva@email.com</Text>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeMedsCount}</Text>
              <Text style={styles.statLabel}>{t('profile.stats.medications')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{adherenceRate}%</Text>
              <Text style={styles.statLabel}>{t('profile.stats.adherence')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>{t('profile.stats.streak')}</Text>
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
          {t('profile.footer')}
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Sound Modal */}
      <Modal visible={showSoundModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolha o Som do Alarme</Text>
            
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={async () => {
                setAlarmSound('alarm');
                setShowSoundModal(false);
                await rescheduleAllAlarms();
              }}
            >
              <Text style={[styles.modalButtonText, alarmSound === 'alarm' && { fontWeight: '700' }]}>
                Padrão 01
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={async () => {
                setAlarmSound('alarm_1');
                setShowSoundModal(false);
                await rescheduleAllAlarms();
              }}
            >
              <Text style={[styles.modalButtonText, alarmSound === 'alarm_1' && { fontWeight: '700' }]}>
                Padrão 02
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setShowSoundModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0F0',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E53935',
  },
  modalCancelButton: {
    width: '100%',
    paddingVertical: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
});
