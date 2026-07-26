import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../services/apiService';

const ChangePasswordScreen = ({ navigation }: any) => {
  const { showAlert } = useCustomAlert();
  const { isDarkMode, t } = useSettings();
  const { currentUser } = useAuth();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showAlert({ title: 'Lỗi', message: 'Vui lòng điền đầy đủ các trường thông tin.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert({ title: 'Lỗi', message: 'Mật khẩu mới không khớp. Vui lòng thử lại.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      showAlert({ title: 'Cảnh báo', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentUser.phone,
          currentPassword: oldPassword,
          newPassword: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert({
          title: '🔒 Đổi mật khẩu thành công',
          message: 'Mật khẩu của bạn đã được cập nhật an toàn.',
          type: 'success',
          onConfirm: () => navigation.goBack(),
        });
      } else {
        showAlert({ title: 'Không thể đổi mật khẩu', message: data.message || 'Mật khẩu hiện tại không chính xác.', type: 'error' });
      }
    } catch {
      showAlert({ title: 'Lỗi kết nối', message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (label: string, value: string, setValue: (val: string) => void, show: boolean, setShow: (val: boolean) => void) => (
    <View style={styles.formGroup}>
      <Text style={[styles.label, isDarkMode && { color: '#D1D5DB' }]}>{label}</Text>
      <View style={[styles.inputWrapper, SHADOWS.input, isDarkMode && { backgroundColor: '#374151', borderColor: '#4B5563' }]}>
        <Ionicons name="lock-closed-outline" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.inputIcon} />
        <TextInput 
          style={[styles.input, isDarkMode && { color: '#F3F4F6' }]} 
          value={value} 
          onChangeText={setValue}
          placeholder={t('enter_password')}
          placeholderTextColor={isDarkMode ? '#9CA3AF' : COLORS.placeholder}
          secureTextEntry={!show}
        />
        <TouchableOpacity onPress={() => setShow(!show)} style={{ padding: 4 }}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#1F2937' }]}>
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('change_password') || 'Đổi mật khẩu'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          
          <View style={[styles.alertBox, isDarkMode && { backgroundColor: 'rgba(5, 150, 105, 0.2)' }]}>
            <Ionicons name="shield-checkmark" size={24} color={isDarkMode ? '#34D399' : "#059669"} />
            <Text style={[styles.alertText, isDarkMode && { color: '#34D399' }]}>
              {t('new_password_diff')}
            </Text>
          </View>

          <View style={[styles.formCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
            {renderPasswordInput(t('current_password'), oldPassword, setOldPassword, showOld, setShowOld)}
            <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />
            {renderPasswordInput(t('new_password'), newPassword, setNewPassword, showNew, setShowNew)}
            {renderPasswordInput(t('reenter_new_password'), confirmPassword, setConfirmPassword, showConfirm, setShowConfirm)}
          </View>

          <TouchableOpacity style={[styles.saveButton, SHADOWS.card]} onPress={handleChangePassword}>
            <Text style={styles.saveButtonText}>{t('update_password')}</Text>
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
  alertBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5',
    padding: 16, borderRadius: 12, marginBottom: 24,
  },
  alertText: { flex: 1, fontSize: 13, color: '#047857', lineHeight: 20, marginLeft: 12 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 16, height: 52,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8, marginBottom: 20 },
  saveButton: {
    backgroundColor: COLORS.primary, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ChangePasswordScreen;
