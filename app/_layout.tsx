import { useFonts } from 'expo-font';
import { Stack, usePathname, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { StatusBar, View, Platform, AppState } from 'react-native';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import { PaperTheme } from '../src/theme';
import { initDatabase } from '../src/services/database';
import { logScreenView } from '../src/services/analytics';
import { logCrashMessage } from '../src/services/crashlytics';
import mobileAds, { useInterstitialAd, TestIds } from 'react-native-google-mobile-ads';
import { AdBanner } from '../src/components/AdBanner';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import * as Notifications from 'expo-notifications';
import notifee, { EventType } from '@notifee/react-native';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import '../src/i18n';
import { requestNotificationPermissions } from '../src/services/notificationService';
import { registerBackgroundBackup } from '../src/services/backgroundSync';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [dbReady, setDbReady] = useState(false);

  // Initialize database on app start
  useEffect(() => {
    async function setupDb() {
      try {
        await initDatabase();
        console.log('Database initialized successfully');
        await registerBackgroundBackup();
      } catch (e) {
        console.error('Failed to initialize database:', e);
      } finally {
        // Even if it fails, set to true so the app can render and handle errors gracefully
        setDbReady(true);
      }
    }
    setupDb();
    
    // Request notification permissions
    requestNotificationPermissions();
    
    // Initialize Google Mobile Ads
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('Mobile Ads initialized', adapterStatuses);
      })
      .catch(err => console.error('Failed to init Mobile Ads', err));
      
    // Log app initialization to Crashlytics to leave a breadcrumb
    logCrashMessage('App RootLayout mounted and Database init started');

    // Initialize RevenueCat
    // Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    // if (Platform.OS === 'ios') {
    //   Purchases.configure({ apiKey: 'YOUR_REVENUECAT_IOS_API_KEY_HERE' });
    // } else if (Platform.OS === 'android') {
    //   Purchases.configure({ apiKey: 'YOUR_REVENUECAT_ANDROID_API_KEY_HERE' });
    // }

    // Check Premium status
    const checkSubscription = async () => {
      try {
        if (await Purchases.isConfigured()) {
          const customerInfo = await Purchases.getCustomerInfo();
          // Assume the entitlement is named "premium" in RevenueCat
          const hasPremium = typeof customerInfo.entitlements.active['premium'] !== 'undefined';
          useSubscriptionStore.getState().setPremium(hasPremium);
        } else {
          console.log('RevenueCat não configurado ainda. Pulando check de assinatura.');
        }
      } catch (e) {
        console.error('Failed to get RevenueCat customer info:', e);
      }
    };
    checkSubscription();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const lastAdShownTime = useRef(0);
  const isPremium = useSubscriptionStore((state) => state.isPremium);

  const interstitialId = __DEV__ 
    ? TestIds.INTERSTITIAL 
    : (Platform.OS === 'android' ? 'ca-app-pub-6355833710660579/1778137599' : TestIds.INTERSTITIAL);

  const { isLoaded, isClosed, load, show } = useInterstitialAd(interstitialId, {
    requestNonPersonalizedAdsOnly: true,
  });

  useEffect(() => {
    load();
  }, [load, isClosed]);

  useEffect(() => {
    if (pathname && pathname !== previousPathname.current) {
      previousPathname.current = pathname;
      logScreenView(pathname);

      const now = Date.now();
      // Show ad if not premium, loaded and more than 2 minutes have passed
      if (!isPremium && isLoaded && (now - lastAdShownTime.current) > 120000) {
        show();
        lastAdShownTime.current = now;
      }
    }

    // Lida com cliques do expo-notifications (caso ainda existam antigas)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.doseId) {
        try {
          const { getDoseWithMedicationById } = require('../src/services/medicationService');
          const dose = getDoseWithMedicationById(String(data.doseId));
          const isMetric = dose?.form === 'medicao';
          router.push({
            pathname: isMetric ? '/verification/measurement' : '/verification/camera',
            params: { doseId: String(data.doseId), isAlarm: data.isAlarm ? 'true' : 'false' }
          });
        } catch (e) {
          router.push({
            pathname: '/verification/camera',
            params: { doseId: String(data.doseId), isAlarm: data.isAlarm ? 'true' : 'false' }
          });
        }
      }
    });

    // Lida com cliques e tela cheia do Notifee (Foreground)
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        const data = detail.notification?.data;
        if (data?.doseId) {
          try {
            const { getDoseWithMedicationById } = require('../src/services/medicationService');
            const dose = getDoseWithMedicationById(String(data.doseId));
            const isMetric = dose?.form === 'medicao';
            router.push({
              pathname: isMetric ? '/verification/measurement' : '/verification/camera',
              params: { doseId: String(data.doseId), isAlarm: 'true' }
            });
          } catch (e) {
            router.push({
              pathname: '/verification/camera',
              params: { doseId: String(data.doseId), isAlarm: 'true' }
            });
          }
        }
      }
    });

    // Verifica se o app foi aberto pelo Notifee (Closed/Background state)
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification) {
        const data = initialNotification.notification.data;
        if (data?.doseId) {
          setTimeout(() => {
            try {
              const { getDoseWithMedicationById } = require('../src/services/medicationService');
              const dose = getDoseWithMedicationById(String(data.doseId));
              const isMetric = dose?.form === 'medicao';
              router.push({
                pathname: isMetric ? '/verification/measurement' : '/verification/camera',
                params: { doseId: String(data.doseId), isAlarm: 'true' }
              });
            } catch (e) {
              router.push({
                pathname: '/verification/camera',
                params: { doseId: String(data.doseId), isAlarm: 'true' }
              });
            }
          }, 500); // pequeno atraso para garantir que o root layout montou
        }
      }
    });

    // Cão de Guarda: Verifica se o usuário saiu do app sem verificar a dose
    const appStateSubscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App em background/inactive! Verificando doses atrasadas...');
        try {
          // Import dynamic para evitar ciclos ou inicialização precoce antes do sqlite estar pronto
          const { getOverdueDoses } = require('../src/services/medicationService');
          const { scheduleDoseAlarm } = require('../src/services/notificationService');
          
          const overdueDoses = getOverdueDoses();
          if (overdueDoses.length > 0) {
            console.log(`⚠️ Foram encontradas ${overdueDoses.length} doses atrasadas não validadas! Armando armadilha de 1 minuto...`);
            for (const dose of overdueDoses) {
              await scheduleDoseAlarm(dose.id, dose.medicationName, Date.now() + 60000);
            }
          }
        } catch (e) {
          console.error('Erro no cão de guarda (AppState):', e);
        }
      }
    });

    return () => {
      subscription.remove();
      unsubscribeNotifee();
      appStateSubscription.remove();
    };
  }, [pathname, isLoaded, show, isPremium]);

  return (
    <PaperProvider theme={PaperTheme}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#E53935"
        translucent={false}
      />
      <View style={{ flex: 1, backgroundColor: '#FFF8F8' }}>
        <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF8F8' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="medication/add"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="medication/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="verification/camera"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
      </Stack>
      {!isPremium && <AdBanner />}
      </View>
    </PaperProvider>
  );
}
