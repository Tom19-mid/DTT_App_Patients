import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

const AppointmentDetailScreen = ({ route, navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { isHistory, appointment } = route.params || {};

  // Provide fallback values if accessed without params (e.g. from HomeScreen upcoming list)
  const safeApp = appointment || {
    specialtyKey: 'general_internal',
    doctor: `Bác sĩ Nguyễn Văn A`,
    dateString: '2026-07-26',
    time: '9:30 - 10:30',
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#1F2937' }]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('appointment_detail')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Status Header */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadgeIcon}>
            <Ionicons 
              name={isHistory ? "checkmark-done-circle" : "checkmark-circle"} 
              size={48} 
              color={isHistory ? COLORS.primary : "#22C55E"} 
            />
          </View>
          <Text style={[styles.statusTitle, isHistory && { color: isDarkMode ? '#60A5FA' : COLORS.primary }, !isHistory && isDarkMode && { color: '#34D399' }]}>
            {isHistory ? t('completed') : t('confirmed')}
          </Text>
          <Text style={[styles.statusSubtitle, isDarkMode && { color: '#9CA3AF' }]}>
            {isHistory 
              ? t('thank_you_service') 
              : "Vui lòng đến trước 15 phút để làm thủ tục"}
          </Text>
        </View>

        {/* QR Code Section */}
        <View style={[styles.card, SHADOWS.card, { alignItems: 'center' }, isDarkMode && { backgroundColor: '#374151' }]}>
          <Text style={[styles.qrTitle, isDarkMode && { color: '#9CA3AF' }]}>{t('reception_code')}</Text>
          {/* Mock QR Code */}
          <View style={[styles.qrCodePlaceholder, isDarkMode && { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="qr-code-outline" size={120} color={COLORS.text} />
          </View>
          <Text style={[styles.qrCodeText, isDarkMode && { color: '#F3F4F6' }]}>DTT-20260726-001</Text>
        </View>

        {/* Appointment Info */}
        <Text style={[styles.sectionTitle, isDarkMode && { color: '#9CA3AF' }]}>{t('appointment_info_title')}</Text>
        <View style={[styles.card, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('specialty')}</Text>
            <Text style={[styles.infoValueBold, isDarkMode && { color: '#60A5FA' }]}>{t(safeApp.specialtyKey)}</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('dr_label')}</Text>
            <Text style={[styles.infoValue, isDarkMode && { color: '#F3F4F6' }]}>{safeApp.doctor.replace('Bác sĩ', t('dr'))}</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('exam_date')}</Text>
            <Text style={[styles.infoValue, isDarkMode && { color: '#F3F4F6' }]}>{safeApp.dateString}</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('expected_time')}</Text>
            <Text style={[styles.infoValueHighlight, isDarkMode && { color: '#F87171' }]}>{safeApp.time}</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('clinic_room')}</Text>
            <Text style={[styles.infoValue, isDarkMode && { color: '#F3F4F6' }]}>{t('room_102')}</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('expected_fee')}</Text>
            <Text style={[styles.infoValueHighlight, isDarkMode && { color: '#F87171' }]}>150.000 VNĐ</Text>
          </View>
        </View>

        {/* Patient Info */}
        <Text style={[styles.sectionTitle, isDarkMode && { color: '#9CA3AF' }]}>{t('patient_info') || 'Thông tin bệnh nhân'}</Text>
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Họ và tên</Text>
            <Text style={styles.infoValueBold}>Nguyễn Văn Bệnh Nhân</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>0909123456</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã hồ sơ (BHYT)</Text>
            <Text style={styles.infoValue}>SV123456789</Text>
          </View>
        </View>

        {/* Actions */}
        {isHistory ? (
          <>
            <Text style={styles.sectionTitle}>Kết quả khám bệnh</Text>
            <View style={[styles.card, SHADOWS.card, { paddingVertical: 12 }]}>
              <TouchableOpacity 
                style={styles.resultRow} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MedicalRecords', { initialTab: 'phieu-kham' })}
              >
                <View style={[styles.resultIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="document-text" size={24} color="#16A34A" />
                </View>
                <Text style={styles.resultText}>Phiếu khám bệnh</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.placeholder} />
              </TouchableOpacity>
              <View style={styles.divider} />
              
              <TouchableOpacity 
                style={styles.resultRow} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MedicalRecords', { initialTab: 'toa-thuoc' })}
              >
                <View style={[styles.resultIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="medkit" size={24} color="#2563EB" />
                </View>
                <Text style={styles.resultText}>Toa thuốc</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.placeholder} />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.resultRow} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MedicalRecords', { initialTab: 'xet-nghiem' })}
              >
                <View style={[styles.resultIcon, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="flask" size={24} color="#DC2626" />
                </View>
                <Text style={styles.resultText}>Kết quả Xét nghiệm</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.placeholder} />
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.resultRow} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('MedicalRecords', { initialTab: 'sieu-am' })}
              >
                <View style={[styles.resultIcon, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="scan" size={24} color="#D97706" />
                </View>
                <Text style={styles.resultText}>Kết quả Siêu âm</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.placeholder} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.cancelBtnText}>Hủy lịch</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.navBtn]} activeOpacity={0.8}>
              <Ionicons name="map-outline" size={20} color="#fff" />
              <Text style={styles.navBtnText}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  container: {
    padding: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  statusBadgeIcon: {
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: COLORS.placeholder,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 14,
    color: COLORS.placeholder,
    fontWeight: '600',
    marginBottom: 16,
  },
  qrCodePlaceholder: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  qrCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.placeholder,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  infoValueBold: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  infoValueHighlight: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  navBtn: {
    backgroundColor: COLORS.primary,
  },
  navBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resultText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export default AppointmentDetailScreen;
