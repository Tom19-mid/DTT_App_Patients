import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth, PatientProfile } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';

const ProfileDetailScreen = ({ route, navigation }: any) => {
  const { isNew, profileId } = route.params || {};
  const { profiles, addProfile, updateProfile, deleteProfile } = useAuth();
  const { showAlert } = useCustomAlert();

  const existingProfile = profiles.find(p => p.id === profileId);

  const [formData, setFormData] = useState<Partial<PatientProfile>>({
    name: existingProfile?.name || '',
    relationship: existingProfile?.relationship || 'Khác',
    dob: existingProfile?.dob || '',
    gender: existingProfile?.gender || 'Nam',
    phone: existingProfile?.phone || '',
    cccd: existingProfile?.cccd || '',
    bhyt: existingProfile?.bhyt || '',
  });

  const handleChange = (key: keyof PatientProfile, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!formData.name) {
      showAlert({ title: 'Lỗi', message: 'Vui lòng nhập họ tên.', type: 'error' });
      return;
    }

    if (isNew) {
      addProfile(formData as Omit<PatientProfile, 'id' | 'patientId' | 'isVerified'>);
      showAlert({ title: 'Thành công', message: 'Đã thêm hồ sơ mới.', type: 'success', onConfirm: () => navigation.goBack() });
    } else {
      updateProfile(profileId, formData);
      showAlert({ title: 'Thành công', message: 'Đã cập nhật hồ sơ.', type: 'success', onConfirm: () => navigation.goBack() });
    }
  };

  const handleDelete = () => {
    if (existingProfile?.relationship === 'Bản thân') {
      showAlert({ title: 'Lỗi', message: 'Không thể xóa hồ sơ gốc của tài khoản.', type: 'error' });
      return;
    }

    showAlert({
      title: 'Xóa hồ sơ',
      message: `Bạn có chắc chắn muốn xóa hồ sơ của ${existingProfile?.name}?`,
      type: 'warning',
      showCancel: true,
      onConfirm: () => {
        deleteProfile(profileId);
        navigation.goBack();
      }
    });
  };

  const renderInput = (label: string, value: string | undefined, key: keyof PatientProfile, placeholder: string, keyboardType: any = 'default', editable: boolean = true) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.inputDisabled, SHADOWS.input]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(val) => handleChange(key, val)}
          placeholder={placeholder}
          keyboardType={keyboardType}
          editable={editable}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? 'Thêm hồ sơ mới' : 'Chi tiết hồ sơ'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          
          {!isNew && existingProfile && (
            (() => {
              const status = existingProfile.verificationStatus || (existingProfile.isVerified ? 'verified' : 'pending');

              if (status === 'verified') {
                return (
                  <View style={[styles.statusBox, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={[styles.statusText, { color: '#10B981' }]}>
                      Hồ sơ đã được bệnh viện xác thực
                    </Text>
                  </View>
                );
              }

              if (status === 'rejected') {
                return (
                  <View style={[styles.statusBox, { backgroundColor: '#FEF2F2', flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                      <Text style={[styles.statusText, { color: '#EF4444' }]}>
                        Hồ sơ bị từ chối xác thực
                      </Text>
                    </View>
                    {existingProfile.verificationNote ? (
                      <Text style={{ fontSize: 13, color: '#991B1B', lineHeight: 18, marginLeft: 28 }}>
                        Lý do: {existingProfile.verificationNote}
                      </Text>
                    ) : null}
                  </View>
                );
              }

              // Pending
              return (
                <View style={[styles.statusBox, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="time" size={20} color="#F59E0B" />
                  <Text style={[styles.statusText, { color: '#B45309', flex: 1 }]}>
                    Hồ sơ đang chờ xác thực — Vui lòng mang CCCD đến quầy lễ tân để đối chiếu
                  </Text>
                </View>
              );
            })()
          )}

          <View style={[styles.formCard, SHADOWS.card]}>
            {renderInput('Họ và tên', formData.name, 'name', 'Nhập họ và tên', 'default', existingProfile?.relationship !== 'Bản thân')}
            
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {renderInput('Ngày sinh', formData.dob, 'dob', 'DD/MM/YYYY')}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                {renderInput('Giới tính', formData.gender, 'gender', 'Nam/Nữ')}
              </View>
            </View>

            {renderInput('Mối quan hệ', formData.relationship, 'relationship', 'Ví dụ: Bố, Mẹ, Con...', 'default', isNew || existingProfile?.relationship !== 'Bản thân')}
            {renderInput('Số điện thoại', formData.phone, 'phone', 'Nhập số điện thoại', 'phone-pad')}
            {renderInput('Số CCCD/CMND', formData.cccd, 'cccd', 'Nhập số CCCD', 'numeric', existingProfile?.relationship !== 'Bản thân' || !existingProfile?.isVerified)}
            {renderInput('Mã thẻ BHYT (nếu có)', formData.bhyt, 'bhyt', 'Nhập mã thẻ BHYT')}
          </View>

          <TouchableOpacity style={[styles.saveButton, SHADOWS.card]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Lưu hồ sơ</Text>
          </TouchableOpacity>

          {!isNew && existingProfile?.relationship !== 'Bản thân' && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>Xóa hồ sơ này</Text>
            </TouchableOpacity>
          )}

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
  statusBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF',
    padding: 12, borderRadius: 12, marginBottom: 16,
  },
  statusText: { fontSize: 14, fontWeight: '600', marginLeft: 8 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#F3F4F6',
  },
  inputDisabled: { backgroundColor: '#F3F4F6' },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  row: { flexDirection: 'row' },
  saveButton: {
    backgroundColor: COLORS.primary, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  deleteButtonText: { color: '#EF4444', fontSize: 15, fontWeight: '600', marginLeft: 6 },
});

export default ProfileDetailScreen;
