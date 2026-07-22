import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Animated, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_PACKAGES = [
  { 
    id: 1, 
    title: 'Khám Tổng Quát Cơ Bản - Nam', 
    price: '1.200.000đ', 
    booked: '1.2k+', 
    image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=300&q=80',
    description: 'Gói khám được thiết kế chuyên biệt cho nam giới, giúp tầm soát và phát hiện sớm các bệnh lý phổ biến.',
    details: [
      'Khám nội tổng quát (Đo huyết áp, nhịp tim, BMI...)',
      'Xét nghiệm máu cơ bản (Đường huyết, mỡ máu, chức năng gan thận)',
      'Siêu âm ổ bụng tổng quát',
      'Chụp X-quang tim phổi thẳng',
      'Tư vấn kết quả với bác sĩ chuyên khoa'
    ]
  },
  { 
    id: 2, 
    title: 'Khám Tổng Quát Cơ Bản - Nữ', 
    price: '1.450.000đ', 
    booked: '2k+', 
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80',
    description: 'Gói khám toàn diện dành cho nữ giới, bao gồm các chỉ số sức khỏe tổng quát và siêu âm tuyến vú/phụ khoa cơ bản.',
    details: [
      'Khám nội tổng quát và Phụ khoa cơ bản',
      'Xét nghiệm máu và nước tiểu',
      'Siêu âm ổ bụng, siêu âm tuyến vú',
      'Tầm soát tế bào ung thư cổ tử cung (Pap smear)',
      'Tư vấn kết quả và phác đồ theo dõi'
    ]
  },
  { 
    id: 3, 
    title: 'Tầm soát Ung thư Vú & Cổ tử cung', 
    price: '2.500.000đ', 
    booked: '500+', 
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80',
    description: 'Tầm soát chuyên sâu giúp phát hiện sớm các dấu hiệu của ung thư vú và ung thư cổ tử cung ở phụ nữ.',
    details: [
      'Khám phụ khoa chuyên sâu',
      'Chụp nhũ ảnh (Mammography) 2 bên',
      'Xét nghiệm HPV DNA và Pap Liquid',
      'Siêu âm tử cung phần phụ',
      'Tư vấn nguy cơ và cách phòng ngừa'
    ]
  },
  { 
    id: 4, 
    title: 'Tầm soát Bệnh lý Tim mạch', 
    price: '1.800.000đ', 
    booked: '800+', 
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
    description: 'Gói tầm soát dành cho người có nguy cơ cao về tim mạch, huyết áp, giúp ngăn ngừa biến chứng nguy hiểm.',
    details: [
      'Đo điện tâm đồ (ECG) lúc nghỉ',
      'Siêu âm tim màu (Echocardiography)',
      'Xét nghiệm bộ mỡ máu (Cholesterol, Triglyceride, HDL, LDL)',
      'Đo chức năng đông máu',
      'Tư vấn chế độ dinh dưỡng và sinh hoạt'
    ]
  },
];

const PackagesScreen = ({ route, navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { selectedId } = route.params || {};
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Auto-open modal if a package was passed via navigation params
  useEffect(() => {
    if (selectedId) {
      const pkg = MOCK_PACKAGES.find(p => p.id === selectedId);
      if (pkg) {
        handleOpenDetail(pkg);
      }
    }
  }, [selectedId]);

  const handleOpenDetail = (pkg: any) => {
    setSelectedPackage(pkg);
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const handleCloseDetail = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedPackage(null);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('health_packages')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        
        {/* ── Booking Type Tabs ── */}
        <View style={[styles.bookingTabs, isDarkMode && { backgroundColor: '#1F2937' }]}>
          <TouchableOpacity 
            style={styles.bookingTab} 
            activeOpacity={0.7} 
            onPress={() => navigation.navigate('Booking')}
          >
            <Text style={[styles.bookingTabText, isDarkMode && { color: '#9CA3AF' }]}>{t('specialty_exam')}</Text>
          </TouchableOpacity>
          <View style={[styles.bookingTab, styles.bookingTabActive]}>
            <Text style={styles.bookingTabTextActive}>{t('package_exam')}</Text>
          </View>
        </View>

        <Text style={[styles.pageSubtitle, isDarkMode && { color: '#9CA3AF' }]}>{t('package_desc_title')}</Text>
        
        {MOCK_PACKAGES.map((pkg) => (
          <TouchableOpacity 
            key={pkg.id} 
            style={[styles.packageCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]} 
            activeOpacity={0.9} 
            onPress={() => handleOpenDetail(pkg)}
          >
            <Image source={{ uri: pkg.image }} style={styles.packageImage} />
            <View style={styles.packageBadge}>
              <Ionicons name="flame" size={12} color="#EF4444" />
              <Text style={styles.packageBadgeText}>{pkg.booked.replace('đã đặt', '').trim()} {t('booked')}</Text>
            </View>
            <View style={styles.packageInfo}>
              <Text style={[styles.packageTitle, isDarkMode && { color: '#F3F4F6' }]}>{pkg.title}</Text>
              <Text style={[styles.packageDescription, isDarkMode && { color: '#9CA3AF' }]} numberOfLines={2}>{pkg.description}</Text>
              <View style={styles.packageFooter}>
                <Text style={styles.packagePrice}>{pkg.price}</Text>
                <TouchableOpacity style={styles.bookBtnSmall} onPress={() => handleOpenDetail(pkg)}>
                  <Text style={styles.bookBtnSmallText}>{t('details')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Detail Bottom Sheet Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={handleCloseDetail}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={handleCloseDetail}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, isDarkMode && { backgroundColor: '#111827' }, { transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.handleBar, isDarkMode && { backgroundColor: '#374151' }]} />
          
          {selectedPackage && (
            <View style={styles.sheetContent}>
              <View style={[styles.sheetHeader, isDarkMode && { borderBottomColor: '#374151' }]}>
                <Text style={[styles.sheetTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('package_detail')}</Text>
                <TouchableOpacity onPress={handleCloseDetail} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <Image source={{ uri: selectedPackage.image }} style={styles.detailImage} />
                <View style={styles.detailBody}>
                  <Text style={[styles.detailTitle, isDarkMode && { color: '#F3F4F6' }]}>{selectedPackage.title}</Text>
                  <Text style={styles.detailPrice}>{selectedPackage.price}</Text>
                  
                  <View style={styles.infoBadgeRow}>
                    <View style={styles.infoBadge}>
                      <Ionicons name="people" size={14} color={COLORS.primary} />
                      <Text style={styles.infoBadgeText}>{selectedPackage.booked.replace('đã đặt', '').trim()} {t('booked')}</Text>
                    </View>
                    <View style={styles.infoBadge}>
                      <Ionicons name="time" size={14} color={COLORS.primary} />
                      <Text style={styles.infoBadgeText}>{t('has_results_today')}</Text>
                    </View>
                  </View>

                  <Text style={[styles.sectionHeader, isDarkMode && { color: '#F3F4F6' }]}>{t('general_desc')}</Text>
                  <Text style={[styles.detailDesc, isDarkMode && { color: '#9CA3AF' }]}>{selectedPackage.description}</Text>

                  <Text style={[styles.sectionHeader, isDarkMode && { color: '#F3F4F6' }]}>{t('service_includes')}</Text>
                  <View style={styles.serviceList}>
                    {selectedPackage.details.map((item: string, index: number) => (
                      <View key={index} style={styles.serviceItem}>
                        <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                        <Text style={[styles.serviceItemText, isDarkMode && { color: '#D1D5DB' }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              <View style={[styles.bottomAction, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937', borderTopColor: '#374151' }]}>
                <View>
                  <Text style={styles.totalLabel}>{t('total_cost')}</Text>
                  <Text style={styles.totalPrice}>{selectedPackage.price}</Text>
                </View>
                <TouchableOpacity style={styles.mainBookBtn} onPress={() => {
                  handleCloseDetail();
                  setTimeout(() => {
                    navigation.navigate('ConfirmBooking', { 
                      type: 'package',
                      packageName: selectedPackage.title,
                      price: selectedPackage.price
                    });
                  }, 300);
                }}>
                  <Text style={styles.mainBookBtnText}>{t('book_package')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
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
  
  listContainer: { padding: 16, gap: 16 },
  pageSubtitle: { fontSize: 14, color: COLORS.placeholder, marginBottom: 8, lineHeight: 20 },
  
  // Tabs
  bookingTabs: {
    flexDirection: 'row', backgroundColor: '#F0F5FF', borderRadius: 25,
    padding: 4, marginBottom: 16,
  },
  bookingTab: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20,
  },
  bookingTabActive: {
    backgroundColor: COLORS.primary, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,
    shadowRadius: 8, elevation: 4,
  },
  bookingTabText: { fontSize: 14, fontWeight: '600', color: COLORS.placeholder },
  bookingTabTextActive: { fontSize: 14, fontWeight: 'bold', color: '#fff' },

  packageCard: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
  },
  packageImage: { width: '100%', height: 160, resizeMode: 'cover' },
  packageBadge: {
    position: 'absolute', top: 12, left: 12, backgroundColor: '#FFF0F0',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, gap: 4,
  },
  packageBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#EF4444' },
  packageInfo: { padding: 16 },
  packageTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  packageDescription: { fontSize: 13, color: COLORS.placeholder, lineHeight: 18, marginBottom: 12 },
  packageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  packagePrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  bookBtnSmall: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  bookBtnSmallText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },

  // Bottom Sheet Modal
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SCREEN_HEIGHT * 0.85, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  handleBar: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0D0D0',
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  sheetContent: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0F0',
    justifyContent: 'center', alignItems: 'center',
  },
  detailImage: { width: '100%', height: 220, resizeMode: 'cover' },
  detailBody: { padding: 20 },
  detailTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  detailPrice: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, marginBottom: 16 },
  
  infoBadgeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  infoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  infoBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, marginTop: 10 },
  detailDesc: { fontSize: 14, color: COLORS.placeholder, lineHeight: 22, marginBottom: 16 },
  
  serviceList: { gap: 12 },
  serviceItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  serviceItemText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },

  bottomAction: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 30, // For iOS home indicator
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  totalLabel: { fontSize: 12, color: COLORS.placeholder, marginBottom: 2 },
  totalPrice: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  mainBookBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 25,
  },
  mainBookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default PackagesScreen;
