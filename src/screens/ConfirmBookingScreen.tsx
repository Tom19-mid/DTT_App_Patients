import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const ConfirmBookingScreen = ({ route, navigation }: any) => {
  const { type, doctorName, specialty, date, time, packageName, price } = route.params || {};
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const { addRecentService } = useAuth();

  const handleConfirm = () => {
    // Record into dynamic Recent Services
    if (type === 'doctor') {
      addRecentService({
        name: doctorName || 'Bác sĩ chuyên khoa',
        detail: specialty || 'Nội tổng quát',
        icon: 'user-md',
        type: 'doctor',
        doctorName,
        specialtyName: specialty,
      });
    } else {
      addRecentService({
        name: packageName || 'Gói khám sức khỏe',
        detail: price || 'DTT Healthcare',
        icon: 'medkit',
        type: 'package',
      });
    }

    // Show success modal
    setSuccessModalVisible(true);
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
    // Navigate to Appointment Detail or Home
    navigation.navigate('MainTabs', { screen: 'Lịch khám' });
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
                <Text style={styles.infoText}><Text style={styles.label}>Bác sĩ: </Text>{doctorName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="medkit-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}><Text style={styles.label}>Chuyên khoa: </Text>{specialty}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}><Text style={styles.label}>Ngày khám: </Text>{date}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}><Text style={styles.label}>Khung giờ: </Text>{time}</Text>
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
            <Text style={styles.priceValue}>{price}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Thông tin Bệnh nhân</Text>
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.infoRow}>
            <Text style={styles.patientLabel}>Họ và tên:</Text>
            <Text style={styles.patientValue}>Nguyễn Văn Bệnh Nhân</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.patientLabel}>Số điện thoại:</Text>
            <Text style={styles.patientValue}>0901234567</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.patientLabel}>Ngày sinh:</Text>
            <Text style={styles.patientValue}>15/08/1990</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.patientLabel}>Giới tính:</Text>
            <Text style={styles.patientValue}>Nam</Text>
          </View>
          <Text style={styles.editInfoText}>Chỉnh sửa thông tin hồ sơ</Text>
        </View>

      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, SHADOWS.card]}>
        <View>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalPrice}>{price}</Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Xác nhận đặt lịch</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, SHADOWS.card]}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
            </View>
            <Text style={styles.successTitle}>Đặt lịch thành công!</Text>
            <Text style={styles.successSubtitle}>
              Lịch khám của bạn đã được ghi nhận. Vui lòng có mặt trước 15 phút để làm thủ tục.
            </Text>
            
            <TouchableOpacity style={styles.successBtn} onPress={handleSuccessClose}>
              <Text style={styles.successBtnText}>Xem lịch khám</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  
  container: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, marginTop: 10 },
  
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  infoText: { flex: 1, fontSize: 15, color: COLORS.text, lineHeight: 22 },
  label: { fontWeight: '600', color: COLORS.text },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  priceValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },

  patientLabel: { width: 100, fontSize: 14, color: COLORS.placeholder },
  patientValue: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  editInfoText: { color: COLORS.primary, fontWeight: '600', fontSize: 14, marginTop: 10, alignSelf: 'flex-end' },

  bottomAction: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 30, // iPhone home indicator
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  totalLabel: { fontSize: 12, color: COLORS.placeholder, marginBottom: 2 },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  confirmBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 25,
  },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  successModal: {
    width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center',
  },
  successIconBox: { marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: COLORS.placeholder, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successBtn: {
    width: '100%', backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 25, alignItems: 'center',
  },
  successBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});

export default ConfirmBookingScreen;
