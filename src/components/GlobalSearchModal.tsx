import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { apiMedical } from '../services/apiService';

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  initialVoiceMode?: boolean;
}

// ── Static Master Data & Fallbacks ─────────────────────────────────────────────
// Trước đây chỉ có 8/11 chuyên khoa — thiếu Răng hàm mặt/Tai-Mũi-Họng/Mắt, nên bác sĩ thuộc 3 khoa
// này khi bấm từ kết quả tìm kiếm bị rơi về nhãn chung chung "Chuyên môn Y khoa" (SPECIALTIES_MASTER.find
// trả về undefined). Tên "Sản phụ khoa" (id 3) sửa lại khớp đúng tên thật trong DB (trước ghi "Phụ & Sản khoa").
const SPECIALTIES_MASTER = [
  { id: 1, name: 'Nội Tổng quát', icon: 'stethoscope', type: 'fa5', desc: 'Khám nội tiết, tim mạch cơ bản, tiêu hóa' },
  { id: 2, name: 'Nhi khoa', icon: 'baby', type: 'fa5', desc: 'Khám & điều trị chuyên sâu cho bé' },
  { id: 3, name: 'Sản phụ khoa', icon: 'human-female', type: 'mci', desc: 'Chăm sóc sức khỏe thai sản, phụ khoa' },
  { id: 4, name: 'Cơ xương khớp', icon: 'bone', type: 'fa5', desc: 'Khám thần kinh cột sống, loãng xương, chấn thương' },
  { id: 5, name: 'Tim mạch', icon: 'heartbeat', type: 'fa5', desc: 'Siêu âm tim, đo điện tim, điều trị tăng huyết áp' },
  { id: 6, name: 'Thần kinh', icon: 'brain', type: 'fa5', desc: 'Khám đau đầu, mất ngủ, thần kinh ngoại biên' },
  { id: 7, name: 'Da liễu', icon: 'hand-sparkles', type: 'fa5', desc: 'Điều trị viêm da, dị ứng, mẫn ngứa chấn thương da' },
  { id: 8, name: 'Chẩn đoán hình ảnh', icon: 'bullseye', type: 'fa5', desc: 'Chụp X-Quang, CT, MRI công nghệ cao' },
  { id: 9, name: 'Răng hàm mặt', icon: 'tooth', type: 'fa5', desc: 'Khám và điều trị các bệnh lý về răng, hàm, mặt' },
  { id: 10, name: 'Tai-Mũi-Họng', icon: 'deaf', type: 'fa5', desc: 'Khám và điều trị các bệnh lý về tai, mũi và họng' },
  { id: 11, name: 'Mắt', icon: 'eye', type: 'fa5', desc: 'Khám, chẩn đoán và điều trị các bệnh lý về mắt' },
];

const PACKAGES_MASTER = [
  { id: 1, title: 'Gói Khám Sức Khỏe Tổng Quát - Nam', price: '1.200.000đ', booked: '1.2k+', desc: 'Tầm soát toàn diện gan, thận, máu, mỡ máu cho Nam giới' },
  { id: 2, title: 'Gói Khám Sức Khỏe Tổng Quát - Nữ', price: '1.450.000đ', booked: '2k+', desc: 'Khám tổng quát, tầm soát nội tiết tố và ung thư Nữ giới' },
  { id: 3, title: 'Gói Tầm Soát Ung Thư Toàn Diện', price: '2.500.000đ', booked: '500+', desc: 'Phát hiện sớm khối u tiềm ẩn bằng các dấu ấn ung thư hiện đại' },
  { id: 4, title: 'Gói Chuyên Khám & Tầm Soát Tim Mạch', price: '1.800.000đ', booked: '800+', desc: 'Kiểm tra mạch máu, huyết áp, điện tâm đồ chuyên sâu' },
];

const HOT_KEYWORDS = ['Tim mạch', 'Cơ xương khớp', 'Khám tổng quát', 'Da liễu', 'Tầm soát ung thư', 'Phụ sản'];

// ── Vietnamese Accent Stripper / Normalizer ────────────────────────────────────
const normalizeStr = (str?: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese accents
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')     // Remove special symbols
    .trim();
};

// ── Conversational & Voice Fuzzy Token Matcher ─────────────────────────────────
const isFuzzyMatch = (queryStr: string, targetText: string): boolean => {
  if (!queryStr || !targetText) return false;
  const q = normalizeStr(queryStr);
  const t = normalizeStr(targetText);
  
  // 1. Direct exact substring match
  if (t.includes(q)) return true;
  
  // 2. Keyword token intersection matching (filter out conversational stop words)
  const stopWords = ['kham', 'goi', 'cua', 'theo', 'bac', 'si', 'tai', 'vien', 'benh', 'dich', 'vu'];
  const allTokens = q.split(/\s+/).filter(w => w.length > 0);
  const coreTokens = allTokens.filter(w => !stopWords.includes(w));
  
  // If user only typed common general words like "gói khám" or "bác sĩ"
  if (coreTokens.length === 0) {
    return allTokens.some(w => t.includes(w));
  }
  
  // Match if ALL core keywords exist in target text (e.g. "tầm", "soát", "ung", "thư" in "Gói Tầm Soát Ung Thư Toàn Diện")
  const allCoreMatched = coreTokens.every(token => t.includes(token));
  if (allCoreMatched) return true;

  // Fallback: If query has 3 or more core words, match if at least 60% of core words appear
  if (coreTokens.length >= 3) {
    const matchedCount = coreTokens.filter(token => t.includes(token)).length;
    if (matchedCount / coreTokens.length >= 0.6) return true;
  }
  
  return false;
};

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ visible, onClose, navigation, initialVoiceMode }) => {
  const { isDarkMode, t } = useSettings();
  const [searchText, setSearchText] = useState('');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Fetch real doctors from API on mount/open to keep records up to date
  useEffect(() => {
    if (visible) {
      if (initialVoiceMode) {
        setIsListening(true);
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      fetchRealDoctors();
    } else {
      setSearchText('');
      setIsListening(false);
    }
  }, [visible, initialVoiceMode]);

  const fetchRealDoctors = async () => {
    try {
      setLoading(true);
      const res = await apiMedical.getDoctors();
      if (res && res.length > 0) {
        setDoctorsList(res);
      }
    } catch (err) {
      console.log('Error fetching doctors in search:', err);
      setDoctorsList([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter Logic (Fuzzy Token matching) ───────────────────────────────────────
  const query = useMemo(() => searchText.trim(), [searchText]);

  const filteredDoctors = useMemo(() => {
    if (!query) return [];
    return doctorsList.filter(d => {
      const combined = `${d.fullName || ''} ${d.degree || ''} ${d.clinicRoom || ''} bác sĩ khám bệnh y khoa`;
      return isFuzzyMatch(query, combined);
    });
  }, [query, doctorsList]);

  const filteredSpecialties = useMemo(() => {
    if (!query) return [];
    return SPECIALTIES_MASTER.filter(s => {
      const combined = `${s.name || ''} ${s.desc || ''} chuyên khoa khám bệnh`;
      return isFuzzyMatch(query, combined);
    });
  }, [query]);

  const filteredPackages = useMemo(() => {
    if (!query) return [];
    return PACKAGES_MASTER.filter(p => {
      const combined = `${p.title || ''} ${p.desc || ''} gói khám sức khỏe dịch vụ`;
      return isFuzzyMatch(query, combined);
    });
  }, [query]);

  const hasResults = filteredDoctors.length > 0 || filteredSpecialties.length > 0 || filteredPackages.length > 0;

  const handleKeywordSelect = (kw: string) => {
    setSearchText(kw);
  };

  const handleSelectDoctor = (doc: any) => {
    onClose();
    // Navigate to Booking Screen with prefilled specialty / doctor context
    const spec = SPECIALTIES_MASTER.find(s => s.id === doc.specialtyId)?.name || 'Chuyên môn Y khoa';
    navigation.navigate('Booking', {
      specialty: spec,
      specialtyName: spec,
      doctorName: doc.fullName,
      doctorId: doc.doctorId
    });
  };

  const handleSelectSpecialty = (spec: any) => {
    onClose();
    navigation.navigate('Booking', {
      specialty: spec.name,
      specialtyName: spec.name
    });
  };

  const handleSelectPackage = (pkg: any) => {
    onClose();
    navigation.navigate('Packages', { selectedId: pkg.id });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, isDarkMode && { backgroundColor: '#111827' }]}>
        {/* ── Top Header Bar ── */}
        <View style={[styles.headerBar, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={26} color={isDarkMode ? '#F3F4F6' : '#111827'} />
          </TouchableOpacity>

          <View style={[styles.searchInputWrapper, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}>
            <Ionicons name="search" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, isDarkMode && { color: '#F3F4F6' }]}
              placeholder="Tìm Bác sĩ, chuyên khoa, dịch vụ..."
              placeholderTextColor={isDarkMode ? '#9CA3AF' : COLORS.placeholder}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              multiline={false}
              numberOfLines={1}
              clearButtonMode="never"
            />
            {searchText.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={20} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsListening(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="flash" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[styles.loadingText, isDarkMode && { color: '#9CA3AF' }]}>Đang đồng bộ dữ liệu tra cứu...</Text>
            </View>
          )}

          {/* ── EMPTY QUERY: HOT SUGGESTIONS ── */}
          {!query && (
            <View style={styles.suggestionContainer}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flame" size={20} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionHeading, isDarkMode && { color: '#F3F4F6' }]}>Từ Khóa Phổ Biến</Text>
              </View>

              <View style={styles.pillsWrap}>
                {HOT_KEYWORDS.map((kw, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pill, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}
                    onPress={() => handleKeywordSelect(kw)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="search-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.pillText, isDarkMode && { color: '#E5E7EB' }]}>{kw}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.sectionTitleRow, { marginTop: 28 }]}>
                <Ionicons name="apps" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.sectionHeading, isDarkMode && { color: '#F3F4F6' }]}>Danh Mục Khám</Text>
              </View>

              {SPECIALTIES_MASTER.slice(0, 4).map((spec) => (
                <TouchableOpacity
                  key={spec.id}
                  style={[styles.quickItemCard, isDarkMode && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                  onPress={() => handleSelectSpecialty(spec)}
                >
                  <View style={[styles.quickIconBox, isDarkMode && { backgroundColor: '#374151' }]}>
                    {spec.type === 'fa5' ? (
                      <FontAwesome5 name={spec.icon as any} size={20} color={COLORS.primary} />
                    ) : (
                      <MaterialCommunityIcons name={spec.icon as any} size={24} color={COLORS.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.itemTitle, isDarkMode && { color: '#F3F4F6' }]}>{spec.name}</Text>
                    <Text style={[styles.itemSub, isDarkMode && { color: '#9CA3AF' }]} numberOfLines={1}>{spec.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── SEARCH RESULTS ── */}
          {query.length > 0 && (
            <View>
              {/* SECTION 1: DOCTORS */}
              {filteredDoctors.length > 0 && (
                <View style={styles.resultGroup}>
                  <View style={styles.sectionHeaderBox}>
                    <FontAwesome5 name="user-md" size={18} color={COLORS.primary} />
                    <Text style={[styles.sectionHeaderLabel, isDarkMode && { color: '#F3F4F6' }]}>
                      Bác Sĩ Chuyên Khoa ({filteredDoctors.length})
                    </Text>
                  </View>
                  {filteredDoctors.map(doc => (
                    <TouchableOpacity
                      key={doc.doctorId}
                      style={[styles.resultCard, isDarkMode && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                      onPress={() => handleSelectDoctor(doc)}
                    >
                      <View style={styles.docAvatar}>
                        <FontAwesome5 name="user-tie" size={24} color="#FFF" />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={[styles.itemTitle, isDarkMode && { color: '#F3F4F6' }]}>{doc.fullName}</Text>
                        <Text style={[styles.itemSub, isDarkMode && { color: '#9CA3AF' }]}>{doc.degree}</Text>
                        <View style={styles.docTags}>
                          <Text style={styles.tagBadge}>📍 {doc.clinicRoom || 'Phòng Khám'}</Text>
                          <Text style={[styles.tagBadge, { backgroundColor: '#FEF08A', color: '#854D0E' }]}>⭐ {doc.rating || 5.0}</Text>
                        </View>
                      </View>
                      <View style={styles.actionArrow}>
                        <Text style={styles.bookBtnText}>Đặt</Text>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* SECTION 2: SPECIALTIES */}
              {filteredSpecialties.length > 0 && (
                <View style={[styles.resultGroup, { marginTop: filteredDoctors.length > 0 ? 20 : 0 }]}>
                  <View style={styles.sectionHeaderBox}>
                    <FontAwesome5 name="hospital-user" size={18} color={COLORS.primary} />
                    <Text style={[styles.sectionHeaderLabel, isDarkMode && { color: '#F3F4F6' }]}>
                      Chuyên Khoa & Lịch Khám ({filteredSpecialties.length})
                    </Text>
                  </View>
                  {filteredSpecialties.map(spec => (
                    <TouchableOpacity
                      key={spec.id}
                      style={[styles.resultCard, isDarkMode && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                      onPress={() => handleSelectSpecialty(spec)}
                    >
                      <View style={[styles.specIconBox, isDarkMode && { backgroundColor: 'rgba(99,102,241,0.2)' }]}>
                        {spec.type === 'fa5' ? (
                          <FontAwesome5 name={spec.icon as any} size={24} color={COLORS.primary} />
                        ) : (
                          <MaterialCommunityIcons name={spec.icon as any} size={28} color={COLORS.primary} />
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[styles.itemTitle, isDarkMode && { color: '#F3F4F6' }]}>{spec.name}</Text>
                        <Text style={[styles.itemSub, isDarkMode && { color: '#9CA3AF' }]}>{spec.desc}</Text>
                      </View>
                      <View style={styles.actionArrow}>
                        <Text style={styles.bookBtnText}>Xem</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* SECTION 3: HEALTH PACKAGES */}
              {filteredPackages.length > 0 && (
                <View style={[styles.resultGroup, { marginTop: (filteredDoctors.length > 0 || filteredSpecialties.length > 0) ? 20 : 0 }]}>
                  <View style={styles.sectionHeaderBox}>
                    <FontAwesome5 name="medkit" size={18} color="#10B981" />
                    <Text style={[styles.sectionHeaderLabel, isDarkMode && { color: '#F3F4F6' }]}>
                      Gói Khám Sức Khỏe ({filteredPackages.length})
                    </Text>
                  </View>
                  {filteredPackages.map(pkg => (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[styles.resultCard, isDarkMode && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                      onPress={() => handleSelectPackage(pkg)}
                    >
                      <View style={styles.pkgIconBox}>
                        <Ionicons name="shield-checkmark" size={28} color="#10B981" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={[styles.itemTitle, isDarkMode && { color: '#F3F4F6' }]}>{pkg.title}</Text>
                        <Text style={[styles.pkgPrice, { color: '#10B981', fontWeight: '700', marginTop: 4 }]}>
                          {pkg.price} <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: 'normal' }}>| {pkg.booked} đặt</Text>
                        </Text>
                        <Text style={[styles.itemSub, isDarkMode && { color: '#9CA3AF' }, { marginTop: 2 }]} numberOfLines={1}>
                          {pkg.desc}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward-circle" size={26} color="#10B981" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* EMPTY STATE */}
              {!hasResults && (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="search-outline" size={56} color="#9CA3AF" />
                  </View>
                  <Text style={[styles.emptyTitle, isDarkMode && { color: '#F3F4F6' }]}>
                    Không tìm thấy kết quả phù hợp
                  </Text>
                  <Text style={[styles.emptySubtitle, isDarkMode && { color: '#9CA3AF' }]}>
                    Không có dữ liệu cho từ khóa "{searchText}". Bạn hãy thử tìm kiếm bằng tên Bác sĩ, chuyên khoa (Tim mạch, Cơ xương khớp,...) hoặc từ khóa ngắn gọn hơn nhé!
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Quick Search Suggestions (KHÔNG phải nhận diện giọng nói thật — trước đây UI này giả vờ
            "Đang Lắng Nghe..." khiến người dùng tưởng có thể nói vào mic thật, nhưng chỉ là các gợi ý
            tìm kiếm dựng sẵn. Đổi lại thành gợi ý tìm kiếm nhanh, trung thực, không giả lập mic). ── */}
        {isListening && (
          <View style={styles.voiceOverlay}>
            <View style={[styles.voiceDialog, isDarkMode && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
              <View style={styles.micPulseCircle}>
                <Ionicons name="search" size={38} color="#FFFFFF" />
              </View>
              <Text style={[styles.voiceTitle, isDarkMode && { color: '#F3F4F6' }]}>Gợi ý tìm kiếm nhanh</Text>
              <Text style={[styles.voiceSub, isDarkMode && { color: '#9CA3AF' }]}>
                Tính năng tìm kiếm bằng giọng nói đang được phát triển. Trong lúc chờ, bạn có thể chạm chọn nhanh 1 gợi ý bên dưới:
              </Text>

              <View style={styles.voiceChipsContainer}>
                {[
                  'Khám Cơ xương khớp',
                  'Gói khám tầm soát ung thư',
                  'Khám Tim mạch',
                  'Phụ & Sản khoa',
                ].map((phrase, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.voiceChip, isDarkMode && { backgroundColor: '#374151' }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setIsListening(false);
                      setSearchText(phrase);
                    }}
                  >
                    <Ionicons name="volume-high" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.voiceChipText, isDarkMode && { color: '#E5E7EB' }]}>"{phrase}"</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.voiceCloseBtn}
                onPress={() => setIsListening(false)}
              >
                <Text style={styles.voiceCloseBtnText}>Dừng lắng nghe</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default GlobalSearchModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...SHADOWS.card,
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14.5,
    color: '#111827',
    paddingVertical: 0,
    height: 48,
    textAlignVertical: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  cleanEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  cleanEmptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  suggestionContainer: {
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...SHADOWS.card,
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  quickItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.card,
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  resultGroup: {
    marginBottom: 10,
  },
  sectionHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.card,
  },
  docAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
    marginLeft: 14,
  },
  docTags: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  tagBadge: {
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  specIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pkgPrice: {
    fontSize: 14,
  },
  actionArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  voiceOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99,
  },
  voiceDialog: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.card,
  },
  micPulseCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...SHADOWS.card,
  },
  voiceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  voiceSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  voiceChipsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  voiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  voiceChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  voiceCloseBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 24,
    backgroundColor: '#EF4444',
  },
  voiceCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
