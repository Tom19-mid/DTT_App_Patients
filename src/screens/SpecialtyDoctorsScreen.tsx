import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

const DOCTORS = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    title: 'BS. CKII',
    rating: 4.9,
    reviews: 120,
    bio: 'Bác sĩ Nguyễn Văn A có hơn 15 năm kinh nghiệm trong lĩnh vực Nội Tổng quát. Từng công tác tại bệnh viện Chợ Rẫy và tu nghiệp tại Pháp. Bác sĩ chuyên điều trị các bệnh lý về tiêu hóa, hô hấp và tim mạch cơ bản.',
    schedule: [
      { dateLabel: 'Hôm nay, 21/07/2026', dateValue: '21/07/2026', slots: ['7:30 - 8:30', '8:30 - 9:30', '13:30 - 14:30'] },
      { dateLabel: 'Ngày mai, 22/07/2026', dateValue: '22/07/2026', slots: ['8:30 - 9:30', '9:30 - 10:30'] }
    ]
  },
  {
    id: 2,
    name: 'Trần Thị B',
    title: 'ThS. BS',
    rating: 4.8,
    reviews: 85,
    bio: 'Thạc sĩ Bác sĩ Trần Thị B chuyên sâu về Nội tiết và Đái tháo đường. Có nhiều năm kinh nghiệm trong việc tư vấn dinh dưỡng và điều trị các bệnh lý mãn tính. Từng tham gia nhiều hội thảo y khoa quốc tế.',
    schedule: [
      { dateLabel: 'Hôm nay, 21/07/2026', dateValue: '21/07/2026', slots: ['8:00 - 9:00', '15:00 - 16:00'] },
      { dateLabel: 'Ngày mốt, 23/07/2026', dateValue: '23/07/2026', slots: ['10:00 - 11:00', '13:00 - 14:00'] }
    ]
  }
];

const SpecialtyDoctorsScreen = ({ route, navigation }: any) => {
  const { specialty } = route.params || { specialty: { name: 'Chuyên khoa' } };
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
          Danh sách các bác sĩ chuyên khoa {specialty.name} đang công tác tại phòng khám. Bạn có thể xem thông tin chi tiết và đặt lịch khám ngay.
        </Text>

        {DOCTORS.map((doc) => {
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
                  
                  {doc.schedule.map((day, sIdx) => (
                    <View key={sIdx} style={styles.scheduleDayBlock}>
                      <View style={styles.dateLabelRow}>
                        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.dateLabelText}>{day.dateLabel}</Text>
                      </View>
                      <View style={styles.slotsGrid}>
                        {day.slots.map((time, idx) => (
                          <TouchableOpacity 
                            key={idx} 
                            style={[styles.timeSlotBtn, SHADOWS.input]}
                            onPress={() => {
                              navigation.navigate('ConfirmBooking', {
                                type: 'doctor',
                                doctorName: `${doc.title} ${doc.name}`,
                                specialty: specialty.name,
                                date: day.dateValue,
                                time: time,
                                price: '150.000đ'
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
        })}
      </ScrollView>
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
  
  container: { padding: 16, paddingBottom: 40 },
  sectionDesc: { fontSize: 14, color: COLORS.placeholder, marginBottom: 20, lineHeight: 22 },
  
  doctorCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  doctorHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarPlaceholder: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0F5FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  doctorInfo: { flex: 1 },
  doctorTitle: { fontSize: 13, color: COLORS.primary, fontWeight: 'bold', marginBottom: 2 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: COLORS.placeholder },
  
  expandedContent: { marginTop: 12 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
  bioTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  bioText: { fontSize: 14, color: COLORS.placeholder, lineHeight: 22, marginBottom: 16, textAlign: 'justify' },
  
  scheduleDayBlock: { marginBottom: 16 },
  dateLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  dateLabelText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeSlotBtn: { width: '30%', backgroundColor: '#fff', paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0F5FF' },
  timeSlotText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});

export default SpecialtyDoctorsScreen;
