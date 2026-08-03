import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Keyboard, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AuthLayout from '../components/AuthLayout';
import { COLORS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useCustomAlert } from '../context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../services/apiService';

/**
 * OTPScreen — Dùng cho 2 luồng:
 *   1. purpose === 'reset_password' → Sau khi xác minh OTP, yêu cầu nhập mật khẩu mới
 *   2. purpose === 'register'       → Sau khi xác minh OTP, chuyển về Login (đăng ký hoàn tất)
 */
const OTPScreen = ({ navigation, route }: any) => {
  const { isDarkMode, t } = useSettings();
  const { showAlert } = useCustomAlert();

  const phone: string = route?.params?.phone || '';
  const purpose: 'reset_password' | 'register' = route?.params?.purpose || 'register';
  const demoOtpCode: string = route?.params?.otpCode || ''; // demo only
  const [currentOtp, setCurrentOtp] = useState(demoOtpCode);

  useEffect(() => {
    if (demoOtpCode) {
      console.log('\n======================================================');
      console.log(`🔑 [DEMO ĐỒ ÁN] MÃ OTP ĐANG HOẠT ĐỘNG: ${demoOtpCode}`);
      console.log('======================================================\n');
    }
  }, [demoOtpCode]);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Countdown timer (5 min = 300 seconds)
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New password fields (only shown for reset_password after OTP verified)
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const inputs = useRef<Array<TextInput | null>>([]);

  // Start countdown on mount
  useEffect(() => {
    startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCountdown(300);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleChangeText = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);
    if (clean && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    if (clean && index === 5) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.otpCode) {
          setCurrentOtp(data.otpCode);
          console.log('\n======================================================');
          console.log(`🔑 [DEMO ĐỒ ÁN] MÃ OTP MỚI GỬI LẠI: ${data.otpCode}`);
          console.log('======================================================\n');
        }
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
        startCountdown();
        showAlert({
          title: '📱 Đã gửi lại mã OTP',
          message: `Mã OTP mới đã được gửi đến ${phone}.\n\n${data.otpCode ? `[Demo Đồ án] Mã: ${data.otpCode}` : ''}`,
          type: 'success',
        });
      } else {
        showAlert({ title: 'Lỗi', message: data.message || 'Không thể gửi lại mã OTP.', type: 'error' });
      }
    } catch {
      showAlert({ title: 'Lỗi kết nối', message: 'Không thể kết nối đến máy chủ.', type: 'error' });
    } finally {
      setResending(false);
    }
  };

  // Step 1: Verify OTP code
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      showAlert({ title: 'Chưa nhập đủ mã', message: 'Vui lòng nhập đủ 6 chữ số OTP.', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otpCode: code }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (purpose === 'reset_password') {
          // Show new password form
          setOtpVerified(true);
        } else {
          // Register flow — OTP confirmed, go to login
          showAlert({
            title: 'Xác minh thành công',
            message: 'Số điện thoại đã được xác minh. Bạn có thể đăng nhập ngay.',
            type: 'success',
            onConfirm: () => navigation.navigate('Login'),
          });
        }
      } else {
        showAlert({ title: 'Mã OTP không hợp lệ', message: data.message || 'Mã OTP không chính xác hoặc đã hết hạn.', type: 'error' });
      }
    } catch {
      showAlert({ title: 'Lỗi kết nối', message: 'Không thể kết nối đến máy chủ.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password (only for reset_password purpose)
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng nhập mật khẩu mới và xác nhận lại.', type: 'warning' });
      return;
    }
    if (newPassword.length < 6) {
      showAlert({ title: 'Mật khẩu quá ngắn', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'warning' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert({ title: 'Không khớp', message: 'Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.', type: 'error' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otpCode: otp.join(''), newPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showAlert({
          title: '🔒 Đặt lại mật khẩu thành công',
          message: 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập với mật khẩu mới.',
          type: 'success',
          onConfirm: () => navigation.navigate('Login'),
        });
      } else {
        showAlert({ title: 'Lỗi', message: data.message || 'Không thể đặt lại mật khẩu.', type: 'error' });
      }
    } catch {
      showAlert({ title: 'Lỗi kết nối', message: 'Không thể kết nối đến máy chủ.', type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  const maskedPhone = phone ? `${phone.substring(0, 3)}****${phone.slice(-3)}` : '***';

  return (
    <AuthLayout>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {/* Icon */}
            <View style={styles.iconWrap}>
              <View style={[styles.iconCircle, isDarkMode && { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                <Ionicons
                  name={otpVerified ? 'key-outline' : 'shield-checkmark-outline'}
                  size={40}
                  color={isDarkMode ? '#818CF8' : COLORS.primary}
                />
              </View>
            </View>

            <Text style={[styles.title, isDarkMode && { color: '#F3F4F6' }]}>
              {otpVerified ? 'Đặt mật khẩu mới' : 'Xác minh OTP'}
            </Text>
            <Text style={[styles.subtitle, isDarkMode && { color: '#9CA3AF' }]}>
              {otpVerified
                ? 'Nhập mật khẩu mới cho tài khoản của bạn.'
                : `Mã xác minh 6 số đã được gửi đến\n${maskedPhone}`}
            </Text>

            {/* Demo mode hint - Clickable Auto-fill for Capstone Project Demo */}
            {currentOtp && !otpVerified ? (
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, elevation: 2, shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (currentOtp.length === 6) {
                      setOtp(currentOtp.split(''));
                      Keyboard.dismiss();
                    }
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>AutoFill</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {!otpVerified ? (
              <>
                {/* OTP Input Boxes */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputs.current[index] = ref; }}
                      style={[
                        styles.otpInput,
                        isDarkMode && { backgroundColor: '#374151', color: '#F3F4F6', borderColor: '#4B5563' },
                        digit ? styles.otpInputFilled : {},
                        digit && isDarkMode ? { borderColor: '#818CF8' } : digit ? { borderColor: COLORS.primary } : {},
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleChangeText(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Countdown / Resend */}
                <View style={styles.resendRow}>
                  {canResend ? (
                    <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                      <Text style={[styles.resendActive, isDarkMode && { color: '#60A5FA' }]}>
                        {resending ? 'Đang gửi lại...' : '↺ Gửi lại mã OTP'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.resendCountdown, isDarkMode && { color: '#9CA3AF' }]}>
                      Gửi lại sau{' '}
                      <Text style={{ fontWeight: '700', color: countdown < 30 ? '#EF4444' : isDarkMode ? '#818CF8' : COLORS.primary }}>
                        {formatCountdown(countdown)}
                      </Text>
                    </Text>
                  )}
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={[styles.actionBtn, loading && { opacity: 0.7 }, isDarkMode && { backgroundColor: '#4F46E5' }]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.actionBtnText}>Xác minh mã OTP</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* New Password Form */}
                <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, isDarkMode && { color: '#F3F4F6' }]}
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    placeholderTextColor={isDarkMode ? '#6B7280' : COLORS.placeholder}
                    secureTextEntry={!showNew}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNew(!showNew)} style={{ padding: 4 }}>
                    <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputWrapper, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, isDarkMode && { color: '#F3F4F6' }]}
                    placeholder="Xác nhận mật khẩu mới"
                    placeholderTextColor={isDarkMode ? '#6B7280' : COLORS.placeholder}
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={{ padding: 4 }}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, savingPassword && { opacity: 0.7 }, isDarkMode && { backgroundColor: '#059669' }, { backgroundColor: '#059669' }]}
                  onPress={handleResetPassword}
                  disabled={savingPassword}
                  activeOpacity={0.8}
                >
                  {savingPassword ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.actionBtnText}>Lưu mật khẩu mới</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-outline" size={16} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={{ marginRight: 4 }} />
              <Text style={[styles.backText, isDarkMode && { color: '#9CA3AF' }]}>
                {purpose === 'reset_password' ? 'Quay lại Quên mật khẩu' : 'Quay lại Đăng ký'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  iconWrap: {
    marginBottom: 16,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    width: '100%',
  },
  demoText: {
    fontSize: 13,
    color: '#D97706',
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    gap: 6,
  },
  otpInput: {
    flex: 1,
    height: 58,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: '#F8F9FA',
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  resendRow: {
    marginBottom: 20,
    alignItems: 'center',
  },
  resendCountdown: {
    fontSize: 14,
    color: COLORS.placeholder,
  },
  resendActive: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    width: '100%',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 14,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 4,
  },
  backText: {
    fontSize: 13,
    color: COLORS.placeholder,
    textDecorationLine: 'underline',
  },
});

export default OTPScreen;
