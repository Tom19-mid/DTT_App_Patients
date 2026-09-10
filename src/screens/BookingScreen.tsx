import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import DraggableChat from '../components/DraggableChat';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { apiMedical } from '../services/apiService';

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SPECIALTIES = [
  { name: 'Nội Tổng quát', icon: 'stethoscope' },
  { name: 'Nhi khoa', icon: 'baby' },
  { name: 'Phụ & Sản khoa', icon: 'female' },
  { name: 'Cơ xương khớp', icon: 'bone' },
  { name: 'Tim mạch', icon: 'heartbeat' },
  { name: 'Thần kinh', icon: 'brain' },
  { name: 'Da liễu', icon: 'hand-sparkles' },
];

// --- Helper Functions for Calendar ---
const getNormalizedDay = (dayIndex: number) => (dayIndex === 0 ? 6 : dayIndex - 1);

const generateMonthGrid = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startingEmptySlots = getNormalizedDay(firstDayOfMonth);
  
  const grid = [];
  for (let i = 0; i < startingEmptySlots; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(new Date(year, month, i));
  return grid;
};

const DOCTORS = [
  {
    id: 1,
    title: 'BS. CKI',
    name: 'NGUYỄN VĂN A',
    slots: '3 KHUNG GIỜ',
    date: '26/06/2026',
    image: 'https://img.freepik.com/free-photo/smiling-asian-male-doctor-with-stethoscope-standing-crossed-arms-looking-camera-confident-medical-professional-clinic-hospital-background_1258-109033.jpg',
    timeSlots: ['7:30 - 8:30', '8:30 - 9:30', '13:30 - 14:30'],
  },
  {
    id: 2,
    title: 'BS. CKII',
    name: 'NGUYỄN VĂN B',
    slots: '5 KHUNG GIỜ',
    date: '26/06/2026',
    image: 'https://img.freepik.com/free-photo/beautiful-young-female-doctor-looking-camera-office_1301-7807.jpg',
    timeSlots: ['7:30 - 8:30', '8:30 - 9:30', '9:30 - 10:30', '13:30 - 14:30', '15:30 - 16:30'],
  },
  {
    id: 3,
    title: 'BS.',
    name: 'NGUYỄN VĂN C',
    slots: '3 KHUNG GIỜ',
    date: '26/06/2026',
    image: 'https://img.freepik.com/free-photo/portrait-successful-mid-adult-doctor-with-crossed-arms_1262-12865.jpg',
    timeSlots: ['7:30 - 8:30', '8:30 - 9:30', '9:30 - 10:30'],
  },
];

// Icon dự phòng theo từ khóa tên chuyên khoa — chỉ dùng để chọn icon hiển thị, KHÔNG dùng để xác
// định specialtyId (specialtyId giờ lấy trực tiếp từ API, xem apiSpecialties bên dưới).
const iconForSpecialtyName = (name: string): string => {
  const s = name.toLowerCase();
  if (s.includes('nội') || s.includes('general')) return 'stethoscope';
  if (s.includes('nhi') || s.includes('pediatric')) return 'baby';
  if (s.includes('phụ') || s.includes('sản') || s.includes('obstetric')) return 'female';
  if (s.includes('cơ') || s.includes('xương') || s.includes('khớp')) return 'bone';
  if (s.includes('tim') || s.includes('cardi')) return 'heartbeat';
  if (s.includes('thần') || s.includes('neurology')) return 'brain';
  if (s.includes('da') || s.includes('dermatology')) return 'hand-sparkles';
  if (s.includes('hình') || s.includes('imaging') || s.includes('chẩn đoán')) return 'x-ray';
  if (s.includes('răng') || s.includes('hàm') || s.includes('mặt') || s.includes('dental')) return 'tooth';
  if (s.includes('tai') || s.includes('mũi') || s.includes('họng') || s.includes('ent')) return 'deaf';
  if (s.includes('mắt') || s.includes('eye')) return 'eye';
  return 'notes-medical';
};

const BookingScreen = ({ route, navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { profiles } = useAuth();
  const initialSpecialty = route.params?.specialty || route.params?.specialtyName || t('specialties');
  const requestedDoctorId: number | undefined = route.params?.doctorId || undefined;
  const [expandedId, setExpandedId] = useState<number | null>(route.params?.doctorId || 3);
  const [isSpecialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty);
  // Danh sách chuyên khoa thật từ DB (trước đây modal chọn chuyên khoa dùng mảng SPECIALTIES hardcode
  // chỉ 7 mục — các chuyên khoa thêm sau qua Web Admin như Răng hàm mặt/Tai-Mũi-Họng/Mắt không hề
  // xuất hiện để chọn, đúng như report "chuyên khoa hiển thị không đúng trong database").
  const [apiSpecialties, setApiSpecialties] = useState<Array<{ specialtyId: number; name: string; icon: string }>>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | undefined>(route.params?.specialtyId || undefined);

  useEffect(() => {
    apiMedical.getSpecialties()
      .then((list: any[]) => {
        if (Array.isArray(list) && list.length > 0) {
          setApiSpecialties(list.map(s => ({ specialtyId: s.specialtyId, name: s.specialtyName, icon: iconForSpecialtyName(s.specialtyName) })));
        }
      })
      .catch(() => {});
  }, []);

  // Dropdown "Đặt lịch cho": Bản thân | Người thân — chỉ liệt kê hồ sơ người thân của CHÍNH tài khoản
  // đang đăng nhập (profiles đến từ AuthContext, vốn đã lọc theo patientId của currentUser ở backend),
  // để người thân không cần được cấp tài khoản riêng vẫn có thể được đặt lịch khám qua tài khoản người
  // thân đã tạo hồ sơ cho họ.
  const selfProfile = useMemo(
    () => profiles.find(p => p.isOwner || p.relationship === 'Bản thân') || profiles[0],
    [profiles]
  );
  const familyProfiles = useMemo(
    () => profiles.filter(p => !(p.isOwner || p.relationship === 'Bản thân')),
    [profiles]
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(undefined);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);

  const selectedProfile = useMemo(
    () => profiles.find(p => p.id === selectedProfileId) || selfProfile,
    [profiles, selectedProfileId, selfProfile]
  );

  // Không có hồ sơ người thân nào -> bấm vào dropdown không có gì xảy ra (không mở popup rỗng chỉ để
  // chọn lại đúng "Bản thân" đang chọn sẵn).
  const handleOpenProfileDropdown = () => {
    if (familyProfiles.length === 0) return;
    setProfileModalVisible(true);
  };

  // Calendar State
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [currentMonth, setCurrentMonth] = useState(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date(tomorrow));
  const [isExpanded, setIsExpanded] = useState(false);

  // Derived calendar data
  const monthGrid = useMemo(() => {
    return generateMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  const weekGrid = useMemo(() => {
    const dateToFind = selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear() 
      ? selectedDate 
      : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const dateIndex = monthGrid.findIndex(d => d && d.getDate() === dateToFind.getDate());
    const weekStartIndex = Math.floor((dateIndex === -1 ? 0 : dateIndex) / 7) * 7;
    
    const week = monthGrid.slice(weekStartIndex, weekStartIndex + 7);
    while (week.length < 7) week.push(null);
    return week;
  }, [monthGrid, selectedDate, currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const toggleCalendar = () => setIsExpanded(!isExpanded);

  const handleSelectDate = (date: Date) => {
    if (date >= tomorrow) {
      setSelectedDate(date);
      setIsExpanded(false);
    }
  };

  const renderDateItem = (date: Date | null, index: number) => {
    if (!date) return <View key={`empty-${index}`} style={styles.dateCol} />;

    const isPast = date < tomorrow;
    const isSelected = date.getDate() === selectedDate.getDate() && 
                       date.getMonth() === selectedDate.getMonth() && 
                       date.getFullYear() === selectedDate.getFullYear();

    return (
      <View key={date.toISOString()} style={styles.dateCol}>
        <TouchableOpacity 
          style={[styles.dateCircle, isSelected && styles.dateCircleActive]}
          activeOpacity={0.7}
          onPress={() => handleSelectDate(date)}
          disabled={isPast}
        >
          <Text style={[
            styles.dateText, 
            isSelected && styles.dateTextActive,
            isPast && styles.dateTextPast
          ]}>
            {date.getDate()}
          </Text>
        </TouchableOpacity>
        {isSelected && !isExpanded && (
          <TouchableOpacity onPress={toggleCalendar} style={styles.activeIndicatorBtn}>
             <Ionicons name="chevron-down" size={20} color={COLORS.text} style={styles.activeIndicator} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  // Fallback khi màn hình được mở bằng tên chuyên khoa dạng chuỗi tự do (route params từ màn khác,
  // vd AI Chat gợi ý chuyên khoa) mà chưa có specialtyId cụ thể — ưu tiên khớp đúng tên với danh sách
  // thật từ API trước, chỉ heuristic theo từ khóa khi không khớp được (vd trước khi API load xong).
  const getSpecialtyId = (specialty: string): number | undefined => {
    const s = specialty.toLowerCase().trim();
    const exactMatch = apiSpecialties.find(sp => sp.name.toLowerCase().trim() === s);
    if (exactMatch) return exactMatch.specialtyId;
    const partialMatch = apiSpecialties.find(sp => sp.name.toLowerCase().includes(s) || s.includes(sp.name.toLowerCase()));
    if (partialMatch) return partialMatch.specialtyId;

    if (s.includes('nội') || s.includes('general')) return 1;
    if (s.includes('nhi') || s.includes('pediatric')) return 2;
    if (s.includes('phụ') || s.includes('sản') || s.includes('obstetric')) return 3;
    if (s.includes('cơ') || s.includes('xương') || s.includes('khớp') || s.includes('musculoskeletal')) return 4;
    if (s.includes('tim') || s.includes('cardi')) return 5;
    if (s.includes('thần') || s.includes('neurology')) return 6;
    if (s.includes('da') || s.includes('dermatology')) return 7;
    if (s.includes('hình') || s.includes('imaging')) return 8;
    if (s.includes('răng') || s.includes('hàm') || s.includes('dental')) return 9;
    if (s.includes('tai') || s.includes('mũi') || s.includes('họng') || s.includes('ent')) return 10;
    if (s.includes('mắt') || s.includes('eye')) return 11;
    return undefined;
  };

  useEffect(() => {
    // Clear stale schedules immediately when specialty/date changes to avoid showing wrong doctors
    setDoctorSchedules([]);
    // Ưu tiên specialtyId đã chọn trực tiếp từ modal/API (selectedSpecialtyId); chỉ suy luận qua tên
    // khi mở màn bằng route params dạng chuỗi (vd từ AI Chat) chưa kèm sẵn ID.
    const specId = selectedSpecialtyId ?? getSpecialtyId(selectedSpecialty);
    // Only fetch if a specific specialty is selected, or a specific doctor was requested
    // (vd: mở từ "Đã dùng gần đây" trên Home — trước đây doctorId bị bỏ qua hoàn toàn ở đây nên
    // "đặt theo bác sĩ" hiện y hệt danh sách "đặt theo chuyên khoa", không lọc còn 1 bác sĩ).
    if (specId !== undefined || requestedDoctorId !== undefined) {
      fetchApiSchedules(specId);
    }
  }, [selectedSpecialty, selectedSpecialtyId, selectedDate, requestedDoctorId, apiSpecialties]);

  const fetchApiSchedules = async (specId?: number) => {
    try {
      setSchedulesLoading(true);
      const dateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

      // Use AbortController with 8-second timeout to avoid hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const schedules = await apiMedical.getDoctorSchedules(requestedDoctorId, specId, dateStr);
      clearTimeout(timeout);

      if (schedules && schedules.length > 0) {
        // Extra filter: ensure only doctors for this specialty are shown
        const filtered = specId !== undefined
          ? schedules.filter((s: any) => !s.specialtyId || s.specialtyId === specId)
          : schedules;
        setDoctorSchedules(filtered.length > 0 ? filtered : schedules);
      } else {
        setDoctorSchedules([]);
      }
    } catch (e) {
      console.log('Error fetching doctor schedules in BookingScreen:', e);
      setDoctorSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const currentDoctors = useMemo(() => {
    const dateStr = `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
    if (doctorSchedules && doctorSchedules.length > 0) {
      return doctorSchedules.map((doc: any) => ({
        id: doc.doctorId,
        title: doc.degree || 'BS.',
        name: doc.fullName ? doc.fullName.toUpperCase() : 'BÁC SĨ DTT',
        isWorking: doc.isWorking,
        statusText: doc.statusText,
        slots: doc.isWorking ? `${doc.timeSlots.length} ${t('time_slots')}` : 'NGHỈ PHÉP',
        date: dateStr,
        image: 'https://img.freepik.com/free-photo/smiling-asian-male-doctor-with-stethoscope-standing-crossed-arms-looking-camera-confident-medical-professional-clinic-hospital-background_1258-109033.jpg',
        timeSlots: doc.isWorking ? doc.timeSlots : []
      }));
    }

    // Return empty when loading or no specialty selected to avoid showing all doctors
    return [];
  }, [selectedSpecialty, selectedDate, doctorSchedules, t]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header - Back & Logo */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, SHADOWS.card]} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Image
            source={require('../../assets/logo.png')}
            style={[styles.logo, SHADOWS.card]}
            resizeMode="contain"
          />
        </View>

        {/* ── Booking Type Tabs ── */}
        <View style={styles.bookingTabs}>
          <View style={[styles.bookingTab, styles.bookingTabActive]}>
            <Text style={styles.bookingTabTextActive}>{t('specialty_exam')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.bookingTab} 
            activeOpacity={0.7} 
            onPress={() => navigation.navigate('Packages')}
          >
            <Text style={styles.bookingTabText}>{t('package_exam')}</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Chuyên khoa + Dropdown Đặt lịch cho (Bản thân | Người thân) */}
        <View style={styles.dropdownWrapper}>
          <View style={styles.dropdownRow}>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setSpecialtyModalVisible(true)}
            >
              <Text style={[styles.dropdownText, selectedSpecialty !== t('specialties') && selectedSpecialty !== 'Chuyên khoa' && { color: COLORS.primary, fontWeight: 'bold' }]}>
                {selectedSpecialty}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={familyProfiles.length === 0 ? 1 : 0.7}
              onPress={handleOpenProfileDropdown}
            >
              <Ionicons name="person-circle-outline" size={16} color={COLORS.text} />
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedProfile && selectedProfile.relationship !== 'Bản thân' ? selectedProfile.name : 'Bản thân'}
              </Text>
              {familyProfiles.length > 0 && <Ionicons name="chevron-down" size={16} color={COLORS.text} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthBtn} activeOpacity={0.7} onPress={handlePrevMonth}>
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {t('month')} {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity style={styles.monthBtn} activeOpacity={0.7} onPress={handleNextMonth}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Weekly Calendar */}
        <View style={styles.calendarWrapper}>
          <View style={[styles.calendarCard, SHADOWS.card]}>
            <View style={styles.daysRow}>
              {WEEK_DAYS.map((day, index) => (
                <Text key={index} style={styles.dayText}>{day}</Text>
              ))}
            </View>
            
            {isExpanded ? (
              // FULL MONTH VIEW
              <View style={styles.monthGrid}>
                {monthGrid.map((date, index) => (
                  <View key={`grid-${index}`} style={styles.gridCell}>
                    {renderDateItem(date, index)}
                  </View>
                ))}
                
                {/* Collapse button for full month view */}
                <View style={styles.collapseWrapper}>
                  <TouchableOpacity onPress={toggleCalendar} style={styles.collapseBtn}>
                    <Ionicons name="chevron-up" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // WEEK VIEW
              <View>
                <View style={styles.datesRow}>
                  {weekGrid.map((date, index) => renderDateItem(date, index))}
                </View>
                {/* Fallback expand button if selected date is NOT in this week */}
                {!weekGrid.some(d => d && d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear()) && (
                  <View style={styles.collapseWrapper}>
                    <TouchableOpacity onPress={toggleCalendar} style={styles.collapseBtn}>
                      <Ionicons name="chevron-down" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Doctor List */}
        <View style={styles.doctorList}>
          {schedulesLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ marginTop: 12, color: COLORS.placeholder, fontSize: 14 }}>
                Đang tải danh sách bác sĩ...
              </Text>
            </View>
          ) : currentDoctors.length === 0 && selectedSpecialtyId === undefined && getSpecialtyId(selectedSpecialty) === undefined && requestedDoctorId === undefined ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="medkit-outline" size={48} color="#D0D0D0" />
              <Text style={{ marginTop: 12, color: COLORS.placeholder, textAlign: 'center', fontSize: 14 }}>
                Vui lòng chọn chuyên khoa{'\n'}để xem danh sách bác sĩ
              </Text>
            </View>
          ) : currentDoctors.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="calendar-outline" size={48} color="#D0D0D0" />
              <Text style={{ marginTop: 12, color: COLORS.placeholder, textAlign: 'center', fontSize: 14 }}>
                Không có bác sĩ làm việc{'\n'}trong ngày này
              </Text>
            </View>
          ) : (
          <>{currentDoctors.map((doc) => {
            const isExpanded = expandedId === doc.id;
            return (
              <View key={doc.id} style={[styles.doctorCard, SHADOWS.card]}>
                <TouchableOpacity 
                  style={styles.doctorRow} 
                  activeOpacity={0.7} 
                  onPress={() => toggleExpand(doc.id)}
                >
                  {/* Placeholder for future DB image */}
                  <View style={styles.doctorImgPlaceholder}>
                    <Ionicons name="person" size={40} color="#C0C0C0" />
                  </View>
                  
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorTitle}>{doc.title}</Text>
                    <Text style={styles.doctorName}>{doc.name}</Text>
                    <View style={[styles.slotBadge, doc.isWorking === false && { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[styles.slotBadgeText, doc.isWorking === false && { color: '#64748B' }]}>{doc.isWorking === false ? 'NGHỈ PHÉP (OFF)' : doc.slots}</Text>
                    </View>
                    <Text style={styles.doctorDate}>{doc.date}</Text>
                  </View>

                  <View style={[styles.expandBtn, isExpanded && styles.expandBtnActive]}>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Time Slots */}
                {isExpanded && (
                  <View style={styles.expandedSection}>
                    {doc.isWorking === false ? (
                      <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={24} color="#94A3B8" />
                        <Text style={{ marginTop: 6, fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                          Bác sĩ {doc.name} nghỉ khám ngày này. Vui lòng chọn ngày khác.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.expandedHeader}>
                          <Ionicons name="time-outline" size={16} color={COLORS.text} />
                          <Text style={styles.expandedHeaderText}>Chọn khung giờ khám</Text>
                        </View>
                        <View style={styles.slotsGrid}>
                          {doc.timeSlots && doc.timeSlots.map((time: string, idx: number) => (
                            <TouchableOpacity 
                              key={idx} 
                              style={[styles.timeSlotBtn, SHADOWS.input]}
                              onPress={() => {
                                const isOwnerSelected = !selectedProfile || selectedProfile.isOwner || selectedProfile.relationship === 'Bản thân';
                                navigation.navigate('ConfirmBooking', {
                                  type: 'doctor',
                                  doctorId: doc.id,
                                  doctorName: `${doc.title} ${doc.name}`,
                                  specialty: selectedSpecialty,
                                  date: doc.date,
                                  time: time,
                                  price: '250.000đ',
                                  memberId: isOwnerSelected ? undefined : selectedProfile?.realId,
                                  profileName: selectedProfile?.name,
                                  profileRelationship: selectedProfile?.relationship,
                                });
                              }}
                            >
                              <Text style={styles.timeSlotText}>{time}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}</>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Specialty Selection Modal (Modernized) */}
      <Modal
        visible={isSpecialtyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSpecialtyModalVisible(false)}>
          <View style={[styles.modalContent, SHADOWS.card]} onStartShouldSetResponder={() => true}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Chuyên khoa</Text>
              <TouchableOpacity onPress={() => setSpecialtyModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={apiSpecialties.length > 0 ? apiSpecialties : SPECIALTIES}
              keyExtractor={(item: any) => item.specialtyId ? String(item.specialtyId) : item.name}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.specialtyListContent}
              renderItem={({ item }) => {
                const isSelected = selectedSpecialty === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.specialtyOption, isSelected && styles.specialtyOptionActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedSpecialty(item.name);
                      setSelectedSpecialtyId((item as any).specialtyId);
                      setSpecialtyModalVisible(false);
                    }}
                  >
                    <View style={styles.specialtyRowLeft}>
                      <View style={[styles.specialtyIconBox, isSelected && styles.specialtyIconBoxActive]}>
                        <FontAwesome5 
                          name={item.icon as any} 
                          size={18} 
                          color={isSelected ? '#fff' : COLORS.primary} 
                        />
                      </View>
                      <Text style={[
                        styles.specialtyOptionText, 
                        isSelected && styles.specialtyOptionTextActive
                      ]}>
                        {item.name}
                      </Text>
                    </View>
                    
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Selection Modal: Bản thân | Người thân */}
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfileModalVisible(false)}>
          <View style={[styles.modalContent, SHADOWS.card]} onStartShouldSetResponder={() => true}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đặt lịch cho ai?</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selfProfile ? [selfProfile, ...familyProfiles] : familyProfiles}
              keyExtractor={(item: any) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.specialtyListContent}
              renderItem={({ item }) => {
                const isSelected = (selectedProfile?.id ?? selfProfile?.id) === item.id;
                const isSelf = item.relationship === 'Bản thân';
                return (
                  <TouchableOpacity
                    style={[styles.specialtyOption, isSelected && styles.specialtyOptionActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedProfileId(item.id);
                      setProfileModalVisible(false);
                    }}
                  >
                    <View style={styles.specialtyRowLeft}>
                      <View style={[styles.specialtyIconBox, isSelected && styles.specialtyIconBoxActive]}>
                        <Ionicons
                          name={isSelf ? 'person' : 'people'}
                          size={18}
                          color={isSelected ? '#fff' : COLORS.primary}
                        />
                      </View>
                      <View>
                        <Text style={[styles.specialtyOptionText, isSelected && styles.specialtyOptionTextActive]}>
                          {isSelf ? 'Bản thân' : item.name}
                        </Text>
                        {!isSelf && <Text style={styles.profileRelationText}>{item.relationship}</Text>}
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <DraggableChat onPress={() => navigation.navigate('AIChat')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  bookingTabs: {
    flexDirection: 'row',
    backgroundColor: '#F0F5FF',
    borderRadius: 25,
    padding: 4,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  bookingTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  bookingTabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.placeholder,
  },
  bookingTabTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  dropdownWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    maxWidth: 170,
  },
  dropdownText: {
    fontSize: 13,
    color: COLORS.text,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendarWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    width: '100%',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    width: '14.28%', // 100% / 7
    alignItems: 'center',
    marginBottom: 10,
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCircleActive: {
    backgroundColor: '#D3D3D3',
  },
  dateText: {
    fontSize: 15,
    color: COLORS.text,
  },
  dateTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  dateTextPast: {
    color: '#D0D0D0', // Gray out past dates
  },
  activeIndicatorBtn: {
    position: 'absolute',
    bottom: -22,
    zIndex: 10,
    padding: 5,
  },
  activeIndicator: {
    // Styling icon
  },
  collapseWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 5,
  },
  collapseBtn: {
    padding: 5,
  },
  doctorList: {
    gap: 16,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorImgPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  doctorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A4A4A',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  slotBadge: {
    backgroundColor: '#6EE7B7', // Green
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  slotBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  doctorDate: {
    fontSize: 11,
    color: COLORS.text,
  },
  expandBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6', // Blue
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  expandBtnActive: {
    backgroundColor: '#3B82F6',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  expandedHeaderText: {
    fontSize: 13,
    color: COLORS.text,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  timeSlotBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  timeSlotText: {
    fontSize: 13,
    color: COLORS.text,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 24,
    maxHeight: '75%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  specialtyListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  specialtyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  specialtyOptionActive: {
    backgroundColor: '#F0F5FF',
    borderColor: '#D6E4FF',
  },
  specialtyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialtyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  specialtyIconBoxActive: {
    backgroundColor: COLORS.primary,
  },
  specialtyOptionText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  specialtyOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  profileRelationText: {
    fontSize: 12,
    color: COLORS.placeholder,
    marginTop: 2,
  },
});

export default BookingScreen;
