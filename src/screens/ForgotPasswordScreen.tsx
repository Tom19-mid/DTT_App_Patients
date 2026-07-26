import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AuthLayout from '../components/AuthLayout';
import { COLORS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useCustomAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../services/apiService';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { showAlert } = useCustomAlert();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhone = (p: string) => /^0[0-9]{9}$/.test(p.trim());

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed) {
      showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng nhập số điện thoại đã đăng ký.', type: 'warning' });
      return;
    }
    if (!validatePhone(trimmed)) {
      showAlert({ title: 'Số điện thoại không hợp lệ', message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0 (Ví dụ: 0901234567).', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        console.log('\n======================================================');
        console.log(`🔑 [DEMO ĐỒ ÁN TỐT NGHIỆP] MÃ OTP QUÊN MẬT KHẨU: ${data.otpCode}`);
        console.log('======================================================\n');
        // Navigate to OTP screen with phone + purpose + OTP code (for demo)
        navigation.navigate('OTP', {
          phone: trimmed,
          purpose: 'reset_password',
          otpCode: data.otpCode, // demo only – remove in production
        });
      } else {
        showAlert({
          title: 'Không thể gửi mã OTP',
          message: data.message || 'Số điện thoại chưa được đăng ký trong hệ thống.',
          type: 'error',
        });
      }
    } catch {
      showAlert({ title: 'Lỗi kết nối', message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <View style={[styles.iconCircle, isDarkMode && { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                <Ionicons name="lock-open-outline" size={40} color={isDarkMode ? '#818CF8' : COLORS.primary} />
              </View>
            </View>

            <Text style={[styles.title, isDarkMode && { color: '#F3F4F6' }]}>Quên mật khẩu</Text>
            <Text style={[styles.descText, isDarkMode && { color: '#9CA3AF' }]}>
              Nhập số điện thoại đã đăng ký. Chúng tôi sẽ gửi mã OTP để xác minh danh tính và đặt lại mật khẩu cho bạn.
            </Text>

            {/* Phone Input */}
            <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}>
              <Ionicons name="call-outline" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isDarkMode && { color: '#F3F4F6' }]}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={isDarkMode ? '#6B7280' : COLORS.placeholder}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
              />
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }, isDarkMode && { backgroundColor: '#4F46E5' }]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Gửi mã OTP</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />
              <Text style={[styles.dividerText, isDarkMode && { color: '#6B7280' }]}>hoặc</Text>
              <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />
            </View>

            <View style={styles.bottomLinks}>
              <Text style={[styles.linkPrompt, isDarkMode && { color: '#D1D5DB' }]}>Nhớ mật khẩu? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.linkText, isDarkMode && { color: '#60A5FA' }]}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ alignItems: 'center' }}>
              <Text style={[styles.linkText, isDarkMode && { color: '#60A5FA' }]}>Chưa có tài khoản? Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99,102,241,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  descText: {
    fontSize: 14,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  linkPrompt: {
    fontSize: 13,
    color: COLORS.text,
  },
  linkText: {
    fontSize: 13,
    color: COLORS.link,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;
