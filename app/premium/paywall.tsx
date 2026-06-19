import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { Colors as C, Spacing, Typography } from '../../src/theme';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const setPremium = useSubscriptionStore((state) => state.setPremium);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        console.error('Error fetching offerings', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfferings();
  }, []);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        setPremium(true);
        Alert.alert('Sucesso!', 'Bem-vindo ao CyberNurse Premium!');
        router.back();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Erro', e.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        setPremium(true);
        Alert.alert('Restaurado!', 'Sua assinatura foi restaurada com sucesso.');
        router.back();
      } else {
        Alert.alert('Aviso', 'Nenhuma assinatura ativa encontrada.');
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const benefits = [
    { icon: 'adchoices', title: 'Zero Anúncios', desc: 'Navegue pelo app sem interrupções.' },
    { icon: 'chart-bell-curve-cumulative', title: 'Relatórios Avançados', desc: 'Desbloqueie gráficos detalhados de atleta e clínico.' },
    { icon: 'head-heart-outline', title: 'Suporte Prioritário', desc: 'Atendimento direto com nossa equipe.' }
  ];

  return (
    <LinearGradient colors={['#E53935', '#B71C1C']} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={28} color={C.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="crown" size={64} color="#FFD700" />
          </View>
          <Text style={styles.title}>CyberNurse Premium</Text>
          <Text style={styles.subtitle}>Desbloqueie todo o potencial da sua saúde com recursos exclusivos.</Text>
        </View>

        <View style={styles.benefitsContainer}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <MaterialCommunityIcons name={b.icon as any} size={28} color={C.white} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricingContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={C.white} />
          ) : packages.length > 0 ? (
            packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.identifier}
                style={styles.purchaseButton}
                onPress={() => handlePurchase(pkg)}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={C.primary} />
                ) : (
                  <>
                    <Text style={styles.purchaseButtonText}>
                      Assinar por {pkg.product.priceString}
                    </Text>
                    <Text style={styles.purchaseButtonSub}>
                      {pkg.product.description || 'Cobrado mensalmente. Cancele quando quiser.'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>
                [Ambiente de Teste] {'\n'}
                Quando a API Key for inserida, o preço do plano aparecerá aqui.
              </Text>
              <TouchableOpacity
                style={styles.devBypassButton}
                onPress={() => {
                  setPremium(true);
                  Alert.alert('Sucesso [DEV]', 'Premium ativado artificialmente para testes.');
                  router.back();
                }}
              >
                <Text style={styles.devBypassText}>Testar Desbloqueio Premium</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isPurchasing}>
          <Text style={styles.restoreButtonText}>Restaurar Compra Anterior</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: Spacing.s,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    marginBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.l,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  title: {
    ...Typography.h1,
    color: C.white,
    marginBottom: Spacing.m,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: Spacing.m,
  },
  benefitsContainer: {
    marginBottom: Spacing.xxl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.l,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.m,
    borderRadius: 16,
  },
  benefitIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.m,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    ...Typography.subtitle,
    color: C.white,
    marginBottom: 4,
  },
  benefitDesc: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  pricingContainer: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
  purchaseButton: {
    backgroundColor: C.white,
    paddingVertical: Spacing.l,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  purchaseButtonText: {
    ...Typography.subtitle,
    color: C.primary,
    fontWeight: '700',
  },
  purchaseButtonSub: {
    ...Typography.caption,
    color: C.textSecondary,
    marginTop: 4,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: Spacing.m,
  },
  restoreButtonText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    textDecorationLine: 'underline',
  },
  placeholderBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: Spacing.l,
    borderRadius: 16,
    alignItems: 'center',
  },
  placeholderText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: Spacing.m,
  },
  devBypassButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.xl,
    borderRadius: 20,
  },
  devBypassText: {
    ...Typography.subtitle,
    color: C.white,
  }
});
