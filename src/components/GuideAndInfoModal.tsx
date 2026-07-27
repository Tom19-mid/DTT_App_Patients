import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GuideAndInfoModalProps {
  visible: boolean;
  mode: 'guide' | 'medical_info' | null;
  onClose: () => void;
}

const GUIDE_ITEMS = [
  {
    step: '01',
    title: 'Đặt lịch khám trực tuyến trên App',
    icon: 'mobile-alt' as const,
    color: '#3B82F6',
    desc: 'Quý khách chọn Chuyên khoa hoặc Bác sĩ mong muốn ngay trên màn hình trang chủ hoặc mục "Lịch khám". Sau khi chọn khung giờ phù hợp và xác nhận, hệ thống sẽ tự động cấp Số Thứ Tự (STT) khám trước và lưu vào danh sách "Sắp tới".',
    tips: ['Mẹo: Đặt trước ít nhất 24 giờ để có nhiều lựa chọn khung giờ tốt nhất.', 'Không cần xếp hàng lấy số giấy tại Quầy tiếp nhận.']
  },
  {
    step: '02',
    title: 'Chuẩn bị trước khi đến Bệnh viện',
    icon: 'id-card' as const,
    color: '#10B981',
    desc: 'Để quá trình thủ tục diễn ra nhanh chóng, quý khách mang theo CCCD gắn chip (đã tích hợp Bảo hiểm Y tế) hoặc thẻ BHYT vật lý, cùng hồ sơ bệnh án hoặc sổ khám chữa bệnh cũ (nếu có).',
    tips: ['Lưu ý quan trọng: Nhịn ăn uống nhẹ từ 6 - 8 tiếng trước giờ hẹn nếu quý khách đăng ký khám tổng quát, xét nghiệm máu hoặc siêu âm ổ bụng.']
  },
  {
    step: '03',
    title: 'Quy trình Check-in & Kiosk tự động',
    icon: 'qrcode' as const,
    color: '#8B5CF6',
    desc: 'Khi đến bệnh viện, quý khách chỉ cần mở ứng dụng DTT Healthcare, đưa mã QR của phiếu đặt khám vào đầu đọc tại Kiosk Lễ tân tự động tại Tầng 1. Hệ thống lập tức hiển thị chỉ dẫn số phòng khám và số tầng của Bác sĩ phụ trách.',
    tips: ['Quý khách di chuyển thẳng lên Phòng Khám đã định và chờ gọi STT qua bảng hiển thị màn hình ngoài cửa phòng.']
  },
  {
    step: '04',
    title: 'Nhận kết quả & Toa thuốc trực tuyến',
    icon: 'notes-medical' as const,
    color: '#F59E0B',
    desc: 'Toàn bộ phiếu xét nghiệm, kết quả siêu âm chẩn đoán hình ảnh và Hóa đơn, Toa thuốc điện tử sẽ được chuyển thẳng về hồ sơ cá nhân trên App ngay khi hoàn tất. Quý khách có thể mua thuốc trực tiếp tại Quầy Dược Bệnh viện bằng QR code trên app.',
    tips: ['Dữ liệu bệnh án được lưu trữ vĩnh viễn và bảo mật cao, tiện cho việc tái khám định kỳ.']
  }
];

const MEDICAL_INFO_ITEMS = [
  {
    id: 1,
    category: 'Tim mạch & Huyết áp',
    title: 'Dấu hiệu cảnh báo sớm bệnh Đột Quỵ & Tăng Huyết Áp',
    readTime: '3 phút đọc',
    icon: 'heartbeat' as const,
    color: '#EF4444',
    summary: 'Tăng huyết áp được mệnh danh là "kẻ giết người thầm lặng". Nhận diện nhanh 4 dấu hiệu F.A.S.T và thay đổi lối sống để bảo vệ tim mạch.',
    details: [
      'Nguyên nhân và biến chứng: Huyết áp duy trì trên 140/90 mmHg liên tục có thể gây hư hại mạch máu não, mạch vành tim và suy thận mãn tính.',
      'Quy tắc nhận biết sớm F.A.S.T: Face (Méo mặt châm lót) - Arm (Yếu liệt tay chân một bên) - Speech (Nói ngọn, nói nhịu) - Time (Thời gian là vàng, gọi ngay 115 hoặc đưa tới khoa Cấp cứu bệnh viện có can thiệp mạch máu trước 4 giờ đầu).',
      'Lời khuyên Bác sĩ DTT: Giảm ăn mặn (dưới 5g muối/ngày), duy trì đi bộ nhanh 30 phút mỗi ngày và theo dõi đo huyết áp mỗi buổi sáng.'
    ]
  },
  {
    id: 2,
    category: 'Cơ xương khớp & Cột sống',
    title: 'Hội chứng Đau Cổ Vai Gáy ở người làm văn phòng',
    readTime: '4 phút đọc',
    icon: 'bone' as const,
    color: '#3B82F6',
    summary: 'Ngồi kiên trì trước máy tính sai tư thế là nguyên nhân hàng đầu gây chèn ép rễ thần kinh, thoái hóa đốt sống cổ sớm.',
    details: [
      'Triệu chứng phổ biến: Đau nhức ê ẩm từ hốc cổ rách buốt lan ra hai vai, tê bì các ngón tay khi rê chuột máy tính bấy lâu, chóng mặt hoa mắt do thiển năng tuần hoàn não.',
      'Giải pháp công thái học (Ergonomics): Điều chỉnh đỉnh màn hình máy tính ngang ngang tầm mắt, khuỷu tay gập vuông góc 90 độ, dùng ghế có tựa thắt lưng tốt.',
      'Quy tắc nghỉ ngơi 45/5: Cứ mỗi 45 phút đứng lên đi lại 5 phút, tập các động tác xoay khớp cổ nhẹ nhàng và giãn cơ ngực lưng.'
    ]
  },
  {
    id: 3,
    category: 'Nhi khoa & Tiêm chủng',
    title: 'Sổ tay bảo vệ trẻ em trong giai đoạn chuyển mùa',
    readTime: '5 phút đọc',
    icon: 'baby' as const,
    color: '#10B981',
    summary: 'Thời tiết chuyển tiếp nóng - lạnh đột ngột làm tăng suy yếu miễn dịch đường hô hấp ở các bé dưới 6 tuổi.',
    details: [
      'Phòng ngự cúm và RSV: Nguyên nhân gây viêm tiểu phế quản phổ biến hàng đầu. Bố mẹ cần rửa tay sạch sẽ trước khi bế ấp bé, vệ sinh mũi họng hằng ngày bằng nước muối sinh lý.',
      'Khi nào cần đưa con gặp Bác sĩ lập tức: Trẻ có dấu hiệu sốt cao khó hạ trên 38.5°C kéo dài trên 48h, lờ đờ bỏ bú, rút lõm lồng ngực hoặc khò khè nặng.',
      'Lịch tiêm phòng khuyến nghị: Tiêm phòng cúm mùa mỗi năm 1 lần, phế cầu khuẩn và vắc xin sởi - quai bị - rubella đúng định kỳ theo chỉ thị từ Viện Vệ Sinh Dịch Tễ.'
    ]
  },
  {
    id: 4,
    category: 'Dinh dưỡng y sinh',
    title: 'Chế độ ăn kiêng DASH cho sức khỏe trường thọ',
    readTime: '3 phút đọc',
    icon: 'apple-alt' as const,
    color: '#F59E0B',
    summary: 'Chế độ dinh dưỡng khoa học được giới Y khoa công nhận hiệu quả nhất trong kiểm soát mỡ máu, đường huyết và béo phì.',
    details: [
      'Nguyên tắc cốt lõi: Tăng cường ngũ cốc nguyên cám (gạo lứt, yến mạch), các bắp rau lá xanh đậm, quả mọng chứa chất chống oxy hóa cao.',
      'Loại bỏ các nguy cơ giấu mặt: Cắt giảm mỡ động vật, thực phẩm làm sẵn ngâm tẩm chất bảo quản (lạp xưởng, xúc xích, mì ăn liền) và thức uống pha chế đường hóa học.',
      'Uống đủ nước mỗi ngày: Công thức cơ bản: Trọng lượng cơ thể (kg) x 0.04 = Số lít nước lọc cần chia đều sử dụng đều đặn qua từng buổi trong ngày.'
    ]
  }
];

const GuideAndInfoModal: React.FC<GuideAndInfoModalProps> = ({ visible, mode, onClose }) => {
  const { isDarkMode, t } = useSettings();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  if (!mode) return null;

  const isGuide = mode === 'guide';
  const headerTitle = isGuide ? 'Hướng Dẫn Quy Trình Khám' : 'Cẩm Nang & Kiến Thức Y Khoa';
  const headerSub = isGuide ? 'Quy chuẩn hành trình tiếp nhận nhanh & tiết kiệm thời gian' : 'Kiến thức chăm sóc sức khỏe chuẩn chuyên khoa từ DTT Healthcare';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, isDarkMode && { backgroundColor: '#111827' }]}>
        {/* Header */}
        <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={26} color={isDarkMode ? '#F3F4F6' : '#111827'} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{headerTitle}</Text>
            <Text style={[styles.headerSub, isDarkMode && { color: '#9CA3AF' }]} numberOfLines={1}>{headerSub}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner Hero */}
          <View style={[styles.heroBox, isDarkMode && { backgroundColor: isGuide ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
            <View style={styles.heroIconCircle}>
              <FontAwesome5 name={isGuide ? "book-medical" : "stethoscope"} size={32} color={isGuide ? "#3B82F6" : "#10B981"} />
            </View>
            <Text style={[styles.heroTitle, isDarkMode && { color: '#F3F4F6' }]}>
              {isGuide ? 'Đồng Hành Cùng Sức Khỏe Quý Khách' : 'Thư Viện Sức Khỏe Chuẩn Chuyên Khoa'}
            </Text>
            <Text style={[styles.heroDesc, isDarkMode && { color: '#D1D5DB' }]}>
              {isGuide
                ? 'Chúng tôi tối ưu hóa toàn bộ quy trình công nghệ số, giúp Quý khách và Gia đình khám bệnh nhẹ nhàng, thuận lợi không lo chờ đợi.'
                : 'Cập nhật tin tức chuyên môn y học hiện đại, bài viết sức khỏe chuyên gia được ban cố vấn Bệnh Viện Đa Khoa DTT Healthcare biên soạn và thẩm định.'}
            </Text>
          </View>

          {/* ── MODE: GUIDE (HƯỚNG DẪN QUY TRÌNH) ── */}
          {isGuide && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeading, isDarkMode && { color: '#F3F4F6' }]}>Quy Trình 4 Bước Thư Thái</Text>
              {GUIDE_ITEMS.map((item, index) => (
                <View key={index} style={[styles.guideCard, isDarkMode && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
                  <View style={styles.guideCardHeader}>
                    <View style={[styles.stepBadge, { backgroundColor: item.color }]}>
                      <Text style={styles.stepBadgeText}>{item.step}</Text>
                    </View>
                    <Text style={[styles.guideCardTitle, isDarkMode && { color: '#F3F4F6' }]}>{item.title}</Text>
                    <View style={styles.guideIconBox}>
                      <FontAwesome5 name={item.icon} size={20} color={item.color} />
                    </View>
                  </View>
                  <Text style={[styles.guideDesc, isDarkMode && { color: '#D1D5DB' }]}>{item.desc}</Text>
                  
                  {item.tips.map((tip, idx) => (
                    <View key={idx} style={[styles.tipBox, isDarkMode && { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                      <Ionicons name="bulb" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                      <Text style={[styles.tipText, isDarkMode && { color: '#FDE68A' }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              ))}
              
              <View style={[styles.footerHelp, isDarkMode && { backgroundColor: '#374151' }]}>
                <Ionicons name="call" size={24} color={COLORS.primary} />
                <Text style={[styles.footerHelpText, isDarkMode && { color: '#F3F4F6' }]}>
                  Cần trợ giúp thêm về quy trình? Gọi ngay Hotline <Text style={{ fontWeight: '700', color: COLORS.primary }}>1900 1234</Text> (Miễn phí 24/7).
                </Text>
              </View>
            </View>
          )}

          {/* ── MODE: MEDICAL INFO (KIẾN THỨC Y KHOA) ── */}
          {!isGuide && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeading, isDarkMode && { color: '#F3F4F6' }]}>Chuyên Đề Khuyến Nghị Cho Bạn</Text>
              {MEDICAL_INFO_ITEMS.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.articleCard, isDarkMode && { backgroundColor: '#1F2937', borderColor: '#374151' }]}
                    onPress={() => toggleExpand(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.articleHeaderRow}>
                      <View style={[styles.articleIconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                        <FontAwesome5 name={item.icon} size={22} color={item.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.articleCat}>{item.category} • <Text style={{ color: '#9CA3AF' }}>{item.readTime}</Text></Text>
                        <Text style={[styles.articleTitle, isDarkMode && { color: '#F3F4F6' }]}>{item.title}</Text>
                      </View>
                      <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color="#9CA3AF" />
                    </View>
                    
                    <Text style={[styles.articleSummary, isDarkMode && { color: '#D1D5DB' }]}>{item.summary}</Text>

                    {isExpanded && (
                      <View style={[styles.expandedArea, isDarkMode && { borderTopColor: '#374151' }]}>
                        {item.details.map((point, idx) => (
                          <View key={idx} style={styles.bulletRow}>
                            <View style={[styles.bulletDot, { backgroundColor: item.color }]} />
                            <Text style={[styles.bulletText, isDarkMode && { color: '#E5E7EB' }]}>{point}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default GuideAndInfoModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...SHADOWS.card,
  },
  backButton: {
    padding: 6,
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...SHADOWS.card,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 14,
    color: '#3B82F6',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionContainer: {
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.card,
  },
  guideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  guideCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  guideIconBox: {
    marginLeft: 8,
  },
  guideDesc: {
    fontSize: 14.5,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '500',
  },
  footerHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    ...SHADOWS.card,
  },
  footerHelpText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.card,
  },
  articleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  articleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleCat: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  articleSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 10,
  },
  expandedArea: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
});
