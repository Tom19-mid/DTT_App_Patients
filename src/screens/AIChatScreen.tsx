import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';
import { apiChat, ChatMessageItem } from '../services/apiService';

// AI Symptom Checker + Escalate to Staff — xem Tai Lieu/ai_chatbot_luong_nghiep_vu.md
// Polling tin nhắn CHỈ chạy khi status='Escalated' (chờ Lễ tân) — trong lúc chat với AI,
// phản hồi đến ngay trong response của sendMessage nên không cần polling, đỡ tốn request.
const POLL_INTERVAL_MS = 4000;

type SessionStatus = 'AI' | 'Escalated' | 'Closed';

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const GREETING: ChatMessageItem = {
  messageId: 0,
  senderType: 'AI',
  content: 'Chào bạn, mình là trợ lý ảo DTT Healthcare 🤖. Bạn đang gặp triệu chứng gì, hãy mô tả để mình gợi ý chuyên khoa phù hợp nhé.',
  createdAt: new Date().toISOString(),
};

const AIChatScreen = ({ navigation }: any) => {
  const { showAlert } = useCustomAlert();
  const { isDarkMode } = useSettings();

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState<SessionStatus>('AI');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [initializing, setInitializing] = useState(true);
  const [sending, setSending] = useState(false);
  const [suggestedSpecialty, setSuggestedSpecialty] = useState<{ id: number; name: string } | null>(null);
  const [aiSuggestsEscalate, setAiSuggestsEscalate] = useState(false);

  const listRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToEnd = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Mở phiên chat mới ngay khi vào màn hình
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Ưu tiên tiếp tục phiên đang mở (AI/Escalated) nếu có — tránh tạo phiên mới làm "mồ côi"
        // phiên cũ mà Lễ tân có thể đang chờ trả lời.
        const active = await apiChat.getActiveSession();
        if (!mounted) return;

        if (active.success && active.hasActive && active.sessionId) {
          const sid = active.sessionId;
          setSessionId(sid);
          setStatus((active.status as SessionStatus) || 'AI');

          const history = await apiChat.getMessages(sid);
          if (!mounted) return;
          setMessages(history.success && history.messages.length > 0 ? history.messages : [GREETING]);
          return;
        }

        const res = await apiChat.createSession();
        if (!mounted) return;
        if (res.success) {
          setSessionId(res.sessionId);
          setStatus((res.status as SessionStatus) || 'AI');
          setMessages([GREETING]);
        } else {
          throw new Error('Không thể mở phiên chat.');
        }
      } catch (err: any) {
        showAlert({
          title: 'Lỗi',
          message: err?.message || 'Không thể kết nối trợ lý AI. Vui lòng thử lại sau.',
          type: 'error',
          onConfirm: () => navigation.goBack(),
        });
      } finally {
        if (mounted) setInitializing(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling khi đã chuyển cho Lễ tân — lấy tin nhắn mới của Lễ tân + phát hiện khi phiên bị đóng.
  useEffect(() => {
    if (status !== 'Escalated' || !sessionId) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    const poll = async () => {
      try {
        const res = await apiChat.getMessages(sessionId);
        if (res.success) {
          setMessages(res.messages);
          if (res.status && res.status !== status) setStatus(res.status as SessionStatus);
        }
      } catch {
        // Bỏ qua lỗi 1 lượt poll (mạng chập chờn) — lượt tiếp theo sẽ tự thử lại.
      }
    };
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, sessionId]);

  useEffect(() => { scrollToEnd(); }, [messages.length]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !sessionId || sending) return;
    setInput('');
    setSending(true);

    setMessages(prev => [...prev, {
      messageId: Date.now(),
      senderType: 'Patient',
      content,
      createdAt: new Date().toISOString(),
    }]);

    try {
      const res = await apiChat.sendMessage(sessionId, content);
      if (res.escalated) {
        // Đang Escalated: tin nhắn chỉ được lưu, Lễ tân trả lời qua polling — không có reply AI.
        return;
      }
      if (res.reply) {
        setMessages(prev => [...prev, {
          messageId: Date.now() + 1,
          senderType: 'AI',
          content: res.reply!,
          createdAt: new Date().toISOString(),
        }]);
      }
      if (res.suggestedSpecialtyId && res.suggestedSpecialtyName) {
        setSuggestedSpecialty({ id: res.suggestedSpecialtyId, name: res.suggestedSpecialtyName });
      }
      setAiSuggestsEscalate(!!res.shouldEscalate);
    } catch (err: any) {
      // Graceful degradation phía client — khớp với thông báo mặc định của GeminiService khi lỗi.
      setMessages(prev => [...prev, {
        messageId: Date.now() + 2,
        senderType: 'AI',
        content: 'Xin lỗi, hệ thống trợ lý AI hiện đang bận. Bạn có muốn chuyển sang tư vấn trực tiếp với Nhân viên Lễ tân không?',
        createdAt: new Date().toISOString(),
      }]);
      setAiSuggestsEscalate(true);
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = () => {
    if (!sessionId) return;
    showAlert({
      title: 'Cần tư vấn thêm?',
      message: 'Bạn sẽ được chuyển sang trò chuyện trực tiếp với Nhân viên của bệnh viện.',
      type: 'info',
      showCancel: true,
      confirmText: 'Chuyển tiếp',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          const res = await apiChat.escalate(sessionId);
          if (res.success) {
            setStatus('Escalated');
            setSuggestedSpecialty(null);
          }
        } catch (err: any) {
          showAlert({ title: 'Lỗi', message: err?.message || 'Không thể chuyển tiếp lúc này.', type: 'error' });
        }
      },
    });
  };

  const handleBookNow = () => {
    if (!suggestedSpecialty) return;
    navigation.navigate('Booking', { specialtyName: suggestedSpecialty.name });
  };

  const renderBubble = ({ item }: { item: ChatMessageItem }) => {
    const isPatient = item.senderType === 'Patient';
    const isStaff = item.senderType === 'Staff';
    return (
      <View style={[styles.bubbleRow, isPatient && styles.bubbleRowRight]}>
        {!isPatient && (
          <View style={[styles.avatar, isStaff ? styles.avatarStaff : styles.avatarAI]}>
            <Ionicons name={isStaff ? 'person' : 'sparkles'} size={14} color="#fff" />
          </View>
        )}
        <View style={{ maxWidth: '78%' }}>
          {!isPatient && (
            <Text style={styles.senderLabel}>{isStaff ? (item.senderName || 'Lễ tân') : 'Trợ lý AI'}</Text>
          )}
          <View style={[styles.bubble, isPatient ? styles.bubblePatient : (isStaff ? styles.bubbleStaff : styles.bubbleAI)]}>
            <Text style={[styles.bubbleText, isPatient && { color: '#fff' }]}>{item.content}</Text>
          </View>
          <Text style={[styles.timeText, isPatient && { textAlign: 'right' }]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  const darkBg = isDarkMode ? { backgroundColor: '#111827' } : {};
  const darkCard = isDarkMode ? { backgroundColor: '#1F2937' } : {};
  const darkText = isDarkMode ? { color: '#F3F4F6' } : {};

  return (
    <SafeAreaView style={[styles.safeArea, darkBg]}>
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, darkText]}>Trợ Lý AI Sức Khỏe</Text>
          <Text style={styles.headerSubtitle}>
            {status === 'AI' ? 'Đang trò chuyện với AI' : status === 'Escalated' ? 'Đang kết nối Lễ tân' : 'Đã kết thúc'}
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {initializing ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => String(item.messageId)}
            renderItem={renderBubble}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToEnd}
          />

          {sending && (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.typingText}>Trợ lý AI đang trả lời...</Text>
            </View>
          )}

          {status === 'AI' && suggestedSpecialty && (
            <View style={[styles.suggestCard, SHADOWS.card, darkCard]}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={[styles.suggestText, darkText]}>
                Gợi ý: bạn nên khám chuyên khoa <Text style={{ fontWeight: 'bold' }}>{suggestedSpecialty.name}</Text>
              </Text>
              <TouchableOpacity style={styles.suggestBtn} onPress={handleBookNow}>
                <Text style={styles.suggestBtnText}>Đặt lịch ngay</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'AI' && (
            <TouchableOpacity
              style={[styles.escalateBar, aiSuggestsEscalate && styles.escalateBarUrgent]}
              onPress={handleEscalate}
              activeOpacity={0.8}
            >
              <Ionicons name="headset" size={16} color={aiSuggestsEscalate ? '#fff' : COLORS.primary} />
              <Text style={[styles.escalateBarText, aiSuggestsEscalate && { color: '#fff' }]}>
                {aiSuggestsEscalate ? 'AI gợi ý: Nên tư vấn trực tiếp với Nhân viên' : 'Cần tư vấn thêm với Nhân viên?'}
              </Text>
            </TouchableOpacity>
          )}

          {status === 'Closed' ? (
            <View style={styles.closedBar}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.closedBarText}>Buổi tư vấn đã kết thúc. Cảm ơn bạn đã liên hệ DTT Healthcare.</Text>
            </View>
          ) : (
            <View style={[styles.inputBar, isDarkMode && { backgroundColor: '#1F2937', borderTopColor: '#374151' }]}>
              <TextInput
                style={[styles.input, darkText]}
                placeholder={status === 'Escalated' ? 'Nhắn cho Lễ tân...' : 'Mô tả triệu chứng của bạn...'}
                placeholderTextColor={isDarkMode ? '#6B7280' : COLORS.placeholder}
                value={input}
                onChangeText={setInput}
                multiline
                editable={!sending}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || sending}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default AIChatScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  headerSubtitle: { fontSize: 11, color: COLORS.placeholder, marginTop: 2 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: { padding: 16, paddingBottom: 12 },
  bubbleRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  avatar: {
    width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center',
    marginRight: 8, marginBottom: 16,
  },
  avatarAI: { backgroundColor: COLORS.primary },
  avatarStaff: { backgroundColor: '#10B981' },
  senderLabel: { fontSize: 11, color: COLORS.placeholder, marginBottom: 3, marginLeft: 2 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubblePatient: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: '#EEF2FF', borderBottomLeftRadius: 4 },
  bubbleStaff: { backgroundColor: '#ECFDF5', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  timeText: { fontSize: 10, color: COLORS.placeholder, marginTop: 3, marginHorizontal: 2 },

  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 8 },
  typingText: { fontSize: 12, color: COLORS.placeholder, fontStyle: 'italic' },

  suggestCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB',
    marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 14, gap: 10,
  },
  suggestText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 18 },
  suggestBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  suggestBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  escalateBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 10, paddingVertical: 10, borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  escalateBarUrgent: { backgroundColor: '#EF4444' },
  escalateBarText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  closedBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ECFDF5', paddingVertical: 14, marginHorizontal: 16, marginBottom: 16, borderRadius: 12,
  },
  closedBarText: { fontSize: 13, color: '#065F46', fontWeight: '600' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  input: {
    flex: 1, fontSize: 14, color: COLORS.text, maxHeight: 100,
    backgroundColor: '#F4F6F9', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C7D2FE' },
});
