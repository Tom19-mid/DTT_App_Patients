import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { apiMedical } from '../services/apiService';

const MOCK_SCHEDULE = [
  { dateLabel: 'Hôm nay, 25/07/2026', dateValue: '25/07/2026', slots: ['7:30 - 8:30', '8:30 - 9:30', '13:30 - 14:30'] },
  { dateLabel: 'Ngày mai, 26/07/2026', dateValue: '26/07/2026', slots: ['8:30 - 9:30', '9:30 - 10:30', '15:00 - 16:00'] }
];

const SpecialtyDoctorsScreen = ({ route, navigation }: any) => {
  const { specialty } = route.params || { specialty: { name: 'Chuyên khoa', id: undefined } };
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, [specialty]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await apiMedical.getDoctors(specialty?.id);
      if (data && data.length > 0) {
        const formatted = data.map((d: any) => {
          const isShiftA = d.doctorId % 2 === 1;
          const slotsToday = isShiftA ? ['07:30 - 08:30', '08:30 - 09:30', '09:30 - 10:30'] : ['13:30 - 14:30', '14:30 - 15:30', '15:30 - 16:30'];
          const slotsTomorrow = isShiftA ? ['08:00 - 09:00', '10:30 - 11:30', '13:30 - 14:30'] : ['09:30 - 10:30', '14:30 - 15:30', '16:30 - 17:30'];

          return {
            id: d.doctorId,
            name: d.fullName || 'Bác sĩ DTT',
            title: d.degree || 'ThS. Bác sĩ',
            rating: d.rating || 5.0,
            reviews: d.reviewCount || 10,
            bio: `Bác sĩ ${d.fullName || ''} có ${d.experienceYears || 10} năm kinh nghiệm công tác tại ${d.clinicRoom || 'Phòng khám'}.\n• Lịch trực thường niên: ${d.workingDaysText || 'Thứ Hai đến Thứ Bảy'}.\n• Chuyên sâu khám và tư vấn điều trị các bệnh lý ${specialty.name || 'chuyên khoa'}.`,
            schedule: [
              { dateLabel: 'Hôm nay, 25/07/2026', dateValue: '25/07/2026', slots: slotsToday },
              { dateLabel: 'Ngày mai, 26/07/2026', dateValue: '26/07/2026', slots: slotsTomorrow }
            ],
          };
        });
        setDoctors(formatted);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.log('Error fetching doctors from API:', error);
      // Fallback
      setDoctors([
        {
          id: 1,
          name: 'BS. CK1 Nguyễn Văn A',
          title: 'Chuyên khoa I Nội tổng quát',
          rating: 4.9,
          reviews: 120,
          bio: 'Bác sĩ Nguyễn Văn A có hơn 10 năm kinh nghiệm trong lĩnh vực Nội Tổng quát tại bệnh viện.',
          schedule: MOCK_SCHEDULE
        },
        {
          id: 2,
          name: 'BS. CKI Lê Thị B',
          title: 'Bác sĩ Chuyên khoa Nhi',
          rating: 5.0,
          reviews: 98,
          bio: 'Bác sĩ Lê Thị B chuyên chăm sóc sức khỏe và điều trị bệnh lý nhi khoa.',
          schedule: MOCK_SCHEDULE
        }
      ]);
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
            <Ionicons name="people-outline" size={48} color={COLORS.placeholder} />
            <Text style={{ marginTop: 12, color: COLORS.subtext }}>Chưa có bác sĩ thuộc chuyên khoa này.</Text>
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
                        <View style={styles.slotsGrid}>
                          {Array.isArray(day.slots) && day.slots.map((time: string, idx: number) => (
                            <TouchableOpacity 
                              key={idx} 
                              style={[styles.timeSlotBtn, SHADOWS.input]}
                              onPress={() => {
                                navigation.navigate('ConfirmBooking', {
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
    justify: 'center',
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
});

export default SpecialtyDoctorsScreen;
