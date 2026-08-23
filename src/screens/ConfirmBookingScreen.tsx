import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { apiAppointment, apiHealthPackage } from '../services/apiService';
import { useCustomAlert } from '../context/AlertContext';

const ConfirmBookingScreen = ({ route, navigation }: any) => {
  const { type = 'doctor', doctorName, specialty, specialtyName, date, time, timeSlot, packageName, price, fee, doctorId, specialtyId, packageId } = route.params || {};
  const finalSpecialty = specialty || specialtyName || 'Nội tổng quát';
  const finalTime = time || timeSlot || '08:30 - 09:30';
  const finalPrice = price || fee || '250.000đ';

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const { addRecentService, currentUser } = useAuth();
  const { showAlert } = useCustomAlert();

  const handleConfirm = async () => {
    // type === 'doctor' phải có doctorId thật — trước đây fallback `doctorId || 1` âm thầm đặt lịch
    // với Bác sĩ #1 bất kể bệnh nhân chọn ai, nếu màn trước đó (vd: "Đã dùng gần đây") lỡ không
    // truyền doctorId qua route params.
    if (type === 'doctor' && !doctorId) {
      showAlert({
        title: 'Thiếu thông tin bác sĩ',
        message: 'Không xác định được bác sĩ cần đặt lịch. Vui lòng quay lại và chọn bác sĩ/khung giờ lại.',
        type: 'error',
      });
      return;
    }
    if (!date) {
      showAlert({
        title: 'Thiếu ngày khám',
        message: 'Không xác định được ngày khám. Vui lòng quay lại và chọn lại khung giờ.',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Connect to Backend ASP.NET Core API -> PostgreSQL Server
      let res: any;
      if (type === 'package' && packageId) {
        res = await apiHealthPackage.bookPackage(packageId, {
          patientId: currentUser?.patientId,
          patientName: currentUser?.fullName || 'Bệnh nhân',
          priceFormatted: finalPrice,
        });
      } else {
        res = await apiAppointment.createAppointment({
          patientId: currentUser?.patientId,
          doctorId,
          doctorName: doctorName || 'BS. CK1 Nguyễn Văn A',
          specialtyName: finalSpecialty,
          date,
          timeSlot: finalTime,
          fee: finalPrice
        });
      }

      setBookingResult(res);

      // Record into dynamic Recent Services
      if (type === 'doctor') {
        addRecentService({
          name: doctorName || 'Bác sĩ chuyên khoa',
          detail: specialty || 'Nội tổng quát',
          icon: 'user-md',
          type: 'doctor',
          doctorName,
          specialtyName: specialty,
          doctorId,
          specialtyId,
        });
      } else {
        addRecentService({
          name: packageName || 'Gói khám sức khỏe',
          detail: price || 'DTT Healthcare',
          icon: 'medkit',
          type: 'package',
        });
      }

      setSuccessModalVisible(true);
    } catch (error: any) {
      console.log('Error creating appointment:', error);
      // KHÔNG được hiện modal "Đặt lịch thành công" giả khi request thực sự thất bại (vd: lỗi mạng,
      // 403 do phiên đăng nhập có vấn đề) — trước đây luôn hiện thành công với queueNumber giả, khiến
      // bệnh nhân tưởng đã có lịch hẹn trong khi thực tế chưa được đặt.
      showAlert({
        title: 'Đặt lịch thất bại',
        message: error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    navigation.navigate('MainTabs', { screen: 'Calendar' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận thông tin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Thông tin {type === 'package' ? 'Gói khám' : 'Lịch khám'}</Text>
        
        <View style={[styles.card, SHADOWS.card]}>
          {type === 'doctor' ? (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}><Text style={styles.label}>Bác sĩ: </Text>{doctorName || 'BS. CK1 Nguyễn Văn A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="medkit-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}><Text style={styles.label}>Chuyên khoa: </Text>{finalSpecialty}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}><Text style={styles.label}>Ngày khám: </Text>{date || '25/07/2026'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}><Text style={styles.label}>Khung giờ: </Text>{finalTime}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Ionicons name="medkit-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}><Text style={styles.label}>Tên gói khám: </Text>{packageName}</Text>
              </View>
            </>
          )}
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Phí khám (Dự kiến)</Text>
            <Text style={styles.priceValue}>{finalPrice}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]} 
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>Xác nhận Đặt lịch</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleSuccessClose}>
          <View style={[styles.modalBox, SHADOWS.card]} onStartShouldSetResponder={() => true}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle-sharp" size={60} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>Đặt lịch thành công!</Text>
            <Text style={styles.modalMessage}>
              Lịch khám của bạn đã được ghi nhận trên hệ thống DTT Healthcare. Mã số thứ tự của bạn là <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>#{bookingResult?.queueNumber || 1}</Text>.
            </Text>

            <TouchableOpacity style={styles.modalBtn} onPress={handleSuccessClose}>
              <Text style={styles.modalBtnText}>Xem lịch khám của tôi</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontWeight: '600',
    color: COLORS.subtext,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  successIconBox: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ConfirmBookingScreen;
