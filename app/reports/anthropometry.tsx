import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-chart-kit';
import { getMockBodyMetrics } from '../../src/services/reportsService';

const C = {
  primary: '#E53935',
  background: '#FFF8F8',
  white: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#F5F0F0',
};

const screenWidth = Dimensions.get('window').width;

export default function AnthropometryReportScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [weightData, setWeightData] = useState<any>(null);
  const [fatData, setFatData] = useState<any>(null);

  useEffect(() => {
    const metrics = getMockBodyMetrics();
    setWeightData({
      labels: metrics.labels,
      datasets: [{ data: metrics.weight }],
    });
    setFatData({
      labels: metrics.labels,
      datasets: [{ data: metrics.fat }],
    });
  }, []);

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(251, 140, 0, ${opacity})`,
    strokeWidth: 3,
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#FB8C00' },
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('reports.anthropometry.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}><MaterialCommunityIcons name="scale-bathroom" size={20}/> {t('reports.anthropometry.weight')}</Text>
          {weightData && (
            <LineChart
              data={weightData}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" kg"
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}><MaterialCommunityIcons name="percent" size={20}/> {t('reports.anthropometry.fat')}</Text>
          {fatData && (
            <LineChart
              data={fatData}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" %"
              chartConfig={{...chartConfig, color: (opacity=1)=> `rgba(67, 160, 71, ${opacity})`, propsForDots: { stroke: '#43A047'} }}
              bezier
              style={styles.chart}
            />
          )}
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
  chart: { borderRadius: 16, marginLeft: -16 }
});
