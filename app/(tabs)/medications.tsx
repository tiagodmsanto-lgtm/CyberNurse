import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { Spacing, BorderRadius } from '../../src/theme/spacing';
import { MedicationCard } from '../../src/components/medication/MedicationCard';
import type { Medication, MedicationForm } from '../../src/models/Medication';
import { useMedicationStore, useStockStore } from '../../src/stores';
import { getAllMedications, getAllStock } from '../../src/services/medicationService';

// ─── Filter types ───────────────────────────────────────
type FilterType = 'all' | 'active' | 'archived';

interface FilterChip {
  key: FilterType;
  label: string;
  icon: string;
}

const FILTERS: FilterChip[] = [
  { key: 'all', label: 'Todos', icon: 'view-grid-outline' },
  { key: 'active', label: 'Ativos', icon: 'check-circle-outline' },
  { key: 'archived', label: 'Arquivados', icon: 'archive-outline' },
];

// ─── Component ──────────────────────────────────────────
export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const medications = useMedicationStore((state) => state.medications);
  const stocks = useStockStore((state) => state.stocks);

  const fetchMedications = useCallback(() => {
    try {
      const meds = getAllMedications();
      const st = getAllStock();
      useMedicationStore.getState().setMedications(meds);
      useStockStore.getState().setStocks(st);
    } catch (error) {
      console.error('Failed to fetch medications and stock:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMedications();
    }, [fetchMedications])
  );

  // Animation values
  const fabScale = useRef(new Animated.Value(1)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMedications();
    setTimeout(() => setRefreshing(false), 800);
  }, [fetchMedications]);

  // FAB press animation
  const onFabPressIn = useCallback(() => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      useNativeDriver: false,
    }).start();
  }, []);

  const onFabPressOut = useCallback(() => {
    Animated.spring(fabScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleFabPress = useCallback(() => {
    router.push('/medication/add');
  }, []);

  // Filtered + searched medications
  const filteredMedications = useMemo(() => {
    let result = medications;

    // Apply filter
    if (activeFilter === 'active') {
      result = result.filter((m) => m.isActive);
    } else if (activeFilter === 'archived') {
      result = result.filter((m) => !m.isActive);
    }

    // Apply search
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.dosage.toLowerCase().includes(query)
      );
    }

    return result;
  }, [medications, activeFilter, search]);

  // Count badges
  const activeCount = medications.filter((m) => m.isActive).length;
  const archivedCount = medications.filter((m) => !m.isActive).length;

  const getCountForFilter = (key: FilterType): number => {
    switch (key) {
      case 'all':
        return medications.length;
      case 'active':
        return activeCount;
      case 'archived':
        return archivedCount;
    }
  };

  // Render individual medication card
  const renderMedication = useCallback(
    ({ item }: ListRenderItemInfo<Medication>) => {
      const stock = stocks.find((s) => s.medicationId === item.id);
      return (
        <MedicationCard
          medication={item}
          onPress={() => router.push(`/medication/${item.id}`)}
          onEdit={() => router.push(`/medication/${item.id}`)}
          stockQuantity={stock?.currentQuantity}
          stockThreshold={stock?.minThreshold}
        />
      );
    },
    [stocks]
  );

  const keyExtractor = useCallback((item: Medication) => item.id, []);

  // ─── Empty state ────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons
          name="pill-off"
          size={56}
          color={Colors.secondary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {search.trim()
          ? 'Nenhum resultado encontrado'
          : activeFilter === 'archived'
          ? 'Nenhum medicamento arquivado'
          : 'Nenhum medicamento cadastrado'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {search.trim()
          ? 'Tente buscar com outros termos'
          : 'Toque no botão + para adicionar seu primeiro medicamento'}
      </Text>
      {!search.trim() && activeFilter === 'all' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleFabPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color={Colors.white} />
          <Text style={styles.emptyButtonText}>Adicionar Medicamento</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── List header (search + filters) ─────────────────
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* Filter row */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = getCountForFilter(filter.key);
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={filter.icon as any}
                size={16}
                color={isActive ? Colors.white : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
              <View
                style={[
                  styles.filterCountBadge,
                  isActive && styles.filterCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    isActive && styles.filterCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results summary */}
      <View style={styles.resultsSummary}>
        <Text style={styles.resultsText}>
          {filteredMedications.length}{' '}
          {filteredMedications.length === 1
            ? 'medicamento'
            : 'medicamentos'}
        </Text>
        {search.trim() !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearchText}>Limpar busca</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header Section ── */}
      <Animated.View style={[styles.headerSection, { opacity: headerOpacity }]}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Medicamentos</Text>
                <Text style={styles.headerSubtitle}>
                  Gerencie todos os seus medicamentos
                </Text>
              </View>
              <View style={styles.headerBadge}>
                <MaterialCommunityIcons
                  name="pill"
                  size={18}
                  color={Colors.white}
                />
                <Text style={styles.headerBadgeText}>{activeCount}</Text>
              </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={22}
                color={Colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar medicamento..."
                placeholderTextColor={Colors.textSecondary}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('');
                    Keyboard.dismiss();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── Medications List ── */}
      <FlatList
        data={filteredMedications}
        keyExtractor={keyExtractor}
        renderItem={renderMedication}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          filteredMedications.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* ── Floating Action Button ── */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={1}
        >
          <MaterialCommunityIcons name="plus" size={28} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  headerSection: {},
  headerGradient: {
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 4,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    paddingVertical: 0,
  },

  // Filters
  listHeaderContainer: {
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.surfaceAlt,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  filterCountBadge: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterCountTextActive: {
    color: Colors.white,
  },

  // Results summary
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resultsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  clearSearchText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 1.5,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    right: Spacing.md,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
