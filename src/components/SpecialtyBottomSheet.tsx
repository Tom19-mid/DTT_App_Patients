import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, Animated, Dimensions, TouchableWithoutFeedback,
  ScrollView, Pressable, ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';
import { apiMedical } from '../services/apiService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;

// ── Sub-services ──────────────────────────────────────────────────────────────
const SUB_SERVICES = [
  { id: 1, labelKey: 'doctors',         icon: 'user-md',             type: 'fa5' },
  { id: 2, labelKey: 'book_appointment',  icon: 'calendar-check',      type: 'fa5' },
  { id: 3, labelKey: 'tests',     icon: 'vials',               type: 'fa5' },
  { id: 4, labelKey: 'exam_ticket',     icon: 'file-medical',        type: 'fa5' },
  { id: 5, labelKey: 'prescription',      icon: 'pills',               type: 'fa5' },
  { id: 6, labelKey: 'invoice',        icon: 'file-invoice-dollar', type: 'fa5' },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Specialty {
  id: number;
  nameKey?: string;
  name?: string;
  icon: string;
  type: string;
}

interface Props {
  visible: boolean;
  specialty: Specialty | null;
  onClose: () => void;
}

// ── Main Component ────────────────────────────────────────────────────────────
const SpecialtyBottomSheet: React.FC<Props> = ({ visible, specialty, onClose }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isVerified } = useAuth();
  const { showAlert } = useCustomAlert();
  const { isDarkMode, t } = useSettings();
  const slideAnim  = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Trước đây chỉ lấy doctors[0] ("1 bác sĩ tiêu biểu") — theo đúng yêu cầu QA gốc ("Cần hiện hết các
  // bác sĩ thuộc chuyên khoa"), giờ hiện TOÀN BỘ bác sĩ Active/OnLeave của chuyên khoa này ngay trong
  // bottom sheet thay vì bắt phải bấm sang màn danh sách đầy đủ mới thấy được bác sĩ thứ 2 trở đi.
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  // doctorId -> có lịch khám HÔM NAY hay không (lấy từ GET /api/Doctors/schedules) — dùng để xám nút
  // "Đặt khám" cho bác sĩ không có lịch hôm nay, tránh bệnh nhân bấm vào rồi mới biết không đặt được.
  const [workingTodayMap, setWorkingTodayMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (visible && specialty) {
      fetchDoctors(specialty.id);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, specialty]);

  const fetchDoctors = async (specialtyId?: number) => {
    try {
      setDoctorLoading(true);
      const list = await apiMedical.getDoctors(specialtyId);
      setDoctors(Array.isArray(list) ? list : []);

      // Lấy lịch khám THẬT của hôm nay cho cả chuyên khoa này trong 1 lần gọi, để biết bác sĩ nào
      // không có lịch hôm nay mà xám nút "Đặt khám" — không chặn hiện thông tin bác sĩ, chỉ chặn bấm.
      try {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        const schedules = await apiMedical.getDoctorSchedules(undefined, specialtyId, todayStr);
        const map: Record<number, boolean> = {};
        (schedules || []).forEach((s: any) => { map[s.doctorId] = !!s.isWorking; });
        setWorkingTodayMap(map);
      } catch (schedErr) {
        console.log('Error fetching today schedules:', schedErr);
        setWorkingTodayMap({});
      }
    } catch (e) {
      console.log('Error fetching doctors:', e);
      setDoctors([
        { doctorId: -1, fullName: 'BS. CKII Nguyễn Văn A', degree: 'Chuyên khoa I Nội tổng quát', rating: 4.9, reviewCount: 120 },
      ]);
      setWorkingTodayMap({});
    } finally {
      setDoctorLoading(false);
    }
  };

  if (!specialty) return null;

  const displaySpecialtyName = specialty.nameKey ? t(specialty.nameKey) : specialty.name;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        onStartShouldSetResponder={() => true}
        style={[styles.sheet, { paddingBottom: insets.bottom + 8 }, isDarkMode && { backgroundColor: '#1F2937' },
          { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle bar */}
        <View style={[styles.handleBar, isDarkMode && { backgroundColor: '#4B5563' }]} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={[styles.title, isDarkMode && { color: '#F3F4F6' }]}>{displaySpecialtyName}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, isDarkMode && { backgroundColor: '#374151' }]} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="red" />
            </TouchableOpacity>
          </View>

          {/* ── Search ── */}
          <View style={[styles.searchBar, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}>
            <Ionicons name="search-outline" size={18} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
            <TextInput
              style={[styles.searchInput, isDarkMode && { color: '#F3F4F6' }]}
              placeholder={t('search_modal_placeholder')}
              placeholderTextColor={isDarkMode ? '#9CA3AF' : COLORS.placeholder}
            />
            <Ionicons name="mic-outline" size={18} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
          </View>

          {/* ── Sub-services 3-column grid ── */}
          <View style={styles.grid}>
            {SUB_SERVICES.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.gridItem,
                  pressed && styles.gridItemPressed,
                ]}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    if (item.labelKey === 'book_appointment') {
                      navigation.navigate('Booking', { specialty: displaySpecialtyName });
                    } else if (item.labelKey === 'doctors') {
                      navigation.navigate('SpecialtyDoctors', { specialty: { name: displaySpecialtyName, id: specialty.id } });
                    } else if (['exam_ticket', 'prescription', 'invoice', 'tests'].includes(item.labelKey)) {
                      if (!isVerified) {
                        showAlert({
                          title: 'Từ chối truy cập',
                          message: 'Vui lòng mang CCCD đến quầy lễ tân bệnh viện để xác thực tài khoản trước khi xem hồ sơ y tế.',
                          type: 'error'
                        });
                        return;
                      }

                      let tabId = 'phieu-kham';
                      if (item.labelKey === 'prescription') tabId = 'toa-thuoc';
                      if (item.labelKey === 'tests') tabId = 'xet-nghiem';
                      if (item.labelKey === 'invoice') tabId = 'hoa-don';
                      
                      navigation.navigate('MedicalRecords', {
                        initialTab: tabId,
                        specialty: displaySpecialtyName
                      });
                    }
                  }, 300);
                }}
              >
                <View style={[styles.iconBox, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}>
                  <FontAwesome5 name={item.icon as any} size={30} color={isDarkMode ? '#60A5FA' : COLORS.primary} />
                </View>
                <Text style={[styles.gridLabel, isDarkMode && { color: '#D1D5DB' }]}>{t(item.labelKey)}</Text>
              </Pressable>
            ))}
          </View>

          {/* ── Bác sĩ chuyên khoa (Lấy từ API — hiện đủ, không chỉ 1 bác sĩ tiêu biểu) ── */}
          <View style={styles.appointmentSection}>
            <Text style={[styles.sectionTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('specialty_doctors')}</Text>

            {doctorLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : doctors.length > 0 ? (
              doctors.map((doc, idx) => {
                // Mặc định coi là CÓ lịch nếu chưa xác định được (lỗi tải lịch hôm nay) — không vì 1
                // API phụ lỗi mà khóa cứng luôn nút đặt khám của mọi bác sĩ.
                const isWorkingToday = workingTodayMap[doc.doctorId] !== false;
                return (
                <View
                  key={doc.doctorId ?? idx}
                  style={[styles.doctorCard, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }, idx > 0 && { marginTop: 10 }]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    activeOpacity={0.8}
                    onPress={() => {
                      onClose();
                      navigation.navigate('SpecialtyDoctors', { specialty: { name: displaySpecialtyName, id: specialty.id } });
                    }}
                  >
                    <View style={[styles.doctorAvatarPlaceholder, isDarkMode && { backgroundColor: '#1F2937' }]}>
                      <FontAwesome5 name="user-md" size={24} color={isDarkMode ? '#60A5FA' : COLORS.primary} />
                    </View>

                    <View style={styles.doctorInfo}>
                      <Text style={[styles.doctorName, isDarkMode && { color: '#F3F4F6' }]}>{doc.fullName || 'Bác sĩ DTT'}</Text>
                      <Text style={[styles.doctorSpecialty, isDarkMode && { color: '#9CA3AF' }]}>{doc.degree || displaySpecialtyName}</Text>
                      <View style={styles.doctorRatingRow}>
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text style={[styles.doctorRating, isDarkMode && { color: '#9CA3AF' }]}>{doc.rating || 5.0} ({doc.reviewCount || 10} {t('reviews')})</Text>
                      </View>
                      {!isWorkingToday && (
                        <Text style={styles.noScheduleTodayText}>Hôm nay không có lịch khám</Text>
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bookBtnSmall, !isWorkingToday && styles.bookBtnSmallDisabled]}
                    activeOpacity={isWorkingToday ? 0.8 : 1}
                    disabled={!isWorkingToday}
                    onPress={() => {
                      onClose();
                      navigation.navigate('SpecialtyDoctors', { specialty: { name: displaySpecialtyName, id: specialty.id } });
                    }}
                  >
                    <Text style={[styles.bookBtnSmallText, !isWorkingToday && styles.bookBtnSmallTextDisabled]}>{t('book_btn')}</Text>
                  </TouchableOpacity>
                </View>
                );
              })
            ) : (
              <Text style={{ fontSize: 13, color: COLORS.subtext, fontStyle: 'italic', marginVertical: 8 }}>
                Chưa có bác sĩ nào thuộc chuyên khoa này.
              </Text>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

export default SpecialtyBottomSheet;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SHEET_HEIGHT, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12,
  },
  handleBar: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D0D0D0', alignSelf: 'center', marginBottom: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 25,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.text },
  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 24,
  },
  gridItem: {
    width: '30%', alignItems: 'center', marginBottom: 16,
    borderRadius: 16,
  },
  gridItemPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
  },
  iconBox: {
    width: 72, height: 72, borderRadius: 16, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0',
  },
  gridLabel: { fontSize: 12, fontWeight: '500', color: COLORS.text, textAlign: 'center' },
  // Appointment section
  appointmentSection: { marginTop: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  // Doctor Card
  doctorCard: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    marginBottom: 16,
  },
  doctorAvatarPlaceholder: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  doctorSpecialty: { fontSize: 12, color: COLORS.placeholder, marginBottom: 6 },
  doctorRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doctorRating: { fontSize: 12, color: COLORS.text, fontWeight: '500' },
  noScheduleTodayText: { fontSize: 11, color: '#EF4444', fontWeight: '600', marginTop: 4 },
  bookBtnSmall: {
    backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
  },
  bookBtnSmallDisabled: { backgroundColor: '#E2E8F0' },
  bookBtnSmallText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  bookBtnSmallTextDisabled: { color: '#94A3B8' },
});
