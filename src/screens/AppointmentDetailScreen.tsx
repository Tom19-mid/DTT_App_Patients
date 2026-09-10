import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Linking, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { apiAppointment } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';

const AppointmentDetailScreen = ({ route, navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { currentUser } = useAuth();
  const { showAlert } = useCustomAlert();
  const { isHistory, appointment } = route.params || {};
  const [cancelling, setCancelling] = useState(false);

  // Provide fallback values if accessed without params (e.g. from HomeScreen upcoming list)
  const safeApp = appointment || {
    id: 1,
    specialtyKey: 'general_internal',
    doctor: `Không xác định`,
    dateString: '2026-07-26',
    time: '9:30 - 10:30',
    clinicRoom: 'Phòng 102',
    fee: '250.000đ',
  };

  // Trước đây còn đoán qua specialtyKey.includes('Tầm soát'/'Khám Tổng Quát') — 1 lịch khám bác sĩ
  // THƯỜNG mà tên chuyên khoa/lý do khám tình cờ chứa các cụm này sẽ hiện NHẦM thành gói khám. Chỉ
  // dựa vào cờ isPackage thật (nếu có) hoặc doctor === '' — quy ước THẬT do backend đặt khi đây đúng
  // là gói khám (AppointmentsController.cs chỉ để trống tên bác sĩ trong trường hợp đó).
  const isPkg = safeApp.isPackage || safeApp.doctor === '' || false;
  const isInProgress = safeApp.status === 'InProgress' || safeApp.statusKey === 'in_progress' || safeApp.statusId === 3;
  const isCheckedIn = safeApp.status === 'CheckedIn' || safeApp.statusKey === 'checked_in' || safeApp.statusId === 7;
  const isWaitingForDoctor = safeApp.status === 'WaitingForDoctor' || safeApp.statusKey === 'waiting_for_doctor' || safeApp.statusId === 8;
  // Bác sĩ đã chỉ định Xét nghiệm/Siêu âm — bệnh nhân đang ở phòng Cận Lâm Sàng, chưa quay lại phòng khám
  const isAwaitingResults = safeApp.status === 'AwaitingTestResults' || safeApp.statusKey === 'awaiting_test_results' || safeApp.statusId === 9;
  // Bệnh nhân đang chờ nhận thuốc tại quầy Dược
  const isPendingDispensing = safeApp.status === 'PendingDispensing' || safeApp.statusKey === 'pending_dispensing' || safeApp.statusId === 10;
  // Trước đây màn này không check Cancelled, nên lịch đã hủy mở từ lịch sử luôn hiện "Hoàn thành"
  // giống lịch khám bình thường (CalendarScreen ở danh sách thì map đúng, chỉ màn chi tiết bị bỏ sót).
  const isCancelled = safeApp.status === 'Cancelled' || safeApp.status === 'cancelled' || safeApp.statusKey === 'cancelled' || safeApp.statusId === 5;
  const isNoShow = safeApp.status === 'NoShow' || safeApp.status === 'noshow' || safeApp.statusKey === 'noshow' || safeApp.statusId === 6;

  const handleCancel = () => {
    showAlert({
      title: '🗓️ Xác nhận hủy lịch khám',
      message: `Bạn sắp hủy lịch khám:\n\n🏥 Chuyên khoa: ${safeApp.specialtyKey || '—'}\n⏰ Thời gian: ${safeApp.time || '—'}\n\nThao tác này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?`,
      type: 'danger',
      showCancel: true,
      confirmText: 'Hủy lịch',
      cancelText: 'Giữ lịch',
      onConfirm: async () => {
        try {
          setCancelling(true);
          const cancelledByInfo = currentUser?.phone
            ? `${currentUser.fullName} (${currentUser.phone})`
            : 'patient';
          await apiAppointment.cancelAppointment(
            safeApp.id,
            cancelledByInfo,
            'Bệnh nhân hủy lịch qua ứng dụng'
          );
          showAlert({
            title: 'Hủy lịch thành công',
            message: 'Lịch khám của bạn đã được hủy thành công.\n\nBạn có thể đặt lại lịch bất kỳ lúc nào trên ứng dụng.',
            type: 'success',
            confirmText: 'Về trang lịch khám',
            onConfirm: () => navigation.goBack(),
          });
        } catch (error) {
          showAlert({
            title: '⚠️ Thông báo',
            message: 'Đã ghi nhận yêu cầu hủy lịch khám của bạn. Vui lòng kiểm tra lại trạng thái lịch.',
            type: 'warning',
            confirmText: 'Về trang lịch khám',
            onConfirm: () => navigation.goBack(),
          });
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  const handleDirections = () => {
    const address = encodeURIComponent('458/3F Nguyễn Hữu Thọ, Tân Hưng, Quận 7, Hồ Chí Minh');
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    const appleUrl = `http://maps.apple.com/?daddr=${address}`;
    const url = Platform.OS === 'ios' ? appleUrl : googleUrl;

    Linking.openURL(url).catch(() => {
      Linking.openURL(googleUrl).catch(() => {
        showAlert({
          title: '🗺️ Không mở được bản đồ',
          message: 'Thiết bị của bạn chưa cài ứng dụng bản đồ hoặc không hỗ trợ tính năng chỉ đường. Vui lòng thử lại sau.',
          type: 'error',
          confirmText: 'Đã hiểu',
        });
      });
    });
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
              name={
                isCancelled ? "close-circle" :
                isNoShow ? "alert-circle" :
                isAwaitingResults ? "flask" :
                isPendingDispensing ? "medkit" :
                isInProgress ? "pulse" :
                isWaitingForDoctor ? "fitness" :
                isCheckedIn ? "checkmark-circle" :
                isHistory ? "checkmark-done-circle" : "checkmark-circle"
              }
              size={48}
              color={
                isCancelled ? "#EF4444" :
                isNoShow ? "#F97316" :
                isAwaitingResults ? "#7C3AED" :
                isPendingDispensing ? "#F59E0B" :
                isInProgress ? "#6366F1" :
                isWaitingForDoctor ? "#8B5CF6" :
                isCheckedIn ? "#10B981" :
                isHistory ? COLORS.primary : "#22C55E"
              }
            />
          </View>
          <Text style={[
            styles.statusTitle,
            isCancelled && { color: "#EF4444" },
            isNoShow && { color: "#F97316" },
            isAwaitingResults && { color: "#7C3AED" },
            isPendingDispensing && { color: "#F59E0B" },
            isInProgress && { color: "#6366F1" },
            isWaitingForDoctor && { color: "#8B5CF6" },
            isCheckedIn && { color: "#10B981" },
            isHistory && !isCancelled && !isNoShow && !isInProgress && !isWaitingForDoctor && !isCheckedIn && !isAwaitingResults && !isPendingDispensing && { color: isDarkMode ? '#60A5FA' : COLORS.primary },
            !isHistory && !isCancelled && !isNoShow && !isInProgress && !isWaitingForDoctor && !isCheckedIn && !isAwaitingResults && !isPendingDispensing && isDarkMode && { color: '#34D399' }
          ]}>
            {isCancelled ? "Đã hủy lịch khám" :
             isNoShow ? "Không Đến Khám" :
             isAwaitingResults ? "Đang chờ kết quả Xét nghiệm/Siêu âm" :
             isPendingDispensing ? "Đang Chờ Phát Thuốc" :
             isInProgress ? (t('in_progress') !== 'in_progress' ? t('in_progress') : "Đang khám lâm sàng") :
             isWaitingForDoctor ? "Đã đo sinh hiệu — Chờ khám" :
             isCheckedIn ? "Đã Check-in tại quầy Lễ tân" :
             isHistory ? t('completed') : t('confirmed')}
          </Text>
          <Text style={[styles.statusSubtitle, isDarkMode && { color: '#9CA3AF' }]}>
            {isCancelled
              ? "Lịch khám này đã được hủy và không còn hiệu lực. Bạn có thể đặt lại lịch khám mới bất kỳ lúc nào."
              : isNoShow
              ? "Bạn đã không đến khám theo lịch hẹn này. Vui lòng đặt lại lịch khám mới nếu vẫn có nhu cầu khám bệnh."
              : isAwaitingResults
              ? "Bác sĩ đã chỉ định Xét nghiệm/Siêu âm cho bạn. Vui lòng di chuyển đến phòng Cận Lâm Sàng và chờ Kỹ thuật viên gọi tên."
              : isPendingDispensing
              ? "Bác sĩ đã kê đơn thuốc cho bạn. Vui lòng di chuyển đến quầy Dược và chờ Dược sĩ gọi tên để nhận thuốc."
              : isInProgress
              ? "Bác sĩ đang mời bạn vào phòng khám. Vui lòng chuẩn bị và di chuyển ngay!"
              : isWaitingForDoctor
              ? "Bạn đã hoàn tất kiểm tra mạch & huyết áp. Vui lòng chuẩn bị trước cửa phòng khám Bác sĩ!"
              : isCheckedIn
              ? "Thủ tục tiếp đón hoàn tất. Vui lòng ngồi tại khu vực phòng chờ để Điều dưỡng gọi tên đo sinh hiệu."
              : isHistory
              ? t('thank_you_service')
              : "Vui lòng đến trước 15 phút để làm thủ tục tiếp đón tại quầy Lễ tân"}
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
          
          {!isPkg && safeApp.doctor ? (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('dr_label')}</Text>
                <Text style={[styles.infoValue, isDarkMode && { color: '#F3F4F6' }]}>
                  {(() => {
                    const raw = safeApp.doctor || '';
                    // Remove degree prefix to get only the name
                    const nameOnly = raw.replace(/^(?:ThS\.|BS\.|TS\.|GS\.|PGS\.)\s*(?:CKI{1,2}\s*|CKII\s*|BSCK[12]\s*)?/i, '').trim();
                    return nameOnly || raw || '—';
                  })()}
                </Text>
              </View>
              <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />
            </>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('exam_date')}</Text>
            <Text style={[styles.infoValue, isDarkMode && { color: '#F3F4F6' }]}>
              {safeApp.displayDate || (safeApp.dateString && safeApp.dateString.includes('-')
                ? safeApp.dateString.split('-').reverse().join('/')
                : safeApp.dateString)}
            </Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('expected_time')}</Text>
            <Text style={[styles.infoValueHighlight, isDarkMode && { color: '#F87171' }]}>{safeApp.time}</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />

          {/* Trước đây chỉ hiện MỘT LẦN duy nhất trên modal "Đặt lịch thành công" rồi biến mất — không
              xem lại được ở đâu nữa. Hiển thị lại ở đây (backend trả sẵn queueNumber, đã re-đọc từ DB
              sau khi trigger trg_set_queue_number chạy nên luôn khớp với giá trị thật).
              Nhãn "Mã khung giờ" (không phải "Số thứ tự") vì giá trị này thực chất là ID cố định của
              khung giờ 30 phút được đặt (SeedDoctorSchedulesAsync gán cứng 1-8 theo mốc giờ, không đếm
              theo số bệnh nhân trong ngày) — gọi là "số thứ tự" dễ khiến hiểu nhầm là vị trí xếp hàng. */}
          {safeApp.queueNumber ? (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>Mã khung giờ</Text>
                <Text style={[styles.infoValueHighlight, isDarkMode && { color: '#F87171' }]}>{safeApp.queueNumber}</Text>
              </View>
              <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />
            </>
          ) : null}

          {!isPkg && safeApp.clinicRoom ? (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('clinic_room')}</Text>
                <Text style={[styles.infoValue, isDarkMode && { color: '#F3F4F6' }]}>{safeApp.clinicRoom || t('room_102') || 'Phòng 102'}</Text>
              </View>
              <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />
            </>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>{t('expected_fee')}</Text>
            <Text style={[styles.infoValueHighlight, isDarkMode && { color: '#10B981' }]}>{safeApp.fee || '250.000đ'}</Text>
          </View>
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#4B5563' }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>Trạng thái thanh toán</Text>
            {(() => {
              // Đọc đúng invoices.payment_status thật từ backend — trước đây in cứng "Đã thanh toán"
              // bất kể trạng thái thật, khiến bệnh nhân tưởng lễ tân đã xác nhận dù chưa hề thu tiền.
              // Giá trị thật chỉ có 'unpaid' | 'partial' | 'paid' (đúng theo DB constraint
              // chk_payment_status — không có 'pending').
              const ps = safeApp.paymentStatus;
              if (ps === 'paid') {
                return <Text style={[styles.infoValue, { color: '#10B981', fontWeight: 'bold' }]}>🟢 Đã thanh toán tại Quầy Bệnh viện</Text>;
              }
              if (ps === 'partial') {
                return <Text style={[styles.infoValue, { color: '#F59E0B', fontWeight: 'bold' }]}>🟡 Đã thanh toán một phần</Text>;
              }
              return <Text style={[styles.infoValue, { color: '#EF4444', fontWeight: 'bold' }]}>🔴 Chưa thanh toán</Text>;
            })()}
          </View>
        </View>

        {/* Patient Info */}
        <Text style={[styles.sectionTitle, isDarkMode && { color: '#9CA3AF' }]}>Thông tin bệnh nhân</Text>
        <View style={[styles.card, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && { color: '#9CA3AF' }]}>Họ và tên</Text>
            {/* Lịch hẹn đặt cho người thân (safeApp.memberId khác null) phải hiện đúng tên người thân đó
                (backend đã trả sẵn ở safeApp.patientName) — trước đây luôn hiện currentUser.fullName
                (chủ tài khoản) bất kể lịch hẹn này thực chất đặt cho ai. */}
            <Text style={[styles.infoValue, isDarkMode && { color: '#F3F4F6' }]}>{safeApp.patientName || currentUser?.fullName || 'Đặng Nguyễn'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>{currentUser?.phone || '0909123456'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã hồ sơ (BHYT)</Text>
            <Text style={styles.infoValue}>{currentUser?.patientId ? `BHYT-DTT-00000${currentUser.patientId}` : 'Chưa cập nhật'}</Text>
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
            <TouchableOpacity 
              style={[styles.actionBtn, styles.cancelBtn, cancelling && { opacity: 0.5 }]} 
              activeOpacity={0.8}
              onPress={handleCancel}
              disabled={cancelling}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.cancelBtnText}>{cancelling ? 'Đang xử lý...' : 'Hủy lịch'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.navBtn]} activeOpacity={0.8} onPress={handleDirections}>
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
