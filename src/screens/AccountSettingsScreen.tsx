import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { apiAuth } from '../services/apiService';
import { isBiometricEnabled, clearBiometricToken } from '../services/biometricService';

const AccountSettingsScreen = ({ navigation }: any) => {
  const { showAlert } = useCustomAlert();
  const { isDarkMode, t } = useSettings();
  const { currentUser, setCurrentUser } = useAuth();
  // Trước đây công tắc này chỉ là useState local, không đọc/ghi trạng thái Face ID thật —
  // bật/tắt ở đây không có tác dụng gì, Face ID vẫn hoạt động bình thường dù người dùng đã "tắt".
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isBiometricEnabled().then(setBiometricsEnabled);
  }, []);

  const handleToggleBiometrics = async (value: boolean) => {
    if (!value) {
      await clearBiometricToken();
      setBiometricsEnabled(false);
    } else {
      // Không có sẵn mật khẩu ở màn này để thiết lập lại token Face ID — hướng dẫn đăng nhập lại
      // bằng mật khẩu thay vì âm thầm bật công tắc mà không thực sự kích hoạt được gì.
      showAlert({
        title: 'Kích hoạt Face ID',
        message: 'Vui lòng đăng xuất và đăng nhập lại bằng mật khẩu một lần để kích hoạt đăng nhập Face ID.',
        type: 'info',
      });
    }
  };

  // Bind real user data from AuthContext
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [email, setEmail] = useState(currentUser.email || '');

  const handleSave = async () => {
    if (!fullName.trim()) {
      showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng nhập họ tên của bạn.', type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const data = await apiAuth.updateProfile({
        patientId: currentUser.patientId,
        fullName: fullName.trim(),
        email: email.trim(),
      });
      if (data.success) {
        setCurrentUser(prev => ({ ...prev, fullName: fullName.trim(), email: email.trim() }));
        showAlert({
          title: 'Cập nhật thành công',
          message: 'Thông tin hồ sơ của bạn đã được lưu.',
          type: 'success',
          onConfirm: () => navigation.goBack()
        });
      } else {
        showAlert({ title: 'Lỗi', message: data.message || 'Không thể cập nhật thông tin.', type: 'error' });
      }
    } catch (err: any) {
      showAlert({ title: 'Lỗi kết nối', message: err.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#1F2937' }]}>
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('account_info')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
            <Text style={[styles.saveText, isDarkMode && { color: '#60A5FA' }]}>{t('save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatarBox, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]}>
            <Ionicons name="person" size={50} color={isDarkMode ? '#9CA3AF' : COLORS.primary} />
            <TouchableOpacity style={[styles.editAvatarBtn, isDarkMode && { borderColor: '#1F2937', backgroundColor: '#60A5FA' }]}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.usernameText, isDarkMode && { color: '#F3F4F6' }]}>{currentUser.fullName?.toUpperCase()}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && { color: '#D1D5DB' }]}>{t('username_phone')}</Text>
          <View style={[styles.inputWrapper, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}>
            <Ionicons name="call-outline" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isDarkMode && { color: '#F3F4F6' }]}
              value={currentUser.phone}
              editable={false}
            />
            <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
          </View>
          <Text style={styles.helperText}>{t('phone_unchangeable_msg')}</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && { color: '#D1D5DB' }]}>{t('display_name')}</Text>
          <View style={[styles.inputWrapper, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}>
            <Ionicons name="person-outline" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isDarkMode && { color: '#F3F4F6' }]}
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor={isDarkMode ? '#9CA3AF' : COLORS.placeholder}
              placeholder={t('enter_display_name')}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && { color: '#D1D5DB' }]}>{t('email')}</Text>
          <View style={[styles.inputWrapper, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}>
            <Ionicons name="mail-outline" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isDarkMode && { color: '#F3F4F6' }]}
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={isDarkMode ? '#9CA3AF' : COLORS.placeholder}
              placeholder={t('enter_email')}
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />

        <Text style={[styles.sectionTitle, isDarkMode && { color: '#D1D5DB' }]}>{t('security')}</Text>

        <View style={[styles.settingRow, SHADOWS.card, isDarkMode && { backgroundColor: '#374151' }]}>
          <View style={styles.settingInfo}>
            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE' }]}>
              <Ionicons name="finger-print" size={22} color={isDarkMode ? '#38BDF8' : '#0284C7'} />
            </View>
            <View>
              <Text style={[styles.settingTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('biometrics_login')}</Text>
              <Text style={[styles.settingDesc, isDarkMode && { color: '#9CA3AF' }]}>{t('biometrics_desc')}</Text>
            </View>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={handleToggleBiometrics}
            trackColor={{ false: isDarkMode ? '#4B5563' : '#D1D5DB', true: isDarkMode ? '#60A5FA' : COLORS.primary }}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F9FAFB',
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingDesc: {
    fontSize: 13,
    color: COLORS.placeholder,
    marginTop: 2,
  }
});

export default AccountSettingsScreen;
