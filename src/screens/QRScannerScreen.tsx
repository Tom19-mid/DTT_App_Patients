import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Vibration, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

/**
 * QRScannerScreen — Quét mã QR từ thẻ/biên lai bệnh nhân để liên kết hồ sơ.
 *
 * QR Code chuẩn từ bệnh viện sẽ có định dạng:
 *   DTT-PATIENT:{patient_id}:{verify_code}
 * Ví dụ: DTT-PATIENT:12345:ABCXYZ
 *
 * Sau khi quét thành công → gọi API backend để liên kết hồ sơ.
 * (Hiện tại dùng MOCK, sau thay bằng API thật)
 */
const QRScannerScreen = ({ navigation, route }: any) => {
  const { isDarkMode } = useSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the scan frame
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Request camera permission ──────────────────────────────────────────
  if (!permission) return <View style={styles.centerBox} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#111827' }]}>
        <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>Quét mã QR</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={64} color={COLORS.placeholder} />
          <Text style={[styles.permTitle, isDarkMode && { color: '#F3F4F6' }]}>
            Cần quyền truy cập Camera
          </Text>
          <Text style={[styles.permDesc, isDarkMode && { color: '#9CA3AF' }]}>
            Ứng dụng cần quyền Camera để quét mã QR trên thẻ bệnh nhân / biên lai của bạn.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Cấp quyền Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Handle QR scan result ──────────────────────────────────────────────
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    Vibration.vibrate(150);

    // Validate QR format: DTT-PATIENT:{patient_id}:{verify_code}
    const parts = data.split(':');
    if (parts.length !== 3 || parts[0] !== 'DTT-PATIENT') {
      Alert.alert(
        'Mã QR không hợp lệ',
        'Vui lòng quét mã QR trên thẻ bệnh nhân hoặc biên lai do bệnh viện DTT Healthcare cấp.',
        [{ text: 'Thử lại', onPress: () => { setScanned(false); setProcessing(false); } }]
      );
      return;
    }

    const patientId = parts[1];
    const verifyCode = parts[2];

    // ── MOCK: Simulate API call to link profile ──────────────────────────
    // TODO: Replace with real API call:
    //   const res = await axios.post('/api/patients/link-by-qr', { patientId, verifyCode });
    //   if (res.data.success) { ... }

    setTimeout(() => {
      setProcessing(false);
      Alert.alert(
        '✅ Liên kết thành công!',
        `Hồ sơ bệnh nhân #${patientId} đã được liên kết với tài khoản của bạn. Toàn bộ lịch sử y tế sẽ được đồng bộ vào ứng dụng.`,
        [
          {
            text: 'Xem hồ sơ',
            onPress: () => navigation.replace('PatientProfiles'),
          },
        ]
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Camera full screen */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backCircle} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Quét mã QR hồ sơ</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        {/* Instruction */}
        <Text style={styles.instrText}>
          Hướng camera vào mã QR{'\n'}trên thẻ bệnh nhân hoặc biên lai
        </Text>

        {/* Scan frame */}
        <Animated.View style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}>
          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {processing && (
            <View style={styles.processingBox}>
              <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
              <Text style={styles.processingText}>Đang xử lý...</Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom instructions */}
        <View style={styles.bottomBox}>
          <View style={styles.tipRow}>
            <Ionicons name="information-circle-outline" size={18} color="#fff" />
            <Text style={styles.tipText}>
              Mã QR được in trên thẻ bệnh nhân hoặc biên lai khám tại bệnh viện DTT Healthcare
            </Text>
          </View>

          {scanned && !processing && (
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => { setScanned(false); setProcessing(false); }}
            >
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.rescanText}>Quét lại</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const FRAME = 240;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1, backgroundColor: '#000' },
  centerBox: { flex: 1 },

  // Permission
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  permissionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20, marginBottom: 12, textAlign: 'center' },
  permDesc: { fontSize: 14, color: COLORS.placeholder, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  permBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', paddingHorizontal: 16, paddingVertical: 12,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

  instrText: {
    color: '#fff', fontSize: 15, textAlign: 'center',
    marginTop: 24, marginBottom: 32, lineHeight: 24, opacity: 0.9,
  },

  // Scan frame
  scanFrame: {
    width: FRAME, height: FRAME,
    justifyContent: 'center', alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: '#fff',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 6 },

  processingBox: { alignItems: 'center' },
  processingText: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 },

  // Bottom
  bottomBox: { position: 'absolute', bottom: 60, left: 24, right: 24, alignItems: 'center' },
  tipRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  tipText: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 20 },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25,
  },
  rescanText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
});

export default QRScannerScreen;
