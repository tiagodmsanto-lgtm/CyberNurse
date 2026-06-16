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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getDoseWithMedicationById, verifyDoseInDb } from '../../src/services/medicationService';
import { useDoseStore } from '../../src/stores';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colors inline to avoid import path issues
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

type VerificationState = 'camera' | 'analyzing' | 'success' | 'failed';

export default function CameraVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { doseId } = useLocalSearchParams<{ doseId: string }>();
  const [state, setState] = useState<VerificationState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [doseData, setDoseData] = useState<any>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (doseId) {
      try {
        const data = getDoseWithMedicationById(doseId);
        setDoseData(data);
      } catch (e) {
        console.error('Failed to load dose data for camera verification:', e);
      }
    }
  }, [doseId]);

  // Start pulse animation for the camera button
  React.useEffect(() => {
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
  }, []);

  // Scan line animation during analysis
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

  const handleCapture = useCallback(() => {
    if (!doseId) return;

    // Simulate photo capture
    setCapturedImage('captured');
    setState('analyzing');

    // Simulate AI analysis (2.5 seconds)
    setTimeout(() => {
      // 70% success rate
      const isSuccess = Math.random() > 0.3;
      if (isSuccess) {
        try {
          verifyDoseInDb(doseId, 'file://simulated_captured_photo.jpg', 0.94, 'ai');
          useDoseStore.getState().verifyDose(doseId, 'file://simulated_captured_photo.jpg', 0.94, 'ai');
          setState('success');
        } catch (e) {
          console.error('Failed to update dose in database:', e);
          Alert.alert('Erro', 'Não foi possível registrar a dose.');
          setState('camera');
        }
      } else {
        setState('failed');
        setAttempts(prev => prev + 1);
      }
    }, 2500);
  }, [doseId]);

  const handleRetry = useCallback(() => {
    if (attempts >= 3) {
      Alert.alert(
        'Verificação Manual',
        'Após 3 tentativas sem sucesso, você pode confirmar manualmente. Essa informação será registrada no histórico.',
        [
          {
            text: 'Confirmar Manualmente',
            onPress: () => {
              if (doseId) {
                try {
                  verifyDoseInDb(doseId, 'file://manual_confirmation.jpg', 1.0, 'manual');
                  useDoseStore.getState().verifyDose(doseId, 'file://manual_confirmation.jpg', 1.0, 'manual');
                } catch (e) {
                  console.error('Failed manual verification:', e);
                }
              }
              router.back();
            },
          },
          {
            text: 'Tentar Novamente',
            onPress: () => {
              setCapturedImage(null);
              setState('camera');
            },
          },
        ]
      );
    } else {
      setCapturedImage(null);
      setState('camera');
    }
  }, [attempts, doseId]);

  const handleSuccess = useCallback(() => {
    router.back();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Camera Preview Area */}
      <View style={styles.cameraArea}>
        {state === 'camera' && (
          <>
            {/* Simulated camera view */}
            <View style={styles.cameraPreview}>
              <MaterialCommunityIcons
                name="camera"
                size={80}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.cameraPlaceholder}>
                Câmera será ativada aqui
              </Text>
            </View>

            {/* Camera overlay frame */}
            <View style={styles.cameraOverlay}>
              <View style={styles.frameCornerTL} />
              <View style={styles.frameCornerTR} />
              <View style={styles.frameCornerBL} />
              <View style={styles.frameCornerBR} />
            </View>

            {/* Guide text */}
            <View style={styles.guideContainer}>
              <View style={styles.guideBadge}>
                <MaterialCommunityIcons
                  name="hand-pointing-right"
                  size={18}
                  color={C.white}
                />
                <Text style={styles.guideText}>
                  Mostre o medicamento na sua mão
                </Text>
              </View>
            </View>
          </>
        )}

        {state === 'analyzing' && (
          <View style={styles.analyzingContainer}>
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, SCREEN_HEIGHT * 0.4],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.analyzingContent}>
              <MaterialCommunityIcons
                name="brain"
                size={48}
                color={C.accent}
              />
              <Text style={styles.analyzingTitle}>Analisando foto...</Text>
              <Text style={styles.analyzingSubtitle}>
                A IA está verificando se você está tomando sua medicação
              </Text>
            </View>
          </View>
        )}

        {state === 'success' && (
          <View style={styles.resultContainer}>
            <View style={styles.successCircle}>
              <MaterialCommunityIcons
                name="check"
                size={64}
                color={C.white}
              />
            </View>
            <Text style={styles.successTitle}>Verificado! ✨</Text>
            <Text style={styles.successSubtitle}>
              Medicação confirmada com sucesso
            </Text>
          </View>
        )}

        {state === 'failed' && (
          <View style={styles.resultContainer}>
            <View style={styles.failedCircle}>
              <MaterialCommunityIcons
                name="close"
                size={64}
                color={C.white}
              />
            </View>
            <Text style={styles.failedTitle}>Não verificado</Text>
            <Text style={styles.failedSubtitle}>
              Não foi possível confirmar a medicação na foto.{'\n'}
              Tentativa {attempts} de 3
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        {state === 'camera' && (
          <>
            {/* Info bar */}
            <View style={styles.medicationInfo}>
              <MaterialCommunityIcons name="pill" size={20} color={C.primary} />
              <Text style={styles.medicationInfoText}>
                {doseData 
                  ? `${doseData.medicationName} ${doseData.dosage} • ${new Date(doseData.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` 
                  : 'Medicamento'}
              </Text>
            </View>

            {/* Capture button */}
            <View style={styles.captureRow}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  Alert.alert(
                    '⚠️ Alarme Ativo',
                    'O alarme só pode ser desativado tirando uma foto da sua medicação. Não é possível fechar esta tela.',
                    [{ text: 'Entendi', style: 'cancel' }]
                  );
                }}
              >
                <MaterialCommunityIcons
                  name="lock"
                  size={24}
                  color={C.textSecondary}
                />
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={handleCapture}
                  activeOpacity={0.8}
                >
                  <View style={styles.captureButtonInner}>
                    <MaterialCommunityIcons
                      name="camera"
                      size={32}
                      color={C.white}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity style={styles.flashButton}>
                <MaterialCommunityIcons
                  name="flash-off"
                  size={24}
                  color={C.white}
                />
              </TouchableOpacity>
            </View>

            {/* Warning text */}
            <View style={styles.warningBar}>
              <MaterialCommunityIcons
                name="shield-lock"
                size={16}
                color={C.primary}
              />
              <Text style={styles.warningText}>
                📸 Tire a foto para desativar o alarme
              </Text>
            </View>
          </>
        )}

        {state === 'success' && (
          <TouchableOpacity
            style={styles.successButton}
            onPress={handleSuccess}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={C.white}
            />
            <Text style={styles.successButtonText}>
              Alarme Desativado — Voltar
            </Text>
          </TouchableOpacity>
        )}

        {state === 'failed' && (
          <View style={styles.failedActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="camera-retake"
                size={24}
                color={C.white}
              />
              <Text style={styles.retryButtonText}>
                Tirar Nova Foto
              </Text>
            </TouchableOpacity>
            <Text style={styles.attemptsText}>
              {3 - attempts} tentativa(s) restante(s)
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const FRAME_SIZE = SCREEN_WIDTH * 0.7;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Camera Area
  cameraArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 8,
  },

  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameCornerTL: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: (SCREEN_WIDTH - FRAME_SIZE) / 2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: C.primary,
    borderTopLeftRadius: 8,
  },
  frameCornerTR: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    right: (SCREEN_WIDTH - FRAME_SIZE) / 2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: C.primary,
    borderTopRightRadius: 8,
  },
  frameCornerBL: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.25,
    left: (SCREEN_WIDTH - FRAME_SIZE) / 2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: C.primary,
    borderBottomLeftRadius: 8,
  },
  frameCornerBR: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.25,
    right: (SCREEN_WIDTH - FRAME_SIZE) / 2,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: C.primary,
    borderBottomRightRadius: 8,
  },

  // Guide
  guideContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.12,
    alignSelf: 'center',
  },
  guideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229,57,53,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  guideText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Analyzing
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
  },
  scanLine: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    width: '80%',
    height: 3,
    backgroundColor: C.accent,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  analyzingContent: {
    alignItems: 'center',
  },
  analyzingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.white,
    marginTop: 16,
  },
  analyzingSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },

  // Success
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a1a',
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: C.success,
    marginTop: 24,
  },
  successSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },

  // Failed
  failedCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: C.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: C.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  failedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: C.error,
    marginTop: 24,
  },
  failedSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Controls
  controls: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,57,53,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  medicationInfoText: {
    color: C.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  warningText: {
    color: C.primaryLight,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },

  // Success button
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.success,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: C.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successButtonText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Failed actions
  failedActions: {
    alignItems: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
  },
  attemptsText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 12,
  },
});
