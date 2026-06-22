import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { useMedicationStore } from '../../src/stores';
import { getMedicationAdherence } from '../../src/services/reportsService';

const C = {
  primary: '#E53935',
  background: '#FFF8F8',
  white: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#F5F0F0',
};

export default function ReportsDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const isPremium = useSubscriptionStore(state => state.isPremium);
  const medications = useMedicationStore(state => state.medications);
  
  const [selectedMedId, setSelectedMedId] = React.useState<string>(
    isPremium ? 'all' : (medications.length > 0 ? medications[0].id : 'all')
  );

  const handleExportPDF = async () => {
    try {
      const adherence = getMedicationAdherence(selectedMedId === 'all' ? undefined : selectedMedId);
      const medName = selectedMedId === 'all' ? 'Visão Geral (Todas as Medicações)' : medications.find(m => m.id === selectedMedId)?.name || 'Medicação';
      
      const html = `
        <html>
          <head>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #212121; }
              h1 { color: #E53935; text-align: center; border-bottom: 2px solid #E53935; padding-bottom: 10px; }
              h2 { color: #3B4CCA; margin-top: 30px; }
              .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              p { line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>Relatório Clínico - Cyber Nurse</h1>
            <p><strong>Contexto:</strong> ${medName}</p>
            <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="card">
              <h2>1. Adesão ao Protocolo</h2>
              <p>Medicação Tomada: ${adherence.taken} doses</p>
              <p>Esquecimentos: ${adherence.missed} doses</p>
              <p>Taxa de Adesão: ${Math.round((adherence.taken / adherence.total) * 100)}%</p>
            </div>

            <div class="card">
              <h2>2. Sinais Vitais</h2>
              <p>Média de Pressão Arterial: 125x80 mmHg</p>
              <p>Glicemia em Jejum Média: 92 mg/dL</p>
            </div>
            
            <div class="card">
              <h2>3. Evolução Corporal</h2>
              <p>Peso Atual: 79.8 kg (Tendência de Queda)</p>
              <p>Gordura Corporal: 16.5%</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Erro', 'O compartilhamento não está disponível neste dispositivo.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível exportar o PDF.');
      console.error(e);
    }
  };

  const REPORT_CARDS = [
    {
      title: t('reports.adherence.title'),
      desc: t('reports.adherence.desc'),
      icon: 'check-decagram-outline',
      color: '#43A047',
      route: '/reports/adherence',
    },
    {
      title: t('reports.anthropometry.title'),
      desc: t('reports.anthropometry.desc'),
      icon: 'human-handsup',
      color: '#FB8C00',
      route: '/reports/anthropometry',
    },
    {
      title: t('reports.vitals.title'),
      desc: t('reports.vitals.desc'),
      icon: 'heart-pulse',
      color: '#E53935',
      route: '/reports/vitals',
    },
    {
      title: t('reports.performance.title'),
      desc: t('reports.performance.desc'),
      icon: 'lightning-bolt-outline',
      color: '#7E57C2',
      route: '/reports/performance',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('reports.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Medication Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorTitle}>Contexto do Relatório:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScroll}>
            {/* All Medications Chip */}
            <TouchableOpacity
              style={[styles.chip, selectedMedId === 'all' && styles.chipActive]}
              onPress={() => {
                if (isPremium) setSelectedMedId('all');
                else router.push('/premium/paywall' as any);
              }}
            >
              {!isPremium && <MaterialCommunityIcons name="lock" size={14} color={C.textSecondary} style={{marginRight: 4}} />}
              <Text style={[styles.chipText, selectedMedId === 'all' && styles.chipTextActive]}>
                Visão Geral
              </Text>
            </TouchableOpacity>

            {/* Individual Medications */}
            {medications.map(med => (
              <TouchableOpacity
                key={med.id}
                style={[styles.chip, selectedMedId === med.id && styles.chipActive]}
                onPress={() => setSelectedMedId(med.id)}
              >
                <Text style={[styles.chipText, selectedMedId === med.id && styles.chipTextActive]}>
                  {med.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.heroCard}>
          <MaterialCommunityIcons name="chart-pie" size={48} color={C.white} />
          <Text style={styles.heroTitle}>Sua Evolução em Dados</Text>
          <Text style={styles.heroDesc}>
            Acompanhe o seu progresso clínico e de performance. Todos os dados estão prontos para envio.
          </Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
            <MaterialCommunityIcons name="file-pdf-box" size={20} color={C.primary} />
            <Text style={styles.exportBtnText}>{t('reports.exportPdf')}</Text>
          </TouchableOpacity>
        </View>

        {REPORT_CARDS.map((card, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(`${card.route}?medicationId=${selectedMedId}` as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: card.color + '15' }]}>
              <MaterialCommunityIcons name={card.icon as any} size={28} color={card.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDesc}>{card.desc}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#BDBDBD" />
          </TouchableOpacity>
        ))}
        
        <View style={{ height: 40 }} />
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
  heroCard: {
    backgroundColor: C.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTitle: { fontSize: 20, fontWeight: '700', color: C.white, marginTop: 12, marginBottom: 8 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exportBtnText: { color: C.primary, fontWeight: '700', fontSize: 15, marginLeft: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  selectorContainer: { marginBottom: 20 },
  selectorTitle: { fontSize: 14, fontWeight: '700', color: C.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  selectorScroll: { gap: 8, paddingBottom: 4 },
  chip: { 
    flexDirection: 'row',
    backgroundColor: C.white, 
    borderWidth: 1, 
    borderColor: C.border, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20,
    alignItems: 'center'
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  chipTextActive: { color: C.white },
});
