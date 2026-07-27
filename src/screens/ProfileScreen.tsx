import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, Alert, Switch } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';

const ProfileScreen = ({ navigation }: any) => {
  // TODO [DATABASE]: Remove this mock state when real API is implemented.
  const { isVerified, setIsVerified, profiles } = useAuth();
  const { showAlert } = useCustomAlert();
  const { isDarkMode, t } = useSettings();
  
  const primaryProfile = profiles.find(p => p.relationship === 'Bản thân') || profiles[0];

  const handleLogout = () => {
    showAlert({
      title: "Đăng xuất",
      message: "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      type: "warning",
      showCancel: true,
      confirmText: "Đăng xuất",
      onConfirm: () => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    });
  };

  const renderMenuItem = (icon: string, title: string, color: string = COLORS.text, onPress?: () => void) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconBox, isDarkMode && { backgroundColor: '#374151' }]}>
          <Ionicons name={icon as any} size={22} color={color === COLORS.text ? (isDarkMode ? '#D1D5DB' : color) : color} />
        </View>
        <Text style={[styles.menuItemText, { color: color === COLORS.text ? (isDarkMode ? '#F3F4F6' : color) : color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#1F2937' }]}>
      <ScrollView contentContainerStyle={[styles.container, isDarkMode && { backgroundColor: '#111827' }]} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={[styles.logoImage, SHADOWS.input]} 
            resizeMode="contain" 
          />
          <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('profile')}</Text>
        </View>

        {/* Main Profile Card */}
        <View style={[styles.card, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
          
          <View style={styles.profileTop}>
            <View style={[styles.largeAvatar, isDarkMode && { backgroundColor: '#374151' }]}>
              <Ionicons name="person" size={50} color={isDarkMode ? '#9CA3AF' : COLORS.card} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.nameText, isDarkMode && { color: '#F3F4F6' }]}>{primaryProfile?.name || 'NGUYỄN ABC'}</Text>
              <Text style={[styles.phoneText, isDarkMode && { color: '#9CA3AF' }]}>{primaryProfile?.phone || '0900031245'}</Text>
              <TouchableOpacity 
                style={[styles.infoPill, SHADOWS.input, isDarkMode && { backgroundColor: '#374151' }]}
                onPress={() => navigation.navigate('AccountSettings')}
              >
                <Ionicons name="information-circle-outline" size={16} color={isDarkMode ? '#60A5FA' : COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.infoPillText, isDarkMode && { color: '#60A5FA' }]}>{t('account_info')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                if (isVerified) {
                  navigation.navigate('MedicalRecords', { initialTab: 'phieu-kham' });
                } else {
                  showAlert({
                    title: t('access_denied'), 
                    message: t('access_denied_msg'),
                    type: 'error'
                  });
                }
              }}
            >
              <View style={[styles.statIconBox, SHADOWS.input]}>
                <Ionicons name="folder-open-outline" size={40} color={COLORS.text} />
              </View>
              <Text style={styles.statTextBlue}>{t('medical_records')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => showAlert({
                title: t('auth_status'), 
                message: isVerified ? t('auth_success') : t('auth_warning'),
                type: isVerified ? 'success' : 'warning'
              })}
            >
              <View style={[styles.statIconBox, { borderColor: isVerified ? '#28A745' : '#F59E0B', borderWidth: 2 }]}>
                <Ionicons 
                  name={isVerified ? "checkmark-circle" : "time"} 
                  size={45} 
                  color={isVerified ? "#28A745" : "#F59E0B"} 
                />
              </View>
              <Text style={[styles.statTextGreen, { color: isVerified ? '#28A745' : '#F59E0B' }]}>
                {isVerified ? t('approved') : t('pending')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />

          <Text style={[styles.sectionTitleCenter, isDarkMode && { color: '#D1D5DB' }]}>{t('patient_records')}</Text>

          <View style={[styles.subCard, isDarkMode && { backgroundColor: '#374151' }]}>
            <View style={styles.subCardLeft}>
              <Ionicons name="person-circle" size={40} color={isDarkMode ? '#60A5FA' : "#6c8cf5"} style={{ marginRight: 12 }} />
              <View>
                <Text style={[styles.subName, isDarkMode && { color: '#F3F4F6' }]}>{primaryProfile?.name || 'NGUYỄN ABC'} <Text style={styles.subId}>{primaryProfile?.patientId}</Text></Text>
                <Text style={[styles.subDetail, isDarkMode && { color: '#9CA3AF' }]}>{primaryProfile?.gender} • {primaryProfile?.dob}</Text>
                <Text style={[styles.subDetail, isDarkMode && { color: '#9CA3AF' }]}>CCCD: {primaryProfile?.cccd || t('updating')}</Text>
                <Text style={[styles.subDetail, isDarkMode && { color: '#9CA3AF' }]}>BHYT: {primaryProfile?.bhyt || t('updating')}</Text>
                <Text style={[styles.subDetail, { marginTop: 4 }, isDarkMode && { color: '#9CA3AF' }]}>
                  {t('auth_status')} • <Text style={{ color: isVerified ? '#28A745' : '#F59E0B', fontWeight: 'bold' }}>
                    {isVerified ? t('verified') : t('unverified')}
                  </Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.manageBtn}
              onPress={() => navigation.navigate('PatientProfiles')}
            >
              <Text style={styles.manageBtnText}>{t('manage_records')}</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Utilities Section */}
        <Text style={[styles.sectionTitleLeft, isDarkMode && { color: '#9CA3AF' }]}>{t('utilities').toUpperCase()}</Text>
        <View style={[styles.card, SHADOWS.card, { padding: 10 }, isDarkMode && { backgroundColor: '#1F2937' }]}>
          {renderMenuItem('receipt-outline', t('receipts').replace('\n', ' '), COLORS.text, () => navigation.navigate('MedicalRecords', { initialTab: 'hoa-don' }))}
          <View style={[styles.dividerLight, isDarkMode && { backgroundColor: '#374151' }]} />
          {renderMenuItem('chatbubbles-outline', t('support'), COLORS.text, () => navigation.navigate('Support'))}
          <View style={[styles.dividerLight, isDarkMode && { backgroundColor: '#374151' }]} />
          {renderMenuItem('settings-outline', t('general_settings'), COLORS.text, () => navigation.navigate('GeneralSettings'))}
        </View>

        {/* Security Section */}
        <Text style={[styles.sectionTitleLeft, isDarkMode && { color: '#9CA3AF' }]}>{t('security_account')}</Text>
        <View style={[styles.card, SHADOWS.card, { padding: 10 }, isDarkMode && { backgroundColor: '#1F2937' }]}>
          {renderMenuItem('lock-closed-outline', t('change_password'), COLORS.text, () => navigation.navigate('ChangePassword'))}
          <View style={[styles.dividerLight, isDarkMode && { backgroundColor: '#374151' }]} />
          {renderMenuItem('trash-outline', t('delete_account'), '#EF4444', () => showAlert({ 
            title: t('delete_confirm_title'), 
            message: t('delete_confirm_msg'), 
            type: 'error',
            showCancel: true,
            confirmText: t('delete_btn'),
            onConfirm: handleLogout 
          }))}
          <View style={[styles.dividerLight, isDarkMode && { backgroundColor: '#374151' }]} />
          {renderMenuItem('log-out-outline', t('logout'), '#EF4444', handleLogout)}
        </View>

        {/* Bottom padding for floating tab bar */}
        <View style={{ height: 100 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 15,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  phoneText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  infoPillText: {
    fontSize: 12,
    color: COLORS.placeholder,
    fontWeight: 'bold',
  },
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  statTextBlue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statTextGreen: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28A745',
  },
  sectionTitleCenter: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  subCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
  },
  subCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  subName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subId: {
    color: COLORS.placeholder,
    fontWeight: 'normal',
  },
  subDetail: {
    fontSize: 10,
    color: COLORS.placeholder,
    marginTop: 2,
  },
  manageBtn: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  manageBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionTitleLeft: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 5,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 54,
  },
  devToggleWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  devToggleText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
