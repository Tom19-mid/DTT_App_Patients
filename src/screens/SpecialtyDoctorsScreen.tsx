import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { apiMedical } from '../services/apiService';

// yyyy-MM-dd cho API (khớp cách BookingScreen.tsx gọi apiMedical.getDoctorSchedules), và d/M/yyyy để
// hiển thị + truyền cho ConfirmBooking — tách riêng 2 định dạng cho từng mục đích.
const toApiDateStr = (d: Date) => `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
const toDisplayDateStr = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

const SpecialtyDoctorsScreen = ({ route, navigation }: any) => {
  const { specialty } = route.params || { specialty: { name: 'Chuyên khoa', id: undefined } };
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, [specialty]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await apiMedical.getDoctors(specialty?.id);
      if (data && data.length > 0) {
        // Trước đây giờ khám là BỊA (isShiftA = doctorId % 2 === 1) dù đã gọi API bác sĩ thật — bệnh
        // nhân có thể đặt đúng giờ bác sĩ không hề làm việc. Lấy lịch trực THẬT cho hôm nay/ngày mai,
        // theo đúng cách BookingScreen.tsx đã làm (apiMedical.getDoctorSchedules).
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const [schedulesToday, schedulesTomorrow] = await Promise.all([
          apiMedical.getDoctorSchedules(undefined, specialty?.id, toApiDateStr(today)).catch(() => []),
          apiMedical.getDoctorSchedules(undefined, specialty?.id, toApiDateStr(tomorrow)).catch(() => []),
        ]);
        const scheduleMap = new Map<number, { today?: any; tomorrow?: any }>();
        (schedulesToday || []).forEach((s: any) => scheduleMap.set(s.doctorId, { ...scheduleMap.get(s.doctorId), today: s }));
        (schedulesTomorrow || []).forEach((s: any) => scheduleMap.set(s.doctorId, { ...scheduleMap.get(s.doctorId), tomorrow: s }));

        const formatted = data.map((d: any) => {
          const sched = scheduleMap.get(d.doctorId);
          const slotsToday = sched?.today?.isWorking ? sched.today.timeSlots : [];
          const slotsTomorrow = sched?.tomorrow?.isWorking ? sched.tomorrow.timeSlots : [];

          // Tránh lặp "Bác sĩ Bác sĩ ..." khi full_name trong DB đã tự có sẵn tiền tố "Bác sĩ"/"BS."
          // (vd dữ liệu test "Bác sĩ C", "Bác sĩ Tân") — trước đây luôn nối cứng "Bác sĩ " phía trước.
          const rawName = d.fullName || 'Bác sĩ DTT';
          const displayName = /^(bác sĩ|bs\.?)\s/i.test(rawName.trim()) ? rawName.trim() : `Bác sĩ ${rawName}`;

          return {
            id: d.doctorId,
            name: d.fullName || 'Bác sĩ DTT',
            title: d.degree || 'ThS. Bác sĩ',
            rating: d.rating || 5.0,
            reviews: d.reviewCount || 10,
            bio: `${displayName} có ${d.experienceYears || 10} năm kinh nghiệm công tác tại ${d.clinicRoom || 'Phòng khám'}.\n• Lịch trực thường niên: ${d.workingDaysText || 'Thứ Hai đến Thứ Bảy'}.\n• Chuyên sâu khám và tư vấn điều trị các bệnh lý ${specialty.name || 'chuyên khoa'}.`,
            schedule: [
              { dateLabel: `Hôm nay, ${toDisplayDateStr(today)}`, dateValue: toDisplayDateStr(today), slots: slotsToday },
              { dateLabel: `Ngày mai, ${toDisplayDateStr(tomorrow)}`, dateValue: toDisplayDateStr(tomorrow), slots: slotsTomorrow }
            ],
          };
        });
        setDoctors(formatted);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.log('Error fetching doctors from API:', error);
      // API lỗi — không còn bịa bác sĩ/lịch giả (trước đây dùng id âm + MOCK_SCHEDULE với ngày đã
      // qua hạn). Theo đúng convention PackagesScreen.tsx: giữ danh sách rỗng, để UI empty-state
      // bên dưới tự hiển thị (setError để phân biệt "rỗng do lỗi" và hiện thông báo phù hợp).
      setDoctors([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bác sĩ {specialty.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionDesc}>
          Danh sách các bác sĩ chuyên khoa {specialty.name} đang công tác tại hệ thống. Dữ liệu được cập nhật trực tiếp từ hệ thống quản lý.
        </Text>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.subtext }}>Đang tải danh sách Bác sĩ từ máy chủ...</Text>
          </View>
        ) : doctors.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Ionicons name={loadError ? "cloud-offline-outline" : "people-outline"} size={48} color={COLORS.placeholder} />
            <Text style={{ marginTop: 12, color: COLORS.subtext, textAlign: 'center', paddingHorizontal: 24 }}>
              {loadError
                ? 'Không thể tải danh sách bác sĩ. Vui lòng kiểm tra kết nối và thử lại.'
                : 'Chưa có bác sĩ thuộc chuyên khoa này.'}
            </Text>
            {loadError && (
              <TouchableOpacity style={styles.retryBtn} activeOpacity={0.8} onPress={fetchDoctors}>
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          doctors.map((doc) => {
            const isExpanded = expandedId === doc.id;
            return (
              <View key={doc.id} style={[styles.doctorCard, SHADOWS.card]}>
                <TouchableOpacity style={styles.doctorHeader} activeOpacity={0.7} onPress={() => toggleExpand(doc.id)}>
                  <View style={styles.avatarPlaceholder}>
                    <FontAwesome5 name="user-md" size={32} color={COLORS.primary} />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorTitle}>{doc.title}</Text>
                    <Text style={styles.doctorName}>{doc.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FBBF24" />
                      <Text style={styles.ratingText}>{doc.rating} ({doc.reviews} đánh giá)</Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={COLORS.placeholder} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <View style={styles.divider} />
                    <Text style={styles.bioTitle}>Giới thiệu:</Text>
                    <Text style={styles.bioText}>{doc.bio}</Text>
                    
                    <Text style={styles.bioTitle}>Lịch khám sắp tới:</Text>
                    
                    {Array.isArray(doc.schedule) && doc.schedule.map((day: any, sIdx: number) => (
                      <View key={sIdx} style={styles.scheduleDayBlock}>
                        <View style={styles.dateLabelRow}>
                          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                          <Text style={styles.dateLabelText}>{day.dateLabel}</Text>
                        </View>
                        {(!Array.isArray(day.slots) || day.slots.length === 0) && (
                          <Text style={styles.bioText}>Bác sĩ không có lịch khám ngày này.</Text>
                        )}
                        <View style={styles.slotsGrid}>
                          {Array.isArray(day.slots) && day.slots.map((time: string, idx: number) => (
                            <TouchableOpacity 
                              key={idx} 
                              style={[styles.timeSlotBtn, SHADOWS.input]}
                              onPress={() => {
                                navigation.navigate('ConfirmBooking', {
                                  doctorId: doc.id,
                                  doctorName: `${doc.title} ${doc.name}`,
                                  specialtyName: specialty.name,
                                  date: day.dateValue,
                                  timeSlot: time,
                                  location: 'Phòng khám đa khoa DTT Healthcare',
                                  fee: '250.000đ'
                                });
                              }}
                            >
                              <Text style={styles.timeSlotText}>{time}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
    padding: 16,
  },
  sectionDesc: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 20,
    marginBottom: 16,
  },
  doctorCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.subtext,
    marginLeft: 4,
  },
  expandedContent: {
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  bioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
    marginBottom: 4,
  },
  bioText: {
    fontSize: 13,
    color: COLORS.subtext,
    lineHeight: 18,
    marginBottom: 12,
  },
  scheduleDayBlock: {
    marginTop: 8,
    marginBottom: 12,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default SpecialtyDoctorsScreen;
