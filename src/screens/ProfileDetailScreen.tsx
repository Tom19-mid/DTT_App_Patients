import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth, PatientProfile } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];
const RELATIONSHIP_OPTIONS = ['Vợ/Chồng', 'Con', 'Cha', 'Mẹ', 'Anh/Chị/Em', 'Ông/Bà', 'Khác'];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 120 }, (_, i) => CURRENT_YEAR - i);

const pad2 = (n: number) => n.toString().padStart(2, '0');

// Chỉ giữ lại chữ số — trước đây SĐT/CCCD/BHYT là TextInput tự do, keyboardType chỉ là gợi ý bàn phím
// ảo (không chặn được dán/gõ chữ cái thật sự), nên nhập gì cũng được dù có vẻ như ô nhập số.
const digitsOnly = (val: string) => val.replace(/[^0-9]/g, '');

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

  const [saving, setSaving] = useState(false);

  // Ngày sinh: parse "DD/MM/YYYY" hiện có (nếu có) để mở picker đúng ngay tại giá trị đang chọn,
  // thay vì luôn bắt đầu lại từ hôm nay.
  const parsedDob = useMemo(() => {
    const parts = (formData.dob || '').split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= YEARS[YEARS.length - 1] && y <= CURRENT_YEAR) {
        return { day: d, month: m, year: y };
      }
    }
    return { day: 1, month: 1, year: CURRENT_YEAR - 20 };
  }, [formData.dob]);

  const [isDobPickerVisible, setDobPickerVisible] = useState(false);
  const [tempDob, setTempDob] = useState(parsedDob);
  const [isGenderPickerVisible, setGenderPickerVisible] = useState(false);
  const [isRelationshipPickerVisible, setRelationshipPickerVisible] = useState(false);

  const openDobPicker = () => {
    setTempDob(parsedDob);
    setDobPickerVisible(true);
  };

  const confirmDob = () => {
    handleChange('dob', `${pad2(tempDob.day)}/${pad2(tempDob.month)}/${tempDob.year}`);
    setDobPickerVisible(false);
  };

  const handleSave = async () => {
    if (!formData.name) {
      showAlert({ title: 'Lỗi', message: 'Vui lòng nhập họ tên.', type: 'error' });
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      if (isNew) {
        // Phải await + đợi kết quả thật từ backend rồi mới báo "Thành công" — trước đây gọi addProfile
        // xong hiện alert thành công ngay lập tức, không quan tâm API có thật sự lưu được vào DB hay
        // không (vd tài khoản chưa xác thực CCCD bị backend từ chối), khiến người dùng tưởng đã thêm
        // hồ sơ thành công dù thực tế CSDL không hề có bản ghi này.
        await addProfile(formData as Omit<PatientProfile, 'id' | 'patientId' | 'isVerified'>);
        showAlert({ title: 'Thành công', message: 'Đã thêm hồ sơ mới.', type: 'success', onConfirm: () => navigation.goBack() });
      } else {
        await updateProfile(profileId, formData);
        showAlert({ title: 'Thành công', message: 'Đã cập nhật hồ sơ.', type: 'success', onConfirm: () => navigation.goBack() });
      }
    } catch (e: any) {
      showAlert({
        title: isNew ? 'Không thể thêm hồ sơ' : 'Không thể cập nhật hồ sơ',
        message: e?.message || 'Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setSaving(false);
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
      onConfirm: async () => {
        try {
          await deleteProfile(profileId);
          navigation.goBack();
        } catch (e: any) {
          showAlert({
            title: 'Không thể xóa hồ sơ',
            message: e?.message || 'Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.',
            type: 'error',
          });
        }
      }
    });
  };

  const renderInput = (label: string, value: string | undefined, key: keyof PatientProfile, placeholder: string, keyboardType: any = 'default', editable: boolean = true, maxLength?: number, filterNumeric: boolean = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.inputDisabled, SHADOWS.input]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(val) => handleChange(key, filterNumeric ? digitsOnly(val) : val)}
          placeholder={placeholder}
          keyboardType={keyboardType}
          editable={editable}
          maxLength={maxLength}
        />
      </View>
    </View>
  );

  // Dropdown chọn 1 trong các lựa chọn có sẵn (Giới tính/Mối quan hệ) — trước đây là ô nhập tự do,
  // gõ gì cũng được (kể cả giá trị vô nghĩa như "asdf") thay vì đúng 1 trong các giá trị hợp lệ.
  const renderDropdown = (label: string, value: string | undefined, placeholder: string, onPress: () => void, editable: boolean = true) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.inputWrapper, styles.dropdownRow, !editable && styles.inputDisabled, SHADOWS.input]}
        activeOpacity={editable ? 0.7 : 1}
        onPress={editable ? onPress : undefined}
      >
        <Text style={value ? styles.dropdownValueText : styles.dropdownPlaceholderText}>
          {value || placeholder}
        </Text>
        {editable && <Ionicons name="chevron-down" size={18} color={COLORS.placeholder} />}
      </TouchableOpacity>
    </View>
  );

  const renderOptionPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: string[],
    selectedValue: string | undefined,
    onSelect: (val: string) => void,
  ) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalContent, SHADOWS.card]} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = item === selectedValue;
              return (
                <TouchableOpacity
                  style={[styles.optionRow, isSelected && styles.optionRowActive]}
                  onPress={() => { onSelect(item); onClose(); }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{item}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderDobPickerModal = () => (
    <Modal visible={isDobPickerVisible} transparent animationType="fade" onRequestClose={() => setDobPickerVisible(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDobPickerVisible(false)}>
        <View style={[styles.modalContent, SHADOWS.card]} onStartShouldSetResponder={() => true}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn ngày sinh</Text>
            <TouchableOpacity onPress={() => setDobPickerVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.dobColumnsRow}>
            <View style={styles.dobColumn}>
              <Text style={styles.dobColumnLabel}>Ngày</Text>
              <FlatList
                data={DAYS}
                keyExtractor={(item) => `d${item}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.dobOption, item === tempDob.day && styles.dobOptionActive]}
                    onPress={() => setTempDob(prev => ({ ...prev, day: item }))}
                  >
                    <Text style={[styles.dobOptionText, item === tempDob.day && styles.dobOptionTextActive]}>{pad2(item)}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.dobColumn}>
              <Text style={styles.dobColumnLabel}>Tháng</Text>
              <FlatList
                data={MONTHS}
                keyExtractor={(item) => `m${item}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.dobOption, item === tempDob.month && styles.dobOptionActive]}
                    onPress={() => setTempDob(prev => ({ ...prev, month: item }))}
                  >
                    <Text style={[styles.dobOptionText, item === tempDob.month && styles.dobOptionTextActive]}>{pad2(item)}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={styles.dobColumn}>
              <Text style={styles.dobColumnLabel}>Năm</Text>
              <FlatList
                data={YEARS}
                keyExtractor={(item) => `y${item}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.dobOption, item === tempDob.year && styles.dobOptionActive]}
                    onPress={() => setTempDob(prev => ({ ...prev, year: item }))}
                  >
                    <Text style={[styles.dobOptionText, item === tempDob.year && styles.dobOptionTextActive]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.dobConfirmBtn} onPress={confirmDob}>
            <Text style={styles.dobConfirmBtnText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
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
                {renderDropdown('Ngày sinh', formData.dob, 'DD/MM/YYYY', openDobPicker)}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                {renderDropdown('Giới tính', formData.gender, 'Chọn giới tính', () => setGenderPickerVisible(true))}
              </View>
            </View>

            {renderDropdown(
              'Mối quan hệ',
              formData.relationship,
              'Chọn mối quan hệ',
              () => setRelationshipPickerVisible(true),
              isNew || existingProfile?.relationship !== 'Bản thân',
            )}
            {renderInput('Số điện thoại', formData.phone, 'phone', 'Nhập số điện thoại', 'phone-pad', true, 10, true)}
            {renderInput('Số CCCD/CMND', formData.cccd, 'cccd', 'Nhập số CCCD', 'numeric', existingProfile?.relationship !== 'Bản thân' || !existingProfile?.isVerified, 12, true)}
            {renderInput('Mã thẻ BHYT (nếu có)', formData.bhyt, 'bhyt', 'Nhập mã thẻ BHYT', 'numeric', true, 15, true)}
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

      {renderDobPickerModal()}
      {renderOptionPickerModal(
        isGenderPickerVisible,
        () => setGenderPickerVisible(false),
        'Chọn giới tính',
        GENDER_OPTIONS,
        formData.gender,
        (val) => handleChange('gender', val),
      )}
      {renderOptionPickerModal(
        isRelationshipPickerVisible,
        () => setRelationshipPickerVisible(false),
        'Chọn mối quan hệ',
        RELATIONSHIP_OPTIONS,
        formData.relationship,
        (val) => handleChange('relationship', val),
      )}
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

  // Dropdown (Ngày sinh/Giới tính/Mối quan hệ)
  dropdownRow: { justifyContent: 'space-between' },
  dropdownValueText: { fontSize: 15, color: COLORS.text },
  dropdownPlaceholderText: { fontSize: 15, color: COLORS.placeholder },

  // Modal dùng chung cho picker Giới tính/Mối quan hệ/Ngày sinh
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', maxWidth: 400, maxHeight: '75%', backgroundColor: '#fff', borderRadius: 20, padding: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  modalCloseBtn: { padding: 4 },
  optionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4,
  },
  optionRowActive: { backgroundColor: '#EFF6FF' },
  optionText: { fontSize: 15, color: COLORS.text },
  optionTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Picker Ngày sinh (3 cột Ngày/Tháng/Năm)
  dobColumnsRow: { flexDirection: 'row', height: 260, marginTop: 8 },
  dobColumn: { flex: 1, marginHorizontal: 4 },
  dobColumnLabel: { fontSize: 12, fontWeight: '700', color: COLORS.placeholder, textAlign: 'center', marginBottom: 6 },
  dobOption: { paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginVertical: 1 },
  dobOptionActive: { backgroundColor: COLORS.primary },
  dobOptionText: { fontSize: 15, color: COLORS.text },
  dobOptionTextActive: { color: '#fff', fontWeight: '700' },
  dobConfirmBtn: {
    backgroundColor: COLORS.primary, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 16,
  },
  dobConfirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ProfileDetailScreen;
