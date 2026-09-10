import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Animated, TouchableWithoutFeedback, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { apiHealthPackage, HealthPackage } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

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
  const { profiles } = useAuth();
  const { selectedId } = route.params || {};
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<HealthPackage | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Đặt gói khám cho: Bản thân | Người thân — cùng cơ chế với BookingScreen (chỉ liệt kê hồ sơ
  // người thân của CHÍNH tài khoản đang đăng nhập, không cần người thân tự có tài khoản riêng).
  const selfProfile = profiles.find(p => p.isOwner || p.relationship === 'Bản thân') || profiles[0];
  const familyProfiles = profiles.filter(p => !(p.isOwner || p.relationship === 'Bản thân'));
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(undefined);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || selfProfile;
  const handleOpenProfileDropdown = () => {
    if (familyProfiles.length === 0) return;
    setProfileModalVisible(true);
  };

  // Load packages from API on mount — lọc theo giới tính của CHỦ TÀI KHOẢN (backend hỗ trợ sẵn tham
  // số gender để lọc gói "chỉ dành cho Nam/Nữ", nhưng trước đây màn này gọi getAll() không truyền gì
  // cả nên hiện ĐỦ MỌI gói bất kể giới tính — vd bệnh nhân Nam vẫn thấy và đặt được gói "Chỉ dành cho
  // Nữ". Trường hợp đặt cho người thân khác giới tính chủ tài khoản vẫn được chặn đúng ở backend lúc
  // thật sự đặt (BookPackage đã bổ sung kiểm tra riêng), đây chỉ là lọc hiển thị cho gọn danh sách.
  useEffect(() => {
    fetchPackages();
  }, [selfProfile?.gender]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const g = selfProfile?.gender?.toLowerCase();
      const genderParam = g === 'male' || g === 'female' ? (g as 'male' | 'female') : undefined;
      const data = await apiHealthPackage.getAll(genderParam);
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

  // [Old code]: handleBookPackage() — hàm gọi thẳng apiHealthPackage.bookPackage() không kèm memberId/
  // preferredDate/preferredTimeSlot, không còn được gọi ở đâu (nút "Đặt gói khám" thật đã chuyển sang
  // điều hướng tới ConfirmBookingScreen, có đủ 3 field trên). Đã xóa để tránh ai đó nối lại nhầm vào 1
  // nút trong tương lai và vô tình làm mất luồng chọn người thân/ngày giờ.

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

                  <TouchableOpacity
                    style={styles.profileDropdownBtn}
                    activeOpacity={familyProfiles.length === 0 ? 1 : 0.7}
                    onPress={handleOpenProfileDropdown}
                  >
                    <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.profileDropdownText}>
                      Đặt cho: {selectedProfile && selectedProfile.relationship !== 'Bản thân' ? selectedProfile.name : 'Bản thân'}
                    </Text>
                    {familyProfiles.length > 0 && <Ionicons name="chevron-down" size={16} color={COLORS.primary} />}
                  </TouchableOpacity>

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
                  const isOwnerSelected = !selectedProfile || selectedProfile.isOwner || selectedProfile.relationship === 'Bản thân';
                  handleCloseDetail();
                  setTimeout(() => {
                    navigation.navigate('ConfirmBooking', {
                      type: 'package',
                      packageId: selectedPackage.packageId,
                      packageName: selectedPackage.title,
                      price: selectedPackage.priceFormatted,
                      memberId: isOwnerSelected ? undefined : selectedProfile?.realId,
                      profileName: selectedProfile?.name,
                      profileRelationship: selectedProfile?.relationship,
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

      {/* Profile Selection Modal: Bản thân | Người thân */}
      <Modal
        visible={isProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setProfileModalVisible(false)}>
          <View style={styles.profileModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.profileModalContent, isDarkMode && { backgroundColor: '#1F2937' }]}>
                <View style={styles.profileModalHeader}>
                  <Text style={[styles.profileModalTitle, isDarkMode && { color: '#F3F4F6' }]}>Đặt gói khám cho ai?</Text>
                  <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                {(selfProfile ? [selfProfile, ...familyProfiles] : familyProfiles).map((item) => {
                  const isSelected = (selectedProfile?.id ?? selfProfile?.id) === item.id;
                  const isSelf = item.relationship === 'Bản thân';
                  // Hiển thị giới tính/ngày sinh dưới tên để phân biệt các người thân trùng tên/quan hệ
                  // — áp dụng cho cả "Bản thân" lẫn người thân, lấy thẳng từ profile.gender/profile.dob.
                  const subInfo = [item.gender, item.dob].filter(Boolean).join(' • ');
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.profileOption, isSelected && styles.profileOptionActive]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedProfileId(item.id);
                        setProfileModalVisible(false);
                      }}
                    >
                      <Ionicons name={isSelf ? 'person' : 'people'} size={18} color={isSelected ? '#fff' : COLORS.primary} style={{ marginRight: 12 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.profileOptionText, isSelected && styles.profileOptionTextActive]}>
                          {isSelf ? 'Bản thân' : item.name}
                        </Text>
                        {!isSelf && <Text style={[styles.profileOptionRelation, isSelected && { color: '#E0E7FF' }]}>{item.relationship}</Text>}
                        {!!subInfo && <Text style={[styles.profileOptionRelation, isSelected && { color: '#E0E7FF' }]}>{subInfo}</Text>}
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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

  // Profile picker ("Đặt cho: Bản thân | Người thân")
  profileDropdownBtn: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, marginBottom: 16,
  },
  profileDropdownText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  profileModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  profileModalContent: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 16,
  },
  profileModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  profileModalTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  profileOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 14, marginBottom: 6, backgroundColor: '#F8FAFC',
  },
  profileOptionActive: { backgroundColor: COLORS.primary },
  profileOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  profileOptionTextActive: { color: '#fff' },
  profileOptionRelation: { fontSize: 12, color: COLORS.placeholder, marginTop: 2 },
});

export default PackagesScreen;
