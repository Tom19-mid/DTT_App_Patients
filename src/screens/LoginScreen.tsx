import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { COLORS, SIZES } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import {
  loginWithBiometric,
  saveTokenForBiometric,
  isBiometricEnabled,
  checkBiometricCapability,
} from '../services/biometricService';
import { apiAuth } from '../services/apiService';
import { useCustomAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';

const FaceIdIcon = ({ size = 28, color = COLORS.text }: { size?: number, color?: string }) => {
  const t = size * 0.08;
  const r = size * 0.25;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: size*0.3, height: size*0.3, borderTopWidth: t, borderLeftWidth: t, borderColor: color, borderTopLeftRadius: r }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: size*0.3, height: size*0.3, borderTopWidth: t, borderRightWidth: t, borderColor: color, borderTopRightRadius: r }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: size*0.3, height: size*0.3, borderBottomWidth: t, borderLeftWidth: t, borderColor: color, borderBottomLeftRadius: r }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: size*0.3, height: size*0.3, borderBottomWidth: t, borderRightWidth: t, borderColor: color, borderBottomRightRadius: r }} />
      
      <View style={{ position: 'absolute', top: size*0.35, left: size*0.28, width: t, height: size*0.15, borderRadius: t, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: size*0.35, right: size*0.28, width: t, height: size*0.15, borderRadius: t, backgroundColor: color }} />
      
      <View style={{ position: 'absolute', top: size*0.35, left: size*0.38, width: size*0.12, height: size*0.25, borderBottomWidth: t, borderRightWidth: t, borderColor: color, borderBottomRightRadius: size*0.08 }} />
      
      <View style={{ position: 'absolute', bottom: size*0.2, width: size*0.4, height: size*0.15, borderBottomWidth: t, borderColor: color, borderBottomLeftRadius: size*0.2, borderBottomRightRadius: size*0.2 }} />
    </View>
  );
};

const LoginScreen = ({ navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { showAlert } = useCustomAlert();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Check if biometric login is available when screen loads
  useEffect(() => {
    const checkBiometric = async () => {
      const enabled = await isBiometricEnabled();
      const { hasHardware, isEnrolled } = await checkBiometricCapability();
      setBiometricAvailable(enabled && hasHardware && isEnrolled);
    };
    checkBiometric();
  }, []);

  // ── Face ID Login ────────────────────────────────────────────────────────────
  const handleFaceIdLogin = async () => {
    const result = await loginWithBiometric();

    if (result.success) {
      showAlert({
        title: 'Thành công',
        message: 'Đăng nhập bằng Face ID thành công!',
        type: 'success',
        confirmText: 'Vào ứng dụng',
        onConfirm: () => navigation.replace('MainTabs'),
      });
      return;
    }

    // Handle failure reasons
    const messages: Record<string, string> = {
      no_hardware: 'Thiết bị của bạn không hỗ trợ Face ID hoặc Vân tay.',
      not_enrolled: 'Bạn chưa thiết lập Face ID trên thiết bị này.',
      not_setup: 'Vui lòng đăng nhập bằng mật khẩu lần đầu để kích hoạt Face ID.',
      auth_failed: 'Xác thực thất bại. Vui lòng thử lại.',
      cancelled: '', // user cancelled, show nothing
    };

    const message = messages[result.reason];
    if (message) {
      showAlert({ title: 'Thông báo', message, type: 'warning' });
    }
  };

  const validatePhone = (phoneStr: string) => {
    const phoneRegex = /^(0[3|5|7|8|9][0-9]{8}|0[0-9]{9})$/;
    return phoneRegex.test(phoneStr.trim());
  };

  // ── Password Login ───────────────────────────────────────────────────────────
  const handlePasswordLogin = async () => {
    const trimmedPhone = phone.trim();
    const trimmedPass = password.trim();

    if (!trimmedPhone || !trimmedPass) {
      showAlert({ title: 'Thông báo', message: 'Vui lòng nhập số điện thoại và mật khẩu.', type: 'warning' });
      return;
    }

    if (!validatePhone(trimmedPhone)) {
      showAlert({ title: 'Số điện thoại không hợp lệ', message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0901234567).', type: 'warning' });
      return;
    }

    if (trimmedPass.length < 6) {
      showAlert({ title: 'Mật khẩu không hợp lệ', message: 'Mật khẩu phải có ít nhất 6 ký tự.', type: 'warning' });
      return;
    }

    try {
      // Try connecting to ASP.NET Core Web API Backend
      const res = await apiAuth.login(trimmedPhone, trimmedPass);
      login(res);
      await saveTokenForBiometric(res.token, trimmedPhone);
      setBiometricAvailable(true);
      navigation.replace('MainTabs');
    } catch (err: any) {
      showAlert({
        title: 'Đăng nhập thất bại',
        message: err.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại số điện thoại hoặc mật khẩu.',
        type: 'error',
        confirmText: 'Thử lại',
      });
    }
  };

  // ── SMS Login ────────────────────────────────────────────────────────────────
  const handleSMSLogin = () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      showAlert({ title: 'Thông báo', message: 'Vui lòng nhập số điện thoại trước khi đăng nhập bằng SMS.', type: 'info' });
      return;
    }

    if (!validatePhone(trimmedPhone)) {
      showAlert({ title: 'Số điện thoại không hợp lệ', message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0901234567).', type: 'warning' });
      return;
    }

    showAlert({
      title: '📱 Xác thực SMS',
      message: `Chúng tôi sẽ gửi mã OTP đến số:\n\n${trimmedPhone}`,
      type: 'info',
      confirmText: 'Tiếp tục',
      cancelText: 'Hủy',
      onConfirm: () => navigation.navigate('OTP', { phone: trimmedPhone }),
    });
  };

  return (
    <AuthLayout>
      <View style={styles.formContainer}>
        <CustomInput 
          placeholder={t('phone_placeholder')} 
          keyboardType="phone-pad" 
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
        />
        <CustomInput 
          placeholder={t('password_placeholder')} 
          secureTextEntry 
          value={password}
          onChangeText={setPassword}
        />
        
        <CustomButton 
          title={t('login_btn')} 
          onPress={handlePasswordLogin}
          style={styles.loginBtn}
        />

        <Text style={[styles.orText, isDarkMode && { color: '#9CA3AF' }]}>{t('quick_login')}</Text>

        <View style={styles.quickLoginContainer}>
          <TouchableOpacity 
            style={[styles.quickLoginIcon, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}
            onPress={handleFaceIdLogin}
          >
            <FaceIdIcon size={30} color={isDarkMode ? '#60A5FA' : COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickLoginIcon, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}
            onPress={handleSMSLogin}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={isDarkMode ? '#60A5FA' : COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomLinks}>
          <Text style={[styles.linkPrompt, isDarkMode && { color: '#D1D5DB' }]}>{t('no_account')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.linkText, isDarkMode && { color: '#60A5FA' }]}>{t('register_btn')}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPassBtn}>
          <Text style={[styles.forgotPassText, isDarkMode && { color: '#D1D5DB' }]}>{t('forgot_password_btn')}</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  loginBtn: {
    marginTop: 20,
    marginBottom: 20,
  },
  orText: {
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  quickLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 30,
  },
  quickLoginIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  linkPrompt: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 12,
    color: COLORS.link,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  forgotPassBtn: {
    alignItems: 'center',
  },
  forgotPassText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
