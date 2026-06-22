import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { getMedicationAdherence, getMockDietAdherence, getMockHydration } from '../../src/services/reportsService';

const C = {
  primary: '#E53935',
  background: '#FFF8F8',
  white: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#F5F0F0',
};

const screenWidth = Dimensions.get('window').width;
const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

export default function AdherenceReportScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { medicationId } = useLocalSearchParams();

  const [medData, setMedData] = useState<any[]>([]);
  const [dietData, setDietData] = useState<any>(null);
  const [hydroData, setHydroData] = useState<any>(null);

  useEffect(() => {
    // If medicationId is 'all', we pass undefined to get the global adherence
    const medIdToFetch = (medicationId && medicationId !== 'all') ? String(medicationId) : undefined;
    const med = getMedicationAdherence(medIdToFetch);
    setMedData([
      { name: t('reports.adherence.taken'), count: med.taken, color: '#4CAF50', legendFontColor: '#7F7F7F', legendFontSize: 14 },
      { name: t('reports.adherence.missed'), count: med.missed, color: '#F44336', legendFontColor: '#7F7F7F', legendFontSize: 14 },
    ]);

    const diet = getMockDietAdherence();
    setDietData({
      labels: diet.labels,
      datasets: [
        { data: diet.completed, color: () => '#4CAF50' }, // Green for completed
        { data: diet.missed, color: () => '#FF9800' }, // Orange for cheat meals
      ],
    });

    const hydro = getMockHydration();
    setHydroData({
      labels: hydro.labels,
      datasets: [{ data: hydro.data }],
    });
  }, [t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('reports.adherence.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Medication Adherence */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><MaterialCommunityIcons name="pill" size={20}/> {t('reports.adherence.medication')}</Text>
          {medData.length > 0 && (
            <PieChart
              data={medData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              accessor={"count"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[10, 0]}
              absolute
            />
          )}
        </View>

        {/* Diet Adherence */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><MaterialCommunityIcons name="food-apple" size={20}/> {t('reports.adherence.diet')}</Text>
          <Text style={styles.cardSubtitle}>Verde = Dieta | Laranja = Refeição Livre</Text>
          {dietData && (
            <BarChart
              data={dietData}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero
            />
          )}
        </View>

        {/* Hydration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}><MaterialCommunityIcons name="water" size={20}/> {t('reports.adherence.hydration')}</Text>
          <Text style={styles.cardSubtitle}>Consumo em Litros</Text>
          {hydroData && (
            <BarChart
              data={hydroData}
              width={screenWidth - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix="L"
              chartConfig={{...chartConfig, color: (opacity = 1) => `rgba(3, 169, 244, ${opacity})`}}
              verticalLabelRotation={0}
              fromZero
            />
          )}
        </View>

        <View style={{ height: 40 }}/>
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
    alignItems: 'center'
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4, width: '100%' },
  cardSubtitle: { fontSize: 13, color: C.textSecondary, marginBottom: 16, width: '100%' },
});
