import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-chart-kit';
import { getMockVitals, getMockSymptoms } from '../../src/services/reportsService';

const C = {
  primary: '#E53935',
  background: '#FFF8F8',
  white: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#F5F0F0',
};

const screenWidth = Dimensions.get('window').width;

export default function VitalsReportScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [bpData, setBpData] = useState<any>(null);
  const [symptoms, setSymptoms] = useState<any[]>([]);

  useEffect(() => {
    const vitals = getMockVitals();
    setBpData({
      labels: vitals.labels,
      datasets: [
        { data: vitals.bpSys, color: () => '#E53935' }, // Systolic Red
        { data: vitals.bpDia, color: () => '#3B4CCA' }, // Diastolic Blue
      ],
      legend: [t('reports.vitals.sys'), t('reports.vitals.dia')]
    });

    setSymptoms(getMockSymptoms());
  }, [t]);

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    propsForDots: { r: '4', strokeWidth: '1' },
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('reports.vitals.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}><MaterialCommunityIcons name="heart-pulse" size={20}/> {t('reports.vitals.bp')}</Text>
          {bpData && (
            <LineChart
              data={bpData}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}><MaterialCommunityIcons name="clipboard-text-outline" size={20}/> {t('reports.vitals.symptoms')}</Text>
          {symptoms.map((s, i) => (
            <View key={i} style={styles.symptomRow}>
              <View style={styles.symptomDateBox}>
                <Text style={styles.symptomDate}>{s.date}</Text>
              </View>
              <View style={styles.symptomInfo}>
                <Text style={styles.symptomName}>{s.symptom}</Text>
                <Text style={styles.symptomNotes}>{s.notes}</Text>
              </View>
              <View style={styles.severityBox}>
                <Text style={styles.severityNum}>{s.severity}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
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
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 16 },
  chart: { borderRadius: 16, marginLeft: -16 },
  symptomRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 12,
    alignItems: 'center'
  },
  symptomDateBox: { width: 50 },
  symptomDate: { fontSize: 13, fontWeight: '700', color: C.primary },
  symptomInfo: { flex: 1, paddingHorizontal: 12 },
  symptomName: { fontSize: 15, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  symptomNotes: { fontSize: 13, color: C.textSecondary },
  severityBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center' },
  severityNum: { fontSize: 14, fontWeight: '700', color: C.primary }
});
