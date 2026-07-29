import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, FlatList, Animated, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import DraggableChat from '../components/DraggableChat';
import { useSettings } from '../context/SettingsContext';
import { apiAppointment, clearApiCache } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SPECIALTIES = [
  { nameKey: 'general_internal', icon: 'stethoscope' },
  { nameKey: 'pediatrics', icon: 'baby' },
  { nameKey: 'obstetrics', icon: 'female' },
  { nameKey: 'musculoskeletal', icon: 'bone' },
  { nameKey: 'cardiology', icon: 'heartbeat' },
  { nameKey: 'neurology', icon: 'brain' },
  { nameKey: 'dermatology', icon: 'hand-sparkles' },
];

const MOCK_APPOINTMENTS = [
  {
    id: 1001,
    dateString: '2026-07-26',
    specialtyKey: 'general_internal',
    doctor: 'BS. CKII Nguyễn Văn A',
    time: '9:30 - 10:30',
    statusKey: 'confirmed',
    statusColor: '#22C55E',
    isUpcoming: true,
  },
  {
    id: 1002,
    dateString: '2026-07-21',
    specialtyKey: 'pediatrics',
    doctor: 'BS. CKI Lê Thị B',
    time: '14:00 - 15:00',
    statusKey: 'completed',
    statusColor: '#3B82F6',
    isUpcoming: false,
  },
  {
    id: 1003,
    dateString: '2026-05-15',
    specialtyKey: 'dermatology',
    doctor: 'BS. CKI Phạm Thị D',
    time: '08:30 - 09:30',
    statusKey: 'completed',
    statusColor: '#3B82F6',
    isUpcoming: false,
  },
  {
    id: 1004,
    dateString: '2025-11-20',
    specialtyKey: 'obstetrics',
    doctor: 'TS. BS Đỗ Phương Hạnh',
    time: '10:00 - 11:00',
    statusKey: 'cancelled',
    statusColor: '#EF4444',
    isUpcoming: false,
  },
];

// --- Helper Functions for Calendar ---
const getNormalizedDay = (dayIndex: number) => (dayIndex === 0 ? 6 : dayIndex - 1);

const generateMonthGrid = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startingEmptySlots = getNormalizedDay(firstDayOfMonth);

  const grid = [];
  // Add empty slots for the beginning of the month
  for (let i = 0; i < startingEmptySlots; i++) {
    grid.push(null);
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(new Date(year, month, i));
  }
  return grid;
};

const CalendarScreen = ({ navigation }: any) => {
  // State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  const [isSpecialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState('choose_specialty');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const { isDarkMode, t } = useSettings();
  const { currentUser } = useAuth();
  const [apiAppointments, setApiAppointments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [currentUser?.patientId])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearApiCache('/appointments');
    await fetchAppointments();
    setRefreshing(false);
  }, [currentUser?.patientId]);

  const fetchAppointments = async () => {
    try {
      if (!currentUser?.patientId) {
        setApiAppointments([]);
        return;
      }
      const targetPatientId = currentUser.patientId;
      const data = await apiAppointment.getPatientAppointments(targetPatientId);
      if (data && Array.isArray(data)) {
        setApiAppointments(data);
      } else {
        setApiAppointments([]);
      }
    } catch (e) {
      console.log('Error fetching appointments in CalendarScreen:', e);
      setApiAppointments([]);
    }
  };

  const combinedAppointments = useMemo(() => {
    const formattedApi = apiAppointments.map(app => {
      let specialty = app.specialtyName || app.specialtyKey;
      let dateStr = app.date || app.createdAt || '26/07/2026';
      let timeStr = app.timeSlot || '08:30 - 09:30';

      // Parse specialty, date, and time directly from reason field to ensure full accuracy with SQL data
      if (app.reason && typeof app.reason === 'string') {
        if (app.reason.includes('-')) {
          const specPart = app.reason.split('-')[0].trim();
          if (specPart) specialty = specPart;
        }
        const dateMatch = app.reason.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
        if (dateMatch && dateMatch[1]) dateStr = dateMatch[1];

        const timeMatch = app.reason.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/);
        if (timeMatch && timeMatch[1]) timeStr = timeMatch[1];
      }

      // Fallback identification for specialty if still missing or generic
      if (!specialty || specialty === 'Khám tổng quát') {
        if (app.reason && app.reason.includes('Cơ xương khớp')) specialty = 'Cơ xương khớp';
        else if (app.reason && app.reason.includes('Nội tổng quát')) specialty = 'Nội tổng quát';
        else specialty = specialty || 'Khám chuyên khoa';
      }

      const isPkg = app.isPackage || app.specialtyName === 'Gói Khám Sức Khỏe' || app.doctorName === 'Gói Khám Sức Khỏe' || (app.reason && (app.reason.includes('Tầm soát') || app.reason.includes('Khám Tổng Quát') || app.reason.includes('Gói khám'))) || false;

      // Clean doctor name - extract only the name part (remove degree prefix if it contains specialty info)
      let doctor = app.doctorName || '';
      if (isPkg || doctor === 'Gói Khám Sức Khỏe') {
        doctor = '';
      } else {
        const bsMatch = doctor.match(/(?:ThS\.|BS\.|TS\.|GS\.|PGS\.).*/);
        if (bsMatch) {
          doctor = bsMatch[0].trim();
        }
        const nameOnly = doctor.replace(/^(?:ThS\.|BS\.|TS\.|GS\.|PGS\.)\s*(?:CKI{1,2}\s*|CKII\s*|BSCK[12]\s*)?/i, '').trim();
        doctor = nameOnly || doctor || 'Bác sĩ chuyên khoa';
      }

      // Format dateString to YYYY-MM-DD for calendar compatibility
      let formattedDateString = '2026-07-26';
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          formattedDateString = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (typeof dateStr === 'string' && dateStr.includes('-')) {
        formattedDateString = dateStr.substring(0, 10);
      }

      // Handle status and tabs (PostgreSQL statusId: 1/2=Confirmed, 3=InProgress, 4=Completed, 5=Cancelled, 6=NoShow)
      let statusKey = 'confirmed';
      let statusColor = '#22C55E';
      let isUpcoming = true;

      if (app.statusId === 5 || app.status === 'Cancelled' || app.status === 'cancelled') {
        statusKey = 'cancelled';
        statusColor = '#EF4444';
        isUpcoming = false;
      } else if (app.statusId === 4 || app.status === 'Completed' || app.status === 'completed') {
        statusKey = 'completed';
        statusColor = '#3B82F6';
        isUpcoming = false;
      } else if (app.statusId === 6 || app.status === 'NoShow' || app.status === 'noshow' || app.status === 'Expired' || app.status === 'expired' || app.status === 'Quá hạn') {
        statusKey = 'noshow';
        statusColor = '#F97316';
        isUpcoming = false;
      } else if (app.statusId === 3 || app.status === 'InProgress' || app.status === 'in_progress') {
        statusKey = 'in_progress';
        statusColor = '#6366F1';
        isUpcoming = true;
      }

      // Format display date to DD/MM/YYYY for user-friendly display
      let displayDate = formattedDateString;
      if (formattedDateString && formattedDateString.includes('-')) {
        const dp = formattedDateString.split('-');
        if (dp.length === 3) displayDate = `${dp[2]}/${dp[1]}/${dp[0]}`;
      }

      return {
        id: app.appointmentId || app.id || Math.random(),
        dateString: formattedDateString,
        displayDate: displayDate,
        specialtyKey: specialty,
        doctor: doctor,
        time: timeStr,
        statusKey: statusKey,
        statusColor: statusColor,
        clinicRoom: isPkg ? '' : (app.clinicRoom || 'Phòng Khám Chuyên Khoa'),
        fee: app.fee || '250.000đ',
        isUpcoming: isUpcoming,
        isPackage: isPkg,
      };
    });

    return formattedApi;
  }, [apiAppointments]);

  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Derived calendar data
  const monthGrid = useMemo(() => {
    return generateMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  const weekGrid = useMemo(() => {
    // Find the week that contains the selected date (or the 1st of the month if selected date is in another month)
    const dateToFind = selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear()
      ? selectedDate
      : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const dateIndex = monthGrid.findIndex(d => d && d.getDate() === dateToFind.getDate());
    const weekStartIndex = Math.floor((dateIndex === -1 ? 0 : dateIndex) / 7) * 7;

    // Return exactly 7 items (padding with null if necessary)
    const week = monthGrid.slice(weekStartIndex, weekStartIndex + 7);
    while (week.length < 7) week.push(null);
    return week;
  }, [monthGrid, selectedDate, currentMonth]);

  // Handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    if (date >= today) {
      setSelectedDate(date);
      setIsExpanded(false); 
    }
  };

  const toggleCalendar = () => setIsExpanded(!isExpanded);

  // Render individual date circle
  const renderDateItem = (date: Date | null, index: number) => {
    if (!date) return <View key={`empty-${index}`} style={styles.dateCol} />;

    const isPast = date < today;
    const isSelected = date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();

    return (
      <View key={date.toISOString()} style={styles.dateCol}>
        <TouchableOpacity
          style={[
            styles.dateCircle, 
            isSelected && styles.dateCircleActive,
            isSelected && isDarkMode && { backgroundColor: '#4B5563' },
            isDarkMode && !isSelected && { backgroundColor: '#374151' }
          ]}
          activeOpacity={0.7}
          onPress={() => handleSelectDate(date)}
          disabled={isPast}
        >
          <Text style={[
            styles.dateText,
            isSelected && styles.dateTextActive,
            isPast && styles.dateTextPast,
            !isSelected && !isPast && isDarkMode && { color: '#F3F4F6' }
          ]}>
            {date.getDate()}
          </Text>
        </TouchableOpacity>
        {/* Only show the chevron down on the selected date if the calendar is NOT expanded */}
        {isSelected && !isExpanded && (
          <TouchableOpacity onPress={toggleCalendar} style={styles.activeIndicatorBtn}>
            <Ionicons name="chevron-down" size={20} color={isDarkMode ? '#F3F4F6' : COLORS.text} style={styles.activeIndicator} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#1F2937' }]} edges={['top']}>
      {/* --- HEADER --- */}
      <View style={[styles.topHeader, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <Text style={[styles.topHeaderTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('calendar')}</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >

        {/* Header - Logo */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={[styles.logo, SHADOWS.card]}
            resizeMode="contain"
          />
        </View>

        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <Text style={[styles.monthText, isDarkMode && { color: '#F3F4F6' }]}>
            {t('month')} {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
          </Text>
          <View style={styles.monthControls}>
            <TouchableOpacity style={[styles.monthBtn, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]} activeOpacity={0.7} onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={20} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.monthBtn, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]} activeOpacity={0.7} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarWrapper}>
          <View style={[styles.calendarCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
            <View style={styles.daysRow}>
              {WEEK_DAYS.map((day, index) => (
                <Text key={index} style={[styles.dayText, isDarkMode && { color: '#9CA3AF' }]}>{day}</Text>
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
                    <Ionicons name="chevron-up" size={20} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
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
                      <Ionicons name="chevron-down" size={20} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Đặt lịch khám Section */}
        <Text style={[styles.sectionTitle, isDarkMode && { color: '#D1D5DB' }]}>{t('book_appointment')}</Text>
        <View style={[styles.card, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
          {/* Option 1: Theo chuyên khoa */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => setSpecialtyModalVisible(true)}
          >
            <View style={[styles.smartIconBox, isDarkMode && { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
              <FontAwesome5 name="hospital-user" size={20} color={isDarkMode ? '#60A5FA' : COLORS.primary} />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.actionTitleText, isDarkMode && { color: '#F3F4F6' }]}>Đặt khám theo Chuyên khoa</Text>
              <Text style={[styles.actionSubText, isDarkMode && { color: '#9CA3AF' }]} numberOfLines={1}>Nội tổng quát, Tim mạch, Cơ xương khớp...</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.text} />
          </TouchableOpacity>

          <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />

          {/* Option 2: Theo bác sĩ */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Booking')}
          >
            <View style={[styles.smartIconBox, isDarkMode && { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
              <FontAwesome5 name="user-md" size={22} color={isDarkMode ? '#60A5FA' : COLORS.primary} />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.actionTitleText, isDarkMode && { color: '#F3F4F6' }]}>Đặt khám theo Bác sĩ</Text>
              <Text style={[styles.actionSubText, isDarkMode && { color: '#9CA3AF' }]} numberOfLines={1}>Chọn theo Tiến sĩ, Bác sĩ CKII, Thạc sĩ...</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.text} />
          </TouchableOpacity>

          <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />

          {/* Option 3: Gói khám */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Packages')}
          >
            <View style={[styles.smartIconBox, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
              <FontAwesome5 name="medkit" size={20} color="#10B981" />
            </View>
            <View style={styles.actionTextBox}>
              <Text style={[styles.actionTitleText, isDarkMode && { color: '#F3F4F6' }]}>Đăng ký Gói khám Sức khỏe</Text>
              <Text style={[styles.actionSubText, isDarkMode && { color: '#9CA3AF' }]} numberOfLines={1}>Tầm soát ung thư, khám tổng quát Nam & Nữ...</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Quản lý lịch khám Section */}
        <Text style={[styles.sectionTitle, isDarkMode && { color: '#D1D5DB' }]}>{t('manage_appt')}</Text>
        <View style={[styles.card, SHADOWS.card, { marginBottom: 120, paddingHorizontal: 0 }, isDarkMode && { backgroundColor: '#1F2937' }]}>

          {/* Tabs */}
          <View style={[styles.tabsContainer, isDarkMode && { borderBottomColor: '#374151' }]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[
                styles.tabText, 
                isDarkMode && { color: '#9CA3AF' },
                activeTab === 'upcoming' && [styles.tabTextActive, isDarkMode && { color: '#60A5FA' }]
              ]}>{t('upcoming')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[
                styles.tabText, 
                isDarkMode && { color: '#9CA3AF' },
                activeTab === 'history' && [styles.tabTextActive, isDarkMode && { color: '#60A5FA' }]
              ]}>{t('history')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            {activeTab === 'upcoming' ? (
              <>
                <Text style={[styles.managementDate, isDarkMode && { color: '#F3F4F6' }]}>
                  {t('calendar')} ngày{' '}
                  {String(selectedDate.getDate()).padStart(2, '0')}/
                  {String(selectedDate.getMonth() + 1).padStart(2, '0')}/
                  {selectedDate.getFullYear()}
                </Text>
                <Text style={[styles.managementClinic, isDarkMode && { color: '#9CA3AF' }]}>DTT HEALTHCARE</Text>
              </>
            ) : (
              <Text style={[styles.managementDate, { marginTop: 10, color: isDarkMode ? '#60A5FA' : COLORS.primary }]}>
                {t('medical_history')}
              </Text>
            )}
            <View style={[styles.dividerLight, isDarkMode && { backgroundColor: '#374151' }]} />

            {/* Filtered Appointments */}
            {(() => {
              const filteredAppointments = combinedAppointments.filter(app => {
                if (activeTab === 'upcoming') {
                  return app.isUpcoming;
                }
                return !app.isUpcoming;
              });

              if (filteredAppointments.length === 0) {
                return (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="calendar-clear-outline" size={48} color={isDarkMode ? '#4B5563' : "#D0D0D0"} />
                    <Text style={[styles.emptyStateText, isDarkMode && { color: '#9CA3AF' }]}>
                      {activeTab === 'upcoming'
                        ? t('no_appointments')
                        : t('no_history')}
                    </Text>
                  </View>
                );
              }

              return filteredAppointments.map(app => (
                <TouchableOpacity
                  key={app.id}
                  style={[styles.appointmentCardInner, isDarkMode && { backgroundColor: '#374151', borderBottomColor: '#4B5563' }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('AppointmentDetail', {
                    isHistory: activeTab === 'history',
                    appointment: app
                  })}
                >
                  <View style={styles.appointmentHeader}>
                    <Text style={[styles.appointmentSpecialty, isDarkMode && { color: '#F3F4F6' }]}>
                      {t(app.specialtyKey) !== app.specialtyKey ? t(app.specialtyKey) : app.specialtyKey}
                    </Text>
                    <View style={styles.statusBadge}>
                      <View style={[styles.statusDot, { backgroundColor: app.statusColor }]} />
                      <Text style={[styles.statusText, { color: app.statusColor }]}>
                        {t(app.statusKey) !== app.statusKey ? t(app.statusKey) : (app.statusKey === 'confirmed' ? 'Đã xác nhận' : app.statusKey === 'completed' ? 'Hoàn thành' : app.statusKey === 'in_progress' ? 'Đang khám' : app.statusKey === 'noshow' ? 'Bỏ khám (Quá hạn)' : 'Đã hủy')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appointmentDetails}>
                    <View style={{ flex: 1, gap: 6 }}>
                      {app.doctor ? (
                        <View style={styles.detailRow}>
                          <FontAwesome5 name="user-md" size={12} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
                          <Text style={[styles.detailText, isDarkMode && { color: '#9CA3AF' }]}>{app.doctor}</Text>
                        </View>
                      ) : null}
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={14} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
                        <Text style={[styles.detailText, isDarkMode && { color: '#9CA3AF' }]}>
                          {`${app.displayDate || app.dateString} | ${app.time}`}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={isDarkMode ? '#9CA3AF' : COLORS.text} />
                  </View>
                </TouchableOpacity>
              ));
            })()}
          </View>
        </View>

      </ScrollView>

      {/* Specialty Selection Modal (Modernized) */}
      <Modal
        visible={isSpecialtyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSpecialtyModalVisible(false)}>
          <View style={[styles.modalContent, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]} onStartShouldSetResponder={() => true}>

            <View style={[styles.modalHeader, isDarkMode && { borderBottomColor: '#374151' }]}>
              <Text style={[styles.modalTitle, isDarkMode && { color: '#F3F4F6' }]}>Chọn Chuyên khoa</Text>
              <TouchableOpacity onPress={() => setSpecialtyModalVisible(false)} style={[styles.modalCloseBtn, isDarkMode && { backgroundColor: '#374151' }]}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={SPECIALTIES}
              keyExtractor={(item) => item.nameKey}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.specialtyListContent}
              renderItem={({ item }) => {
                const isSelected = selectedSpecialty === item.nameKey;
                return (
                  <TouchableOpacity
                    style={[
                      styles.specialtyOption, 
                      isSelected && styles.specialtyOptionActive,
                      isDarkMode && !isSelected && { backgroundColor: '#374151' }
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedSpecialty(item.nameKey);
                      setSpecialtyModalVisible(false);
                      navigation.navigate('Booking', { specialty: t(item.nameKey), specialtyName: t(item.nameKey) });
                    }}
                  >
                    <View style={styles.specialtyRowLeft}>
                      <View style={[
                        styles.specialtyIconBox, 
                        isSelected && styles.specialtyIconBoxActive,
                        isDarkMode && !isSelected && { backgroundColor: '#1F2937' }
                      ]}>
                        <FontAwesome5
                          name={item.icon as any}
                          size={18}
                          color={isSelected ? '#fff' : (isDarkMode ? '#60A5FA' : COLORS.primary)}
                        />
                      </View>
                      <Text style={[
                        styles.specialtyOptionText,
                        isSelected && styles.specialtyOptionTextActive,
                        isDarkMode && !isSelected && { color: '#F3F4F6' }
                      ]}>
                        {t(item.nameKey)}
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

      <DraggableChat />

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <View style={styles.floatingButtonsContainer}>
          <TouchableOpacity
            style={[styles.floatingScrollTopButton, SHADOWS.card]}
            activeOpacity={0.8}
            onPress={scrollToTop}
          >
            <Ionicons name="arrow-up" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  monthSelector: {
    alignItems: 'center',
    marginBottom: 10,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  monthControls: {
    flexDirection: 'row',
    gap: 16,
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
    backgroundColor: '#D3D3D3', // Gray background for selected
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  dropdownWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.text,
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stethoscopeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  smartIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextBox: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  actionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionSubText: {
    fontSize: 12.5,
    color: COLORS.placeholder,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#404040',
    marginVertical: 4,
  },
  managementDate: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  managementClinic: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: 12,
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '60%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  appointmentCardInner: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20, // Khoảng cách rộng rã giữa các thẻ lịch khám
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  appointmentSpecialty: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  appointmentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.text,
  },
  // Management Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.placeholder,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.placeholder,
    textAlign: 'center',
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

  floatingButtonsContainer: { position: 'absolute', bottom: 100, right: 20 },
  floatingScrollTopButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#333', justifyContent: 'center', alignItems: 'center',
  },
});

export default CalendarScreen;
