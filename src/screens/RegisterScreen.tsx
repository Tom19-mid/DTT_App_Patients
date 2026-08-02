import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { apiAuth } from '../services/apiService';
import { saveTokenForBiometric } from '../services/biometricService';
import { useCustomAlert } from '../context/AlertContext';

const RegisterScreen = ({ navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { showAlert } = useCustomAlert();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhone = (phoneStr: string) => {
    const phoneRegex = /^(0[3|5|7|8|9][0-9]{8}|0[0-9]{9})$/;
    return phoneRegex.test(phoneStr.trim());
  };

  const validateEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const handleRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      showAlert({ title: 'Thông báo', message: 'Vui lòng nhập họ và tên của bạn.', type: 'warning' });
      return;
    }

    if (!trimmedPhone) {
      showAlert({ title: 'Thông báo', message: 'Vui lòng nhập số điện thoại.', type: 'warning' });
      return;
    }

    if (!validatePhone(trimmedPhone)) {
      showAlert({
        title: 'Số điện thoại không hợp lệ',
        message: 'Số điện thoại phải bao gồm 10 chữ số hợp lệ và bắt đầu bằng số 0 (Ví dụ: 0901234567).',
        type: 'warning'
      });
      return;
    }

    if (!trimmedEmail) {
      showAlert({ title: 'Thông báo', message: 'Vui lòng nhập địa chỉ email.', type: 'warning' });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      showAlert({
        title: 'Email không hợp lệ',
        message: 'Vui lòng nhập đúng định dạng email (Ví dụ: ten@gmail.com).',
        type: 'warning'
      });
      return;
    }

    if (!password) {
      showAlert({ title: 'Thông báo', message: 'Vui lòng nhập mật khẩu.', type: 'warning' });
      return;
    }

    if (password.length < 6) {
      showAlert({ title: 'Mật khẩu quá ngắn', message: 'Mật khẩu phải có ít nhất 6 ký tự.', type: 'warning' });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({ title: 'Mật khẩu không khớp', message: 'Mật khẩu xác nhận không trùng khớp với mật khẩu đã nhập.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Connect to ASP.NET Core Web API Backend
      const res = await apiAuth.register(trimmedName, trimmedPhone, trimmedEmail, password);
      await saveTokenForBiometric(res.token, trimmedPhone);

      if (res.otpCode) {
        console.log('\n======================================================');
        console.log(`🔑 [DEMO ĐỒ ÁN TỐT NGHIỆP] MÃ OTP ĐĂNG KÝ: ${res.otpCode}`);
        console.log('======================================================\n');
      }

      showAlert({
        title: '📱 Xác minh số điện thoại',
        message: `Mã xác thực OTP đã được gửi đến số ${trimmedPhone}.\n\nVui lòng nhập mã OTP để hoàn tất đăng ký tài khoản!`,
        type: 'info',
        confirmText: 'Nhập OTP',
        onConfirm: () => navigation.navigate('OTP', { 
          phone: trimmedPhone,
          purpose: 'register',
          otpCode: res.otpCode
        }),
      });
    } catch (err: any) {
      showAlert({
        title: 'Đăng ký thất bại',
        message: err.message || 'Không thể đăng ký. Số điện thoại hoặc Email có thể đã tồn tại.',
        type: 'error',
        confirmText: 'Thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={[styles.title, isDarkMode && { color: '#F3F4F6' }]}>{t('register')}</Text>
      <Text style={[styles.subtitle, isDarkMode && { color: '#9CA3AF' }]}>{t('create_account_desc')}</Text>

      <CustomInput
        label={t('full_name')}
        placeholder={t('enter_full_name')}
        value={fullName}
        onChangeText={setFullName}
        iconName="person-outline"
      />

      <CustomInput
        label={t('phone_number')}
        placeholder={t('enter_phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        iconName="call-outline"
        maxLength={10}
      />

      <CustomInput
        label={t('email')}
        placeholder={t('enter_email')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        iconName="mail-outline"
      />

      <CustomInput
        label={t('password')}
        placeholder={t('enter_password')}
        value={password}
        onChangeText={setPassword}
        isPassword
        iconName="lock-closed-outline"
      />

      <CustomInput
        label={t('confirm_password')}
        placeholder={t('enter_confirm_password')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword
        iconName="lock-closed-outline"
      />

      <CustomButton
        title={t('register')}
        onPress={handleRegister}
        isLoading={loading}
      />

      <View style={styles.loginContainer}>
        <Text style={[styles.loginText, isDarkMode && { color: '#9CA3AF' }]}>{t('already_have_account')} </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>{t('login_now')}</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: COLORS.subtext,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RegisterScreen;
