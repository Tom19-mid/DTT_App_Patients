import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useCustomAlert } from '../context/AlertContext';

const SupportScreen = ({ navigation }: any) => {
  const { showAlert } = useCustomAlert();
  const [feedback, setFeedback] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const FAQS = [
    { id: 1, q: 'Làm sao để xem kết quả xét nghiệm?', a: 'Bạn cần đến quầy lễ tân bệnh viện để xác thực tài khoản bằng CCCD lần đầu. Sau đó, kết quả sẽ tự động đồng bộ vào mục Hồ sơ y tế trên ứng dụng.' },
    { id: 2, q: 'Tôi có thể đặt lịch khám cho người thân không?', a: 'Được. Bạn có thể thêm hồ sơ người thân trong mục "Quản lý hồ sơ" và chọn hồ sơ đó khi đặt lịch khám.' },
    { id: 3, q: 'Thanh toán trực tuyến có an toàn không?', a: 'Ứng dụng sử dụng cổng thanh toán chuẩn quốc tế PCI-DSS, mọi giao dịch của bạn đều được mã hóa an toàn 100%.' },
  ];

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỏi đáp & Góp ý</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp (FAQ)</Text>
          <View style={[styles.faqCard, SHADOWS.card]}>
            {FAQS.map((faq, index) => (
              <View key={faq.id}>
                <TouchableOpacity 
                  style={styles.faqRow} 
                  activeOpacity={0.7}
                  onPress={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                >
                  <Text style={[styles.faqQ, expandedId === faq.id && { color: COLORS.primary }]}>{faq.q}</Text>
                  <Ionicons name={expandedId === faq.id ? "chevron-up" : "chevron-down"} size={20} color={COLORS.placeholder} />
                </TouchableOpacity>
                {expandedId === faq.id && (
                  <Text style={styles.faqA}>{faq.a}</Text>
                )}
                {index < FAQS.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Gửi góp ý cho bệnh viện</Text>
          <View style={[styles.feedbackCard, SHADOWS.card]}>
            <TextInput
              style={styles.textArea}
              placeholder="Nhập nội dung góp ý hoặc phản ánh của bạn tại đây..."
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
  container: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  faqCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text, marginRight: 12, lineHeight: 20 },
  faqA: { fontSize: 13, color: COLORS.placeholder, lineHeight: 20, paddingBottom: 12 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  feedbackCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  textArea: { fontSize: 15, color: COLORS.text, minHeight: 120 },
  sendButton: {
    backgroundColor: COLORS.primary, height: 52, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default SupportScreen;
