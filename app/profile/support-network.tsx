import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getAllContacts, deleteContact, SupportContact } from '../../src/services/supportNetworkService';

const C = {
  primary: '#E53935',
  background: '#FFF8F8',
  white: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#F5F0F0',
};

export default function SupportNetworkScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<SupportContact[]>([]);

  const loadContacts = useCallback(() => {
    try {
      const data = getAllContacts();
      setContacts(data);
    } catch (e) {
      console.error('Failed to load contacts', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [loadContacts])
  );

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Remover Contato',
      'Tem certeza que deseja remover este contato da sua rede de apoio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => {
            deleteContact(id);
            loadContacts();
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: SupportContact }) => {
    const isProfessional = item.type === 'professional';
    const relationLabel = isProfessional 
      ? t(`supportNetwork.professions.${item.profession || 'other'}`)
      : t(`supportNetwork.relations.${item.relation || 'other'}`);

    const iconName = isProfessional ? 'doctor' : 'account-heart';
    const iconColor = isProfessional ? '#3B4CCA' : C.primary;
    const bgColor = isProfessional ? 'rgba(59, 76, 202, 0.1)' : 'rgba(229, 57, 53, 0.1)';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
            <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.relation}>{relationLabel}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={C.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardFooter}>
          {item.phone ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(item.phone)}>
              <MaterialCommunityIcons name="phone" size={18} color={C.textSecondary} />
              <Text style={styles.actionText}>{item.phone}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionBtn}>
              <MaterialCommunityIcons name="phone-off" size={18} color="#E0E0E0" />
              <Text style={[styles.actionText, { color: '#E0E0E0' }]}>Sem telefone</Text>
            </View>
          )}

          {item.email ? (
            <View style={styles.actionBtn}>
              <MaterialCommunityIcons name="email" size={18} color={C.textSecondary} />
              <Text style={styles.actionText}>{item.email}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('supportNetwork.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group" size={64} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>{t('supportNetwork.emptyState')}</Text>
          <Text style={styles.emptyDesc}>{t('supportNetwork.emptyStateDesc')}</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        activeOpacity={0.8}
        onPress={() => router.push('/profile/support-network-add')}
      >
        <MaterialCommunityIcons name="plus" size={24} color={C.white} />
        <Text style={styles.fabText}>{t('supportNetwork.addContact')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoBox: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 2,
  },
  relation: {
    fontSize: 14,
    color: C.textSecondary,
  },
  deleteBtn: {
    padding: 8,
  },
  cardFooter: {
    flexDirection: 'column',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: C.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    color: C.white,
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
});
