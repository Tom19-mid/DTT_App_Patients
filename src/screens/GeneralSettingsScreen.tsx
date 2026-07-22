import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';

const GeneralSettingsScreen = ({ navigation }: any) => {
  const { showAlert } = useCustomAlert();
  const { language, setLanguage, isDarkMode, setIsDarkMode, t } = useSettings();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLanguageSelect = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
  };

  const handleClearCache = () => {
    showAlert({
      title: t('clear_cache_title'),
      message: t('clear_cache_msg'),
      type: 'warning',
      showCancel: true,
      onConfirm: () => showAlert({ title: t('success'), message: t('freed_cache'), type: 'success' })
    });
  };

  const renderSettingRow = (icon: string, title: string, subtitle?: string, rightElement?: React.ReactNode, onPress?: () => void) => (
    <TouchableOpacity 
      style={[styles.settingRow, isDarkMode && { backgroundColor: '#1F2937' }]} 
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={styles.settingInfo}>
        <View style={[styles.iconBox, isDarkMode && { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
          <Ionicons name={icon as any} size={22} color={isDarkMode ? '#60A5FA' : COLORS.primary} />
        </View>
        <View>
          <Text style={[styles.settingTitle, isDarkMode && { color: '#F3F4F6' }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingDesc, isDarkMode && { color: '#9CA3AF' }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#1F2937' }]}>
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('general_settings') || 'Cài đặt chung'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={[styles.sectionTitle, isDarkMode && { color: '#9CA3AF' }]}>{t('ui_customization')}</Text>
        <View style={[styles.card, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
          {renderSettingRow('language', t('language'), language === 'vi' ? t('vietnamese') : t('english'), undefined, handleLanguageSelect)}
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />
          {renderSettingRow(
            'moon', 
            t('dark_mode'), 
            t('dark_mode_desc'),
            <Switch 
              value={isDarkMode} 
              onValueChange={setIsDarkMode} 
              trackColor={{ false: isDarkMode ? '#4B5563' : '#D1D5DB', true: isDarkMode ? '#60A5FA' : COLORS.primary }}
            />
          )}
        </View>

        <Text style={[styles.sectionTitle, isDarkMode && { color: '#9CA3AF' }]}>{t('app_notifications')}</Text>
        <View style={[styles.card, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
          {renderSettingRow(
            'notifications', 
            t('push_notifications'), 
            t('push_desc'),
            <Switch 
              value={notificationsEnabled} 
              onValueChange={setNotificationsEnabled} 
              trackColor={{ false: isDarkMode ? '#4B5563' : '#D1D5DB', true: isDarkMode ? '#60A5FA' : COLORS.primary }}
            />
          )}
        </View>

        <Text style={[styles.sectionTitle, isDarkMode && { color: '#9CA3AF' }]}>{t('system')}</Text>
        <View style={[styles.card, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]}>
          {renderSettingRow('trash-bin', t('clear_cache'), `45 ${t('cache_desc')}`, undefined, handleClearCache)}
          <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />
          {renderSettingRow('information-circle', t('app_version'), `${t('version')} 1.0.0`)}
        </View>

      </ScrollView>
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
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.placeholder, marginBottom: 8, marginTop: 12, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8, marginBottom: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  settingTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  settingDesc: { fontSize: 13, color: COLORS.placeholder, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 68 },
});

export default GeneralSettingsScreen;
