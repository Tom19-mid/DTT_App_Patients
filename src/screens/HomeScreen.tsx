import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Pressable, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableChat from '../components/DraggableChat';
import SpecialtyBottomSheet from '../components/SpecialtyBottomSheet';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';

// ── Data ──────────────────────────────────────────────────────────────────────

const specialties = [
  { id: 1, nameKey: 'general_internal',   icon: 'stethoscope',   type: 'fa5' as const },
  { id: 2, nameKey: 'pediatrics',        icon: 'baby',          type: 'fa5' as const },
  { id: 3, nameKey: 'obstetrics', icon: 'human-female',  type: 'mci' as const },
  { id: 4, nameKey: 'musculoskeletal',  icon: 'bone',          type: 'fa5' as const },
  { id: 5, nameKey: 'cardiology',        icon: 'heartbeat',     type: 'fa5' as const },
  { id: 6, nameKey: 'neurology',       icon: 'brain',         type: 'fa5' as const },
  { id: 7, nameKey: 'dermatology',         icon: 'hand-sparkles', type: 'fa5' as const },
  { id: 8, nameKey: 'imaging', icon: 'bullseye', type: 'fa5' as const },
];

const services = [
  { id: 1, nameKey: 'lookup_results',     icon: 'file-medical-alt',    type: 'fa5' as const },
  { id: 2, nameKey: 'invoices',  icon: 'file-invoice-dollar', type: 'fa5' as const },
  { id: 3, nameKey: 'guidelines', icon: 'book-medical',        type: 'fa5' as const },
  { id: 4, nameKey: 'medical_info',    icon: 'clipboard-list',      type: 'fa5' as const },
];

// ── Icon renderer ─────────────────────────────────────────────────────────────
const renderIcon = (item: { icon: string; type: string }, size = 36) => {
  if (item.type === 'fa5')
    return <FontAwesome5 name={item.icon as any} size={size} color={COLORS.primary} />;
  return <MaterialCommunityIcons name={item.icon as any} size={size + 4} color={COLORS.primary} />;
};

const MOCK_PACKAGES = [
  { id: 1, titleKey: 'pkg_basic_male', price: '1.200.000đ', booked: '1.2k+', image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=300&q=80' },
  { id: 2, titleKey: 'pkg_basic_female', price: '1.450.000đ', booked: '2k+', image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80' },
  { id: 3, titleKey: 'pkg_cancer_screen', price: '2.500.000đ', booked: '500+', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80' },
  { id: 4, titleKey: 'pkg_heart', price: '1.800.000đ', booked: '800+', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80' },
];

// ── Component ─────────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }: any) => {
  const HAS_APPOINTMENTS = false; // Toggle this to true to see the upcoming appointment card
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<typeof specialties[0] | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { isVerified } = useAuth();
  const { showAlert } = useCustomAlert();
  const { language, setLanguage, isDarkMode, setIsDarkMode, t } = useSettings();

  const handleMedicalRecordNavigation = (initialTab: string) => {
    if (isVerified) {
      navigation.navigate('MedicalRecords', { initialTab });
    } else {
      showAlert({
        title: 'Từ chối truy cập',
        message: 'Vui lòng mang CCCD đến quầy lễ tân bệnh viện để xác thực tài khoản trước khi xem hồ sơ y tế.',
        type: 'error'
      });
    }
  };

  const scrollToTop = () => scrollViewRef.current?.scrollTo({ y: 0, animated: true });

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  };

  const handleLogout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const openBottomSheet = useCallback((specialty: typeof specialties[0]) => {
    setSelectedSpecialty(specialty);
    setSheetVisible(true);
  }, []);

  const closeBottomSheet = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => setSelectedSpecialty(null), 280);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#1F2937' }]}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.container, isDarkMode && { backgroundColor: '#111827' }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={[styles.iconButton, SHADOWS.input, isDarkMode && { backgroundColor: '#374151', elevation: 0, shadowOpacity: 0 }]}
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color={isDarkMode ? '#FCD34D' : COLORS.text} />
            </TouchableOpacity>
            <View style={styles.userGreeting}>
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarText}>TD</Text>
              </View>
              <View>
                <Text style={[styles.greetingText, isDarkMode && { color: '#9CA3AF' }]}>{t('hello')}</Text>
                <Text style={[styles.userNameText, isDarkMode && { color: '#F3F4F6' }]}>User (SĐT)</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerCenter}>
            <Image
              source={require('../../assets/logo.png')}
              style={[styles.logoImage, SHADOWS.input]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.langToggle, SHADOWS.input, isDarkMode && { backgroundColor: '#374151', elevation: 0, shadowOpacity: 0 }]}>
              <TouchableOpacity style={language === 'vi' ? styles.langBtnActive : styles.langBtnInactive} onPress={() => setLanguage('vi')}>
                <Text style={language === 'vi' ? styles.langTextActive : [styles.langTextInactive, isDarkMode && { color: '#D1D5DB' }]}>VI</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={language === 'en' ? styles.langBtnActive : styles.langBtnInactive} onPress={() => setLanguage('en')}>
                <Text style={language === 'en' ? styles.langTextActive : [styles.langTextInactive, isDarkMode && { color: '#D1D5DB' }]}>EN</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.iconButton, { marginTop: 25 }, SHADOWS.input, isDarkMode && { backgroundColor: '#374151', elevation: 0, shadowOpacity: 0 }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search Bar ── */}
        <View style={[styles.searchContainer, SHADOWS.input, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563', borderWidth: 0, elevation: 0, shadowOpacity: 0 }]}>
          <Ionicons name="search-outline" size={24} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDarkMode && { color: '#F3F4F6' }]}
            placeholder={t('search_placeholder')}
            placeholderTextColor={isDarkMode ? '#9CA3AF' : COLORS.placeholder}
          />
          <Ionicons name="mic-outline" size={24} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.micIcon} />
        </View>

        {/* ── Upcoming Appointment ── */}
        {HAS_APPOINTMENTS && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('upcoming_appointment')}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.appointmentCard, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AppointmentDetail')}
            >
              <View style={[styles.appointmentDateBox, isDarkMode && { backgroundColor: '#4B5563', borderColor: '#4B5563' }]}>
                <Text style={styles.appointmentDayNum}>26</Text>
                <Text style={styles.appointmentDayText}>T.6</Text>
              </View>
              
              <View style={styles.appointmentInfo}>
                <Text style={[styles.appointmentSpecialty, isDarkMode && { color: '#F3F4F6' }]}>{t('general_internal')}</Text>
                <View style={styles.appointmentDetailRow}>
                  <Ionicons name="person-outline" size={12} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
                  <Text style={[styles.appointmentDetailText, isDarkMode && { color: '#9CA3AF' }]}>{t('dr')} Nguyễn Văn A</Text>
                </View>
                <View style={styles.appointmentDetailRow}>
                  <Ionicons name="time-outline" size={12} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
                  <Text style={[styles.appointmentDetailText, isDarkMode && { color: '#9CA3AF' }]}>9:30 - 10:30</Text>
                </View>
              </View>

              <View style={styles.appointmentStatusCol}>
                <View style={styles.statusBadgeRow}>
                  <View style={styles.statusDotGreen} />
                  <Text style={styles.statusTextGreen}>{t('confirmed')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.appointmentChevron} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Specialties: 4-column GRID (tap to open sheet) ── */}
        <View style={styles.gridContainer}>
          {specialties.map((item) => {
            const keys = ['general_internal', 'pediatrics', 'obstetrics', 'musculoskeletal', 'cardiology', 'neurology', 'dermatology', 'imaging'];
            const nameKey = keys[item.id - 1];
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.gridItem,
                  pressed && styles.gridItemPressed,
                ]}
                onPress={() => openBottomSheet(item)}
              >
                <View style={[styles.iconBox, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}>
                  {renderIcon(item)}
                </View>
                <Text style={[styles.itemText, isDarkMode && { color: '#D1D5DB' }]}>{t(nameKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Featured Packages (Replaces Banner) ── */}
        <View style={styles.packagesSection}>
          <View style={styles.packagesHeaderWrapper}>
            <Text style={[styles.packagesSectionTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('featured_packages')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Packages')}>
              <Text style={styles.seeAllText}>{t('see_all')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packagesScroll}>
            {MOCK_PACKAGES.map((pkg) => (
              <TouchableOpacity key={pkg.id} style={[styles.packageCardWrapper, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]} activeOpacity={0.9} onPress={() => navigation.navigate('Packages', { selectedId: pkg.id })}>
                <View style={[styles.packageCardInner, isDarkMode && { backgroundColor: '#374151' }]}>
                  <Image source={{ uri: pkg.image }} style={styles.packageImage} />
                  <View style={styles.packageBadge}>
                    <Ionicons name="flame" size={10} color="#EF4444" />
                    <Text style={styles.packageBadgeText}>{pkg.booked.replace('+', '')}+ {t('booked')}</Text>
                  </View>
                  <View style={styles.packageInfo}>
                    <Text style={[styles.packageTitle, isDarkMode && { color: '#F3F4F6' }]} numberOfLines={2}>{t(pkg.titleKey)}</Text>
                    <Text style={styles.packagePrice}>{pkg.price}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Services Grid ── */}
        <View style={styles.gridContainer}>
          {services.map((item) => {
            const keys = ['test_results', 'receipts', 'info_guide', 'medical_info'];
            const nameKey = keys[item.id - 1];
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.gridItem,
                  pressed && styles.gridItemPressed,
                ]}
                onPress={() => {
                  if (item.id === 1) { // Tra cứu kết quả
                    handleMedicalRecordNavigation('xet-nghiem');
                  } else if (item.id === 2) { // Hóa đơn & Biên lai
                    handleMedicalRecordNavigation('hoa-don');
                  } else {
                    showAlert({ title: 'Thông báo', message: 'Tính năng đang được phát triển để kết nối CSDL.', type: 'info' });
                  }
                }}
              >
                <View style={[styles.iconBox, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}>
                  {renderIcon(item)}
                </View>
                <Text style={[styles.itemText, isDarkMode && { color: '#D1D5DB' }]}>{t(nameKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Medical Records (Hồ sơ sức khỏe) ── */}
        <View style={styles.recordsSection}>
          <Text style={[styles.sectionTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('medical_records')}</Text>
          <View style={styles.recordsGrid}>
            <TouchableOpacity 
              style={[styles.recordCard, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]} 
              activeOpacity={0.8}
              onPress={() => handleMedicalRecordNavigation('phieu-kham')}
            >
              <View style={[styles.recordIconBox, { backgroundColor: isDarkMode ? 'rgba(22, 163, 74, 0.2)' : '#F0FDF4' }]}>
                <Ionicons name="document-text" size={28} color={isDarkMode ? '#4ADE80' : '#16A34A'} />
              </View>
              <Text style={[styles.recordText, isDarkMode && { color: '#D1D5DB' }]}>{t('exam_ticket')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.recordCard, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]} 
              activeOpacity={0.8}
              onPress={() => handleMedicalRecordNavigation('toa-thuoc')}
            >
              <View style={[styles.recordIconBox, { backgroundColor: isDarkMode ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' }]}>
                <Ionicons name="medkit" size={28} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
              </View>
              <Text style={[styles.recordText, isDarkMode && { color: '#D1D5DB' }]}>{t('prescription')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.recordCard, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]} 
              activeOpacity={0.8}
              onPress={() => handleMedicalRecordNavigation('xet-nghiem')}
            >
              <View style={[styles.recordIconBox, { backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2' }]}>
                <Ionicons name="flask" size={28} color={isDarkMode ? '#F87171' : '#DC2626'} />
              </View>
              <Text style={[styles.recordText, isDarkMode && { color: '#D1D5DB' }]}>{t('tests')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.recordCard, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]} 
              activeOpacity={0.8}
              onPress={() => handleMedicalRecordNavigation('sieu-am')}
            >
              <View style={[styles.recordIconBox, { backgroundColor: isDarkMode ? 'rgba(217, 119, 6, 0.2)' : '#FFFBEB' }]}>
                <Ionicons name="scan" size={28} color={isDarkMode ? '#FBBF24' : '#D97706'} />
              </View>
              <Text style={[styles.recordText, isDarkMode && { color: '#D1D5DB' }]}>{t('ultrasound')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding for floating tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Floating Buttons ── */}
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

      <DraggableChat />

      {/* ── Specialty Bottom Sheet ── */}
      <SpecialtyBottomSheet
        visible={sheetVisible}
        specialty={selectedSpecialty}
        onClose={closeBottomSheet}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 15 },
  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginTop: 10, marginBottom: 20,
  },
  headerLeft:   { flex: 1, alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center', paddingTop: 10 },
  headerRight:  { flex: 1, alignItems: 'flex-end' },
  iconButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center',
  },
  userGreeting: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
  smallAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: '#E5E5E5',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  smallAvatarText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  greetingText:    { fontSize: 12, color: COLORS.text },
  userNameText:    { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  logoImage: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: '#E5E5E5',
  },
  langToggle: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderRadius: 25, padding: 4, alignItems: 'center',
  },
  langBtnActive:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
  langTextActive:  { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  divider:         { width: 1, height: 16, backgroundColor: '#E0E0E0' },
  langBtnInactive: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 },
  langTextInactive:{ fontSize: 14, color: COLORS.placeholder, fontWeight: 'bold' },
  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 25,
    paddingHorizontal: 15, height: 55, marginBottom: 25,
  },
  searchIcon:  { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  micIcon:     { marginLeft: 10 },
  // Specialty + Service grid
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 10,
  },
  gridItem: {
    width: '23%', alignItems: 'center', marginBottom: 20,
    borderRadius: 18,
  },
  gridItemPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  iconBox: {
    width: '100%', aspectRatio: 1, backgroundColor: COLORS.card,
    borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  itemText: { fontSize: 12, textAlign: 'center', color: COLORS.text, fontWeight: '500' },

  // Upcoming Appointment Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  appointmentDateBox: {
    width: 60,
    height: 70,
    backgroundColor: '#F0F5FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appointmentDayNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  appointmentDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentSpecialty: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  appointmentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  appointmentDetailText: {
    fontSize: 12,
    color: COLORS.placeholder,
  },
  appointmentStatusCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusTextGreen: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  appointmentChevron: {
    marginTop: 'auto',
  },
  // Packages Styles
  packagesSection: {
    marginBottom: 25,
    marginHorizontal: -15, // To bleed to edges
  },
  packagesHeaderWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 15, // Put padding back for header
  },
  packagesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  packagesScroll: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 16,
  },
  packageCardWrapper: {
    width: 230,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 5,
  },
  packageCardInner: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
  },
  packageImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#EFF6FF',
    resizeMode: 'cover',
  },
  packageBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FFF0F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  packageBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  packageInfo: {
    padding: 14,
  },
  packageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  packagePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  // Medical Records Section
  recordsSection: {
    marginTop: 12,
  },
  recordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  recordCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  recordIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Floating
  floatingButtonsContainer: { position: 'absolute', bottom: 100, right: 20 },
  floatingScrollTopButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#333', justifyContent: 'center', alignItems: 'center',
  },
});
