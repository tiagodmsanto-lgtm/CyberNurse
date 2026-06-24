import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Alert,
  BackHandler,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import notifee from '@notifee/react-native';
import { getDoseWithMedicationById, verifyDoseInDb } from '../../src/services/medicationService';
import { useDoseStore, useAppStore } from '../../src/stores';
import { logMedicationTaken } from '../../src/services/analytics';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const C = {
  primary: '#E53935',
  primaryLight: '#FF6F61',
  primaryDark: '#B71C1C',
  secondary: '#F48FB1',
  secondaryLight: '#FCE4EC',
  accent: '#3B4CCA',
  background: '#FFF8F8',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  success: '#43A047',
  warning: '#FB8C00',
  error: '#D32F2F',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.7)',
};

type VerificationState = 'camera' | 'analyzing' | 'input' | 'success';

export default function MeasurementVerificationScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { doseId: rawDoseId, isAlarm: rawIsAlarm } = useLocalSearchParams<{ doseId: string, isAlarm: string }>();
  const doseId = Array.isArray(rawDoseId) ? rawDoseId[0] : rawDoseId;
  const isAlarm = Array.isArray(rawIsAlarm) ? rawIsAlarm[0] : rawIsAlarm;
  
  const [state, setState] = useState<VerificationState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [doseData, setDoseData] = useState<any>(null);
  const [measurementValue, setMeasurementValue] = useState('');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const { alarmSound } = useAppStore();
  const soundSource = alarmSound === 'alarm_1' 
    ? require('../../assets/sounds/alarm_1.mp3')
    : require('../../assets/sounds/alarm.ogg');
  const audioPlayer = useAudioPlayer(soundSource);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isAlarm === 'true') {
      if (state !== 'success') {
        if (!hasStartedRef.current) {
          hasStartedRef.current = true;
          
          if (doseId) {
            notifee.cancelNotification(`dose-${doseId}`).catch(console.error);
          }
          
          setAudioModeAsync({ 
            playsInSilentMode: true, 
            shouldPlayInBackground: true,
            interruptionMode: 'mixWithOthers'
          }).catch(console.error);
          
          audioPlayer.loop = true;
          audioPlayer.play();

          timeoutRef.current = setTimeout(() => {
            audioPlayer.pause();
          }, 15384000);
        } else {
          if (!audioPlayer.playing) {
            audioPlayer.play();
          }
        }
      } else {
        audioPlayer.pause();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    } else {
      audioPlayer.pause();
    }
  }, [isAlarm, state, audioPlayer, doseId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const dosesFromStore = useDoseStore(state => state.doses);

  useEffect(() => {
    if (doseId) {
      try {
        let data = getDoseWithMedicationById(doseId);
        if (!data && dosesFromStore && dosesFromStore.length > 0) {
           data = dosesFromStore.find((d: any) => d.id === doseId) || null;
        }
        setDoseData(data);
      } catch (e) {
        console.error('Failed to load dose data:', e);
      }
    }
  }, [doseId, dosesFromStore]);

  useEffect(() => {
    if (isAlarm === 'true') {
      const backAction = () => {
        Alert.alert(
          t('camera.alerts.alarmActiveTitle'),
          t('camera.alerts.alarmActiveMsg'),
          [{ text: t('camera.alerts.understood'), style: 'cancel' }]
        );
        return true; 
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }
  }, [isAlarm, t]);

  React.useEffect(() => {
    if (state === 'camera') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [state]);

  React.useEffect(() => {
    if (state === 'analyzing') {
      const scan = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      scan.start();
      return () => scan.stop();
    }
  }, [state]);

  const handleCapture = useCallback(async () => {
    if (!doseId || !cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      if (!photo || !photo.uri || !photo.base64) throw new Error('No photo taken');
      
      setCapturedImage(photo.uri);
      setState('analyzing');

      const payload = {
        requests: [
          {
            image: { content: photo.base64 },
            features: [{ type: 'TEXT_DETECTION' }]
          }
        ]
      };

      try {
        let apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
        if (__DEV__ && !apiUrl) {
          const hostUri = Constants.expoConfig?.hostUri || Constants.experienceUrl;
          if (hostUri) {
            apiUrl = `http://${hostUri.split(':')[0]}:8081`;
          }
        }
        const url = `${apiUrl}/api/vision`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const texts = data.responses?.[0]?.textAnnotations || [];
          const textoDetectado = texts.length > 0 ? texts[0].description : '';
          
          if (textoDetectado) {
            console.log("IA detectou texto bruto na métrica:", textoDetectado);
            let extractedValue = '';
            
            // Busca padrões numéricos, ex: "120/80", "12.5", "37,5", "98"
            const textMatches = textoDetectado.match(/(\d+[\/\.,]?\d*)/g);
            if (textMatches && textMatches.length > 0) {
              if (doseData?.medicationName === 'Pressão Arterial' && textMatches.length >= 2) {
                  const numbers = textMatches.map((m: string) => parseInt(m)).filter((n: number) => !isNaN(n) && n >= 40 && n <= 250);
                  if (numbers.length >= 2) {
                      extractedValue = `${numbers[0]}/${numbers[1]}`;
                  } else {
                      extractedValue = textMatches[0];
                  }
              } else {
                  extractedValue = textMatches[0];
              }
            }
            
            if (extractedValue) {
              setMeasurementValue(extractedValue);
            }
          }
        }
      } catch (apiErr) {
        console.warn('Vision API error for metric:', apiErr);
      }

      setState('input');
    } catch (e) {
      console.error('Failed to take picture:', e);
      Alert.alert(t('camera.alerts.error'), t('camera.alerts.captureError'));
      setState('camera');
    }
  }, [doseId, doseData, t]);

  const handleSave = useCallback(() => {
    if (!measurementValue.trim()) {
      Alert.alert('Valor Obrigatório', 'Por favor, insira o valor aferido para registrar.');
      return;
    }
    
    if (doseId && capturedImage) {
      try {
        verifyDoseInDb(doseId, capturedImage, 1.0, 'manual', measurementValue.trim());
        useDoseStore.getState().verifyDose(doseId, capturedImage, 1.0, 'manual', measurementValue.trim());
        logMedicationTaken(doseId, true);
        setState('success');
      } catch (e) {
        console.error('Failed verification:', e);
        Alert.alert(t('camera.alerts.error'), t('camera.alerts.registerError'));
        setState('camera');
      }
    }
  }, [doseId, capturedImage, measurementValue, t]);

  const handleSuccess = useCallback(() => {
    router.back();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <MaterialCommunityIcons name="camera-off" size={64} color={C.textSecondary} style={{ marginBottom: 16 }} />
        <Text style={{ color: C.white, fontSize: 18, textAlign: 'center', marginBottom: 24, fontWeight: '600' }}>
          {t('camera.permissionMsg')}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
          <Text style={styles.retryButtonText}>{t('camera.permissionBtn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isAlarm !== 'true' && state !== 'success' && (
        <TouchableOpacity 
          style={[styles.topRightCloseButton, { top: Math.max(insets.top + 16, 16) }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="close" size={28} color={C.white} />
        </TouchableOpacity>
      )}

      <View style={styles.cameraArea}>
        {state !== 'camera' && capturedImage && (
          <>
            <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFillObject} />
            {state === 'analyzing' && (
              <View style={styles.analyzingOverlay}>
                <MaterialCommunityIcons name="line-scan" size={48} color={C.primary} style={{ marginBottom: 16 }} />
                <Text style={styles.analyzingText}>Lendo o visor...</Text>
                <Animated.View 
                  style={[
                    styles.scanLine,
                    {
                      top: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['10%', '90%']
                      })
                    }
                  ]} 
                />
              </View>
            )}
          </>
        )}
        
        {state === 'camera' && (
          <CameraView 
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject} 
            facing="back"
          />
        )}

        {state === 'camera' && (
          <>
            <View style={styles.overlayTextContainer}>
              <Text style={styles.overlayTitle}>
                {doseData ? doseData.medicationName : 'Métrica de Saúde'}
              </Text>
              <Text style={styles.overlaySubtitle}>
                Fotografe o aparelho (ex: monitor de pressão, termômetro) para registrar.
              </Text>
            </View>

            <View style={styles.bottomControls}>
              <Animated.View style={[styles.captureRing, { transform: [{ scale: pulseAnim }] }]}>
                <TouchableOpacity 
                  style={styles.captureButton}
                  onPress={handleCapture}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="camera" size={32} color={C.primary} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </>
        )}

        {state === 'input' && (
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputOverlay}
          >
            <View style={styles.inputCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="heart-pulse" size={32} color={C.primary} />
              </View>
              <Text style={styles.inputCardTitle}>Registro de Métrica</Text>
              <Text style={styles.inputCardSubtitle}>
                Qual o valor medido no aparelho de {doseData ? doseData.medicationName : 'saúde'}?
              </Text>
              
              <View style={styles.textInputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder={`Ex: 120/80`}
                  placeholderTextColor={C.textSecondary}
                  value={measurementValue}
                  onChangeText={setMeasurementValue}
                  keyboardType="default"
                  autoFocus
                />
                {doseData?.dosage && doseData.dosage !== 'N/A' && (
                  <Text style={styles.unitText}>{doseData.dosage}</Text>
                )}
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => {
                    setCapturedImage(null);
                    setState('camera');
                  }}
                >
                  <Text style={styles.retakeButtonText}>Tirar Novamente</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}

        {state === 'success' && (
          <View style={styles.successOverlay}>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={80} color={C.success} />
            </View>
            <Text style={styles.successTitle}>Registro Salvo!</Text>
            <Text style={styles.successText}>
              Sua medição de {doseData?.medicationName} foi armazenada com sucesso no protocolo.
            </Text>
            <TouchableOpacity style={styles.successButton} onPress={handleSuccess}>
              <Text style={styles.successButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.black },
  topRightCloseButton: {
    position: 'absolute',
    right: 16,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraArea: { flex: 1, overflow: 'hidden', borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#000' },
  overlayTextContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  overlayTitle: { color: C.white, fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  overlaySubtitle: { color: C.white, fontSize: 14, textAlign: 'center', opacity: 0.9 },
  bottomControls: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
  captureRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: C.white, fontSize: 16, fontWeight: 'bold' },
  inputOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inputCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: C.textPrimary,
    marginBottom: 8,
  },
  inputCardSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FAFAFA',
  },
  textInput: {
    flex: 1,
    height: 56,
    fontSize: 18,
    color: C.textPrimary,
  },
  unitText: {
    fontSize: 16,
    color: C.textSecondary,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary,
    marginRight: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: C.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: C.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: C.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successIconContainer: { marginBottom: 24 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: C.white, marginBottom: 12 },
  successText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  successButton: { backgroundColor: C.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  successButtonText: { color: C.white, fontSize: 18, fontWeight: 'bold' },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: C.white,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
});
