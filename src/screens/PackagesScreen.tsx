import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Animated, TouchableWithoutFeedback, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { apiHealthPackage, HealthPackage } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fallback images for packages without image_url in DB
const FALLBACK_IMAGES: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=300&q=80',
  2: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=300&q=80',
  3: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=300&q=80',
  4: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
};

const PackagesScreen = ({ route, navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { currentUser } = useAuth();
  const { showAlert } = useCustomAlert();
  const { selectedId } = route.params || {};
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<HealthPackage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Load packages from API on mount
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data = await apiHealthPackage.getAll();
      setPackages(data);
    } catch (e) {
      console.log('Error fetching health packages:', e);
      // API unavailable — keep empty list (no mock fallback)
    } finally {
      setLoading(false);
    }
  };

  // Auto-open modal if a package was passed via navigation params
  useEffect(() => {
    if (selectedId && packages.length > 0) {
      const pkg = packages.find(p => p.packageId === selectedId);
      if (pkg) handleOpenDetail(pkg);
    }
  }, [selectedId, packages]);

  const handleOpenDetail = (pkg: HealthPackage) => {
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

  const handleBookPackage = async () => {
    if (!selectedPackage) return;
    try {
      setBooking(true);
      const result = await apiHealthPackage.bookPackage(selectedPackage.packageId, {
        patientId: currentUser?.patientId,
        patientName: currentUser?.fullName || 'Bệnh nhân',
        priceFormatted: selectedPackage.priceFormatted,
      });
      handleCloseDetail();
      showAlert({
        title: '✅ Đặt gói khám thành công!',
        message: `Gói **${result.packageTitle}** đã được đặt thành công.\n\n📅 Ngày dự kiến: ${result.preferredDate}\n💰 Chi phí: ${result.priceFormatted}\n🔢 Số thứ tự: ${result.queueNumber}`,
        type: 'success',
        confirmText: 'Xem lịch khám',
        cancelText: 'Đóng',
        onConfirm: () => navigation.navigate('Calendar'),
      });
    } catch (e) {
      showAlert({
        title: '⚠️ Thông báo',
        message: 'Không thể kết nối server để đặt gói khám. Vui lòng thử lại sau.',
        type: 'error',
        confirmText: 'Đã hiểu',
      });
    } finally {
      setBooking(false);
    }
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
        
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ marginTop: 12, color: COLORS.placeholder, fontSize: 14 }}>Đang tải danh sách gói khám...</Text>
          </View>
        ) : packages.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Ionicons name="medkit-outline" size={48} color="#D0D0D0" />
            <Text style={{ marginTop: 12, color: COLORS.placeholder, fontSize: 14 }}>Chưa có gói khám nào khả dụng</Text>
          </View>
        ) : (
          packages.map((pkg) => {
            const displayImg = pkg.imageUrl || FALLBACK_IMAGES[pkg.packageId] || FALLBACK_IMAGES[1];
            return (
              <TouchableOpacity 
                key={pkg.packageId} 
                style={[styles.packageCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]} 
                activeOpacity={0.9} 
                onPress={() => handleOpenDetail(pkg)}
              >
                <Image source={{ uri: displayImg }} style={styles.packageImage} />
                <View style={styles.packageBadge}>
                  <Ionicons name="flame" size={12} color="#EF4444" />
                  <Text style={styles.packageBadgeText}>{pkg.bookedCountFormatted} {t('booked')}</Text>
                </View>
                <View style={styles.packageInfo}>
                  <Text style={[styles.packageTitle, isDarkMode && { color: '#F3F4F6' }]}>{pkg.title}</Text>
                  <Text style={[styles.packageDescription, isDarkMode && { color: '#9CA3AF' }]} numberOfLines={2}>{pkg.description}</Text>
                  <View style={styles.packageFooter}>
                    <Text style={styles.packagePrice}>{pkg.priceFormatted}</Text>
                    <TouchableOpacity style={styles.bookBtnSmall} onPress={() => handleOpenDetail(pkg)}>
                      <Text style={styles.bookBtnSmallText}>{t('details')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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

        <Animated.View onStartShouldSetResponder={() => true} style={[styles.sheet, isDarkMode && { backgroundColor: '#111827' }, { transform: [{ translateY: slideAnim }] }]}>
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
                <Image source={{ uri: selectedPackage.imageUrl || FALLBACK_IMAGES[selectedPackage.packageId] || FALLBACK_IMAGES[1] }} style={styles.detailImage} />
                <View style={styles.detailBody}>
                  <Text style={[styles.detailTitle, isDarkMode && { color: '#F3F4F6' }]}>{selectedPackage.title}</Text>
                  <Text style={styles.detailPrice}>{selectedPackage.priceFormatted}</Text>
                  
                  <View style={styles.infoBadgeRow}>
                    <View style={styles.infoBadge}>
                      <Ionicons name="people" size={14} color={COLORS.primary} />
                      <Text style={styles.infoBadgeText}>{selectedPackage.bookedCountFormatted} {t('booked')}</Text>
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
                    {selectedPackage.details && selectedPackage.details.map((item: string, index: number) => (
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
                  <Text style={styles.totalPrice}>{selectedPackage.priceFormatted}</Text>
                </View>
                <TouchableOpacity style={styles.mainBookBtn} onPress={() => {
                  handleCloseDetail();
                  setTimeout(() => {
                    navigation.navigate('ConfirmBooking', { 
                      type: 'package',
                      packageId: selectedPackage.packageId,
                      packageName: selectedPackage.title,
                      price: selectedPackage.priceFormatted
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
