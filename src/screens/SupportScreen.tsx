import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, TextInput, KeyboardAvoidingView, Platform, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';

const HOTLINES = [
  {
    id: 1,
    label: 'Cấp cứu khẩn cấp',
    number: '115',
    icon: 'warning' as const,
    color: '#EF4444',
    bg: '#FEF2F2',
    description: 'Gọi ngay khi có tình trạng khẩn cấp về sức khỏe',
  },
  {
    id: 2,
    label: 'Tổng đài CSKH',
    number: '1900 1234',
    icon: 'headset' as const,
    color: '#3B82F6',
    bg: '#EFF6FF',
    description: 'Hỗ trợ đặt lịch, tra cứu thông tin bệnh viện',
  },
  {
    id: 3,
    label: 'Đường dây nội bộ',
    number: '028 1234 5678',
    icon: 'call' as const,
    color: '#10B981',
    bg: '#ECFDF5',
    description: 'Liên hệ trực tiếp quầy tiếp nhận bệnh viện',
  },
];

const SupportScreen = ({ navigation }: any) => {
  const { showAlert } = useCustomAlert();
  const { isDarkMode } = useSettings();
  const [feedback, setFeedback] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const FAQS = [
    { id: 1, q: 'Làm sao để xem kết quả xét nghiệm?', a: 'Bạn cần đến quầy lễ tân bệnh viện để xác thực tài khoản bằng CCCD lần đầu. Sau đó, kết quả sẽ tự động đồng bộ vào mục Hồ sơ y tế trên ứng dụng.' },
    { id: 2, q: 'Tôi có thể đặt lịch khám cho người thân không?', a: 'Được. Bạn có thể thêm hồ sơ người thân trong mục "Quản lý hồ sơ" và chọn hồ sơ đó khi đặt lịch khám.' },
    { id: 3, q: 'Thanh toán trực tuyến có an toàn không?', a: 'Ứng dụng sử dụng cổng thanh toán chuẩn quốc tế PCI-DSS, mọi giao dịch của bạn đều được mã hóa an toàn 100%.' },
    { id: 4, q: 'Tôi quên mật khẩu thì phải làm gì?', a: 'Bấm "Quên mật khẩu" ở màn hình đăng nhập. Hệ thống sẽ gửi mã OTP đến số điện thoại của bạn để đặt lại mật khẩu.' },
  ];

  const handleCall = (number: string, label: string) => {
    const tel = `tel:${number.replace(/\s/g, '')}`;
    Alert.alert(
      `Gọi ${label}`,
      `Bạn muốn gọi đến số ${number}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gọi ngay',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(tel).catch(() => {
              Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi trên thiết bị này.');
            });
          },
        },
      ]
    );
  };

  const handleSendFeedback = () => {
    if (!feedback.trim()) {
      showAlert({ title: 'Lỗi', message: 'Vui lòng nhập nội dung góp ý.', type: 'warning' });
      return;
    }
    showAlert({
      title: 'Thành công',
      message: 'Cảm ơn bạn đã gửi góp ý. Chúng tôi sẽ phản hồi sớm nhất qua email.',
      type: 'success',
      onConfirm: () => {
        setFeedback('');
        navigation.goBack();
      }
    });
  };

  const darkCard = isDarkMode ? { backgroundColor: '#1F2937' } : {};
  const darkText = isDarkMode ? { color: '#F3F4F6' } : {};
  const darkSub  = isDarkMode ? { color: '#9CA3AF' } : {};

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#111827' }]}>
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkText]}>Hỗ trợ & Góp ý</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* ── Hotline Section ──────────────────────────────────── */}
          <Text style={[styles.sectionTitle, darkText]}>Liên hệ & Hotline</Text>
          {HOTLINES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.hotlineCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}
              activeOpacity={0.75}
              onPress={() => handleCall(item.number, item.label)}
            >
              <View style={[styles.hotlineIconBox, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : item.bg }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.hotlineInfo}>
                <Text style={[styles.hotlineLabel, darkText]}>{item.label}</Text>
                <Text style={[styles.hotlineNumber, { color: item.color }]}>{item.number}</Text>
                <Text style={[styles.hotlineDesc, darkSub]}>{item.description}</Text>
              </View>
              <View style={[styles.callBtn, { backgroundColor: item.color }]}>
                <Ionicons name="call" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}

          {/* ── Hospital Location & Deep Linking ────────────────── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }, darkText]}>Vị trí & Cơ sở Bệnh viện</Text>
          <View style={[styles.locationCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
            <View style={styles.locationHeader}>
              <View style={[styles.locationIconBox, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.2)' : '#EEF2FF' }]}>
                <Ionicons name="business" size={24} color={isDarkMode ? '#818CF8' : COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hospitalName, darkText]}>Bệnh viện Đa khoa DTT Healthcare</Text>
                <Text style={[styles.hospitalAddress, darkSub]}>
                  458/3F Nguyễn Hữu Thọ, P. Tân Hưng, Quận 7, TP. Hồ Chí Minh
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { marginVertical: 12 }, isDarkMode && { backgroundColor: '#374151' }]} />

            <View style={styles.locationFooter}>
              <View style={styles.workingHoursBox}>
                <Ionicons name="time-outline" size={16} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
                <Text style={[styles.workingHoursText, darkSub]}>7:00 - 20:00 (Thứ 2 - Chủ Nhật)</Text>
              </View>

              <TouchableOpacity
                style={styles.mapNavBtn}
                activeOpacity={0.8}
                onPress={() => {
                  const address = encodeURIComponent('458/3F Nguyễn Hữu Thọ, Tân Hưng, Quận 7, Hồ Chí Minh');
                  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
                  const appleUrl = `http://maps.apple.com/?daddr=${address}`;
                  const url = Platform.OS === 'ios' ? appleUrl : googleUrl;

                  Linking.openURL(url).catch(() => {
                    Linking.openURL(googleUrl).catch(() => {
                      Alert.alert('Lỗi', 'Không thể mở ứng dụng bản đồ.');
                    });
                  });
                }}
              >
                <Ionicons name="navigate" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.mapNavBtnText}>Chỉ đường</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── FAQ Section ──────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }, darkText]}>Câu hỏi thường gặp</Text>
          <View style={[styles.faqCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
            {FAQS.map((faq, index) => (
              <View key={faq.id}>
                <TouchableOpacity
                  style={styles.faqRow}
                  activeOpacity={0.7}
                  onPress={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                >
                  <Text style={[styles.faqQ, expandedId === faq.id && { color: COLORS.primary }, darkText]}>
                    {faq.q}
                  </Text>
                  <Ionicons
                    name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={isDarkMode ? '#6B7280' : COLORS.placeholder}
                  />
                </TouchableOpacity>
                {expandedId === faq.id && (
                  <Text style={[styles.faqA, darkSub]}>{faq.a}</Text>
                )}
                {index < FAQS.length - 1 && (
                  <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />
                )}
              </View>
            ))}
          </View>

          {/* ── Feedback Section ─────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }, darkText]}>Gửi góp ý cho bệnh viện</Text>
          <View style={[styles.feedbackCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
            <TextInput
              style={[styles.textArea, darkText]}
              placeholder="Nhập nội dung góp ý hoặc phản ánh của bạn tại đây..."
              placeholderTextColor={isDarkMode ? '#6B7280' : COLORS.placeholder}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={feedback}
              onChangeText={setFeedback}
            />
          </View>

          <TouchableOpacity style={[styles.sendButton, SHADOWS.input]} onPress={handleSendFeedback}>
            <Ionicons name="paper-plane" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.sendButtonText}>Gửi góp ý</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  container: { padding: 16, paddingBottom: 120 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },

  // Hotline
  hotlineCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12,
  },
  hotlineIconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  hotlineInfo: { flex: 1 },
  hotlineLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  hotlineNumber: { fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  hotlineDesc: { fontSize: 12, color: COLORS.placeholder, lineHeight: 16 },
  callBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  // Location
  locationCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  locationIconBox: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  hospitalName: { fontSize: 15, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  hospitalAddress: { fontSize: 13, color: COLORS.placeholder, lineHeight: 18 },
  locationFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  workingHoursBox: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 10 },
  workingHoursText: { fontSize: 12, color: COLORS.placeholder },
  mapNavBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20,
  },
  mapNavBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  // FAQ
  faqCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 4 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text, marginRight: 12, lineHeight: 20 },
  faqA: { fontSize: 13, color: COLORS.placeholder, lineHeight: 20, paddingBottom: 12 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  // Feedback
  feedbackCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  textArea: { fontSize: 15, color: COLORS.text, minHeight: 120 },
  sendButton: {
    backgroundColor: COLORS.primary, height: 52, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default SupportScreen;
