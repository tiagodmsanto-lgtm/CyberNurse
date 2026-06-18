import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getDosesByDateRange } from '../../src/services/medicationService';
import { useTranslation } from 'react-i18next';

// ── Types ──────────────────────────────────────────────
type DayStatus = 'all' | 'partial' | 'missed' | 'none';

interface DayData {
  day: number;
  status: DayStatus;
  doses: DoseDetail[];
}

interface DoseDetail {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
}

// ── Constants ──────────────────────────────────────────
const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const CALENDAR_PADDING = 16;
const CELL_SIZE = (SCREEN_WIDTH - CALENDAR_PADDING * 2) / 7;

// ── Mock Data Generator ────────────────────────────────
function generateMockData(year: number, month: number): Map<number, DayData> {
  const today = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data = new Map<number, DayData>();

  const medicationPool: Omit<DoseDetail, 'id' | 'taken'>[] = [
    { name: 'Losartana', dosage: '50mg', time: '08:00' },
    { name: 'Metformina', dosage: '850mg', time: '12:00' },
    { name: 'Omeprazol', dosage: '20mg', time: '07:00' },
    { name: 'Vitamina D', dosage: '2000UI', time: '14:00' },
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isFuture = date > today;
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isFuture && !isToday) {
      data.set(day, { day, status: 'none', doses: [] });
      continue;
    }

    // Deterministic pseudo-random based on day
    const seed = (day * 7 + month * 13 + year) % 10;
    const doses: DoseDetail[] = medicationPool.map((med, i) => ({
      ...med,
      id: `${day}-${i}`,
      taken: isFuture || isToday
        ? i < 2 // Partial for today
        : seed <= 1
          ? false // Missed day
          : seed <= 3
            ? i % 2 === 0 // Partial day
            : true, // All taken
    }));

    const takenCount = doses.filter(d => d.taken).length;
    let status: DayStatus = 'none';
    if (takenCount === doses.length) status = 'all';
    else if (takenCount > 0) status = 'partial';
    else if (takenCount === 0 && !isFuture) status = 'missed';

    data.set(day, { day, status, doses });
  }

  return data;
}

// ── Status Dot Color Mapping ───────────────────────────
function getStatusColor(status: DayStatus): string {
  switch (status) {
    case 'all': return '#43A047';
    case 'partial': return '#FB8C00';
    case 'missed': return '#D32F2F';
    case 'none': return '#BDBDBD';
  }
}

// ── Component ──────────────────────────────────────────
export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [focusKey, setFocusKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusKey(k => k + 1);
    }, [])
  );

  // Generate calendar grid data
  const { monthData, calendarGrid, adherencePercent } = useMemo(() => {
    const data = generateMockData(currentYear, currentMonth);

    // Fetch actual doses from database
    let dbDoses: any[] = [];
    try {
      const startOfMonth = new Date(currentYear, currentMonth, 1).getTime();
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();
      dbDoses = getDosesByDateRange(startOfMonth, endOfMonth);
    } catch (e) {
      console.error('Failed to get database doses for calendar:', e);
    }

    // Group dbDoses by day
    const dosesByDay = new Map<number, any[]>();
    for (const dose of dbDoses) {
      const day = new Date(dose.scheduledAt).getDate();
      if (!dosesByDay.has(day)) {
        dosesByDay.set(day, []);
      }
      dosesByDay.get(day)!.push({
        id: dose.id,
        name: dose.medicationName,
        dosage: dose.dosage,
        time: new Date(dose.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        taken: dose.status === 'taken',
      });
    }

    // Merge actual doses into Map
    dosesByDay.forEach((doses, day) => {
      const takenCount = doses.filter(d => d.taken).length;
      let status: DayStatus = 'none';
      if (doses.length > 0) {
        if (takenCount === doses.length) status = 'all';
        else if (takenCount > 0) status = 'partial';
        else status = 'missed';
      }
      data.set(day, { day, status, doses });
    });

    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Build grid: leading blanks + day numbers
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);

    // Calculate adherence
    let totalDoses = 0;
    let takenDoses = 0;
    data.forEach(dayData => {
      if (dayData.status !== 'none') {
        totalDoses += dayData.doses.length;
        takenDoses += dayData.doses.filter(d => d.taken).length;
      }
    });
    const pct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    return { monthData: data, calendarGrid: grid, adherencePercent: pct };
  }, [currentMonth, currentYear, focusKey]);

  const isToday = useCallback(
    (day: number) =>
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear(),
    [currentMonth, currentYear, today],
  );

  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDay(null);
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDay(null);
  }, [currentMonth]);

  const selectedDayData = selectedDay ? monthData.get(selectedDay) : null;

  // Break grid into rows of 7
  const rows: (number | null)[][] = [];
  for (let i = 0; i < calendarGrid.length; i += 7) {
    rows.push(calendarGrid.slice(i, i + 7));
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('calendar.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('calendar.subtitle')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Adherence Card ── */}
        <View style={styles.adherenceCard}>
          <View style={styles.adherenceRow}>
            <View>
              <Text style={styles.adherenceLabel}>{t('calendar.adherenceMonthly')}</Text>
              <Text style={styles.adherenceMonth}>
                {MONTH_NAMES[currentMonth]} {currentYear}
              </Text>
            </View>
            <View style={styles.adherenceCircle}>
              <Text style={styles.adherencePercent}>{adherencePercent}%</Text>
            </View>
          </View>
          <View style={styles.adherenceBarBg}>
            <View
              style={[
                styles.adherenceBarFill,
                {
                  width: `${adherencePercent}%`,
                  backgroundColor:
                    adherencePercent >= 80
                      ? '#43A047'
                      : adherencePercent >= 50
                        ? '#FB8C00'
                        : '#D32F2F',
                },
              ]}
            />
          </View>
        </View>

        {/* ── Month Navigation ── */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={goToPrevMonth}
            style={styles.navArrow}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={styles.navArrow}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-right" size={28} color="#212121" />
          </TouchableOpacity>
        </View>

        {/* ── Calendar Grid ── */}
        <View style={styles.calendarCard}>
          {/* Weekday header */}
          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map(label => (
              <View key={label} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Day rows */}
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.dayRow}>
              {row.map((day, colIdx) => {
                if (day === null) {
                  return <View key={`blank-${colIdx}`} style={styles.dayCell} />;
                }

                const dayData = monthData.get(day);
                const isTodayDay = isToday(day);
                const isSelected = selectedDay === day;
                const status = dayData?.status ?? 'none';

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      isSelected && !isTodayDay && styles.dayCellSelected,
                      isTodayDay && styles.dayCellToday,
                    ]}
                    onPress={() => setSelectedDay(day)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isTodayDay && styles.dayTextToday,
                        isSelected && !isTodayDay && styles.dayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(status) },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
              {/* Pad last row if needed */}
              {row.length < 7 &&
                Array.from({ length: 7 - row.length }).map((_, i) => (
                  <View key={`pad-${i}`} style={styles.dayCell} />
                ))}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.legend}>
            {([
              { status: 'all' as DayStatus, label: t('calendar.legendAll') },
              { status: 'partial' as DayStatus, label: t('calendar.legendPartial') },
              { status: 'missed' as DayStatus, label: t('calendar.legendMissed') },
              { status: 'none' as DayStatus, label: t('calendar.legendNone') },
            ]).map(item => (
              <View key={item.status} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Selected Day Details ── */}
        {selectedDay && selectedDayData && selectedDayData.doses.length > 0 && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={22}
                color="#E53935"
              />
              <Text style={styles.detailsTitle}>
                {selectedDay} {t('calendar.of')} {MONTH_NAMES[currentMonth]}
              </Text>
            </View>

            {selectedDayData.doses.map(dose => (
              <View key={dose.id} style={styles.doseRow}>
                <View style={styles.doseTimeContainer}>
                  <Text style={styles.doseTime}>{dose.time}</Text>
                </View>
                <View style={styles.doseInfo}>
                  <Text style={styles.doseName}>{dose.name}</Text>
                  <Text style={styles.doseDosage}>{dose.dosage}</Text>
                </View>
                <View
                  style={[
                    styles.doseStatusBadge,
                    {
                      backgroundColor: dose.taken
                        ? 'rgba(67, 160, 71, 0.12)'
                        : 'rgba(211, 47, 47, 0.12)',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={dose.taken ? 'check-circle' : 'close-circle'}
                    size={18}
                    color={dose.taken ? '#43A047' : '#D32F2F'}
                  />
                  <Text
                    style={[
                      styles.doseStatusText,
                      { color: dose.taken ? '#43A047' : '#D32F2F' },
                    ]}
                  >
                    {dose.taken ? t('calendar.statusTaken') : t('calendar.statusMissed')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty selection state */}
        {selectedDay && selectedDayData && selectedDayData.doses.length === 0 && (
          <View style={styles.emptyDetail}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={48}
              color="#BDBDBD"
            />
            <Text style={styles.emptyDetailText}>
              {t('calendar.emptyDetail')}
            </Text>
          </View>
        )}

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
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Adherence Card
  adherenceCard: {
    backgroundColor: '#E53935',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adherenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  adherenceMonth: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  adherenceCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adherencePercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adherenceBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  adherenceBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  // Month Navigation
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },

  // Calendar Card
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
  },
  dayRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginVertical: 2,
    borderRadius: 12,
    minHeight: 48,
  },
  dayCellToday: {
    backgroundColor: '#E53935',
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: '#FCE4EC',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 4,
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#E53935',
    fontWeight: '700',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F0F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#757575',
    fontWeight: '500',
  },

  // Selected Day Details
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0F0',
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    marginLeft: 8,
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0F0',
  },
  doseTimeContainer: {
    width: 52,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F5F0F0',
    alignItems: 'center',
  },
  doseTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#212121',
  },
  doseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  doseDosage: {
    fontSize: 13,
    color: '#757575',
    marginTop: 1,
  },
  doseStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doseStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Empty detail
  emptyDetail: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyDetailText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 12,
    textAlign: 'center',
  },
});
