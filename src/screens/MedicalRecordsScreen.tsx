import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

const TABS = [
  { id: 'phieu-kham', titleKey: 'exam_ticket', icon: 'document-text' },
  { id: 'toa-thuoc', titleKey: 'prescription', icon: 'medkit' },
  { id: 'xet-nghiem', titleKey: 'tests', icon: 'flask' },
  { id: 'sieu-am', titleKey: 'ultrasound', icon: 'scan' },
  { id: 'hoa-don', titleKey: 'invoice', icon: 'receipt' },
];

const MOCK_RECORDS = {
  'phieu-kham': [
    { id: 1, date: '21/07/2026', doctor: 'BS. Lê Thị B', clinicKey: 'pediatrics', code: 'PK-20260721-01' },
    { id: 2, date: '15/05/2026', doctor: 'BS. Nguyễn Văn A', clinicKey: 'general_internal', code: 'PK-20260515-02' },
    { id: 3, date: '10/02/2026', doctor: 'BS. Nguyễn Thị C', clinicKey: 'obstetrics', code: 'PK-20260210-03' },
  ],
  'toa-thuoc': [
    { id: 1, date: '21/07/2026', doctor: 'BS. Lê Thị B', clinicKey: 'pediatrics', items: 'Paracetamol, Vitamin C', code: 'TT-20260721-01' },
    { id: 2, date: '15/05/2026', doctor: 'BS. Nguyễn Văn A', clinicKey: 'general_internal', items: 'Amoxicillin, Omeprazole', code: 'TT-20260515-02' },
  ],
  'xet-nghiem': [
    { id: 1, date: '15/05/2026', clinicKey: 'general_internal', type: 'Xét nghiệm máu tổng quát', result: 'Bình thường', code: 'XN-20260515-02' },
    { id: 2, date: '10/02/2026', clinicKey: 'obstetrics', type: 'Siêu âm thai', result: 'Bình thường', code: 'XN-20260210-03' },
  ],
  'sieu-am': [
    { id: 1, date: '10/02/2026', clinicKey: 'obstetrics', type: 'Siêu âm 4D', result: 'Thai nhi khỏe mạnh', code: 'SA-20260210-01' },
  ],
  'hoa-don': [
    { id: 1, date: '21/07/2026', doctor: 'BS. Lê Thị B', clinicKey: 'pediatrics', items: 'Công khám Nhi khoa, Thuốc', code: 'HD-20260721-01' },
    { id: 2, date: '15/05/2026', doctor: 'BS. Nguyễn Văn A', clinicKey: 'general_internal', items: 'Công khám Nội TQ, Xét nghiệm máu', code: 'HD-20260515-02' },
  ]
};

const MedicalRecordsScreen = ({ route, navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  // Get initial tab from route params, default to 'phieu-kham'
  const initialTab = route.params?.initialTab || 'phieu-kham';
  const filterSpecialty = route.params?.specialty;
  
  const [activeTab, setActiveTab] = useState(initialTab);

  const getFilteredRecords = (): any[] => {
    let records = (MOCK_RECORDS as any)[activeTab] || [];
    if (filterSpecialty) {
      records = records.filter((r: any) => r.clinicKey === filterSpecialty || t(r.clinicKey) === filterSpecialty);
    }
    return records;
  };
  
  const filteredRecords = getFilteredRecords();

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={64} color={isDarkMode ? '#374151' : '#E5E7EB'} />
      <Text style={[styles.emptyText, isDarkMode && { color: '#9CA3AF' }]}>{t('no_data') || 'Chưa có dữ liệu'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#111827' }]}>
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#F3F4F6' : COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('medical_records')} {filterSpecialty ? `- ${t(filterSpecialty) || filterSpecialty}` : ''}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsWrapper, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isDarkMode && { backgroundColor: '#374151' }, activeTab === tab.id && styles.tabBtnActive, activeTab === tab.id && isDarkMode && { backgroundColor: '#3730A3' }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.id ? (isDarkMode ? '#818CF8' : COLORS.primary) : (isDarkMode ? '#9CA3AF' : COLORS.placeholder)} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, isDarkMode && { color: '#9CA3AF' }, activeTab === tab.id && styles.tabTextActive, activeTab === tab.id && isDarkMode && { color: '#818CF8' }]}>
                {t(tab.titleKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {filteredRecords.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredRecords as any[]}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }: any) => (
                <TouchableOpacity 
                style={[styles.recordCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]} 
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('DocumentViewer', {
                    title: TABS.find(t => t.id === activeTab)?.titleKey ? t(TABS.find(t => t.id === activeTab)!.titleKey) : 'Hồ sơ',
                    specialty: t(item.clinicKey),
                    date: item.date,
                    patientName: 'Nguyễn Văn Bệnh Nhân'
                  });
                }}
              >
                <View style={styles.recordHeader}>
                  <View style={[styles.dateBadge, isDarkMode && { backgroundColor: '#3730A3' }]}>
                    <Ionicons name="calendar" size={14} color={isDarkMode ? '#818CF8' : COLORS.primary} />
                    <Text style={[styles.dateText, isDarkMode && { color: '#818CF8' }]}>{item.date}</Text>
                  </View>
                  <Text style={[styles.codeText, isDarkMode && { color: '#9CA3AF' }]}>{item.code}</Text>
                </View>

                <View style={[styles.divider, isDarkMode && { backgroundColor: '#374151' }]} />

                <View style={styles.recordBody}>
                  {activeTab === 'phieu-kham' && (
                    <>
                      <Text style={[styles.recordTitle, isDarkMode && { color: '#F3F4F6' }]}>{t(item.clinicKey)}</Text>
                      <Text style={[styles.recordSub, isDarkMode && { color: '#9CA3AF' }]}>{item.doctor.replace('BS.', t('dr'))}</Text>
                    </>
                  )}
                  {activeTab === 'toa-thuoc' && (
                    <>
                      <Text style={[styles.recordTitle, isDarkMode && { color: '#F3F4F6' }]}>{item.items}</Text>
                      <Text style={[styles.recordSub, isDarkMode && { color: '#9CA3AF' }]}>Kê bởi: {item.doctor.replace('BS.', t('dr'))}</Text>
                    </>
                  )}
                  {activeTab === 'xet-nghiem' && (
                    <>
                      <Text style={[styles.recordTitle, isDarkMode && { color: '#F3F4F6' }]}>{item.type}</Text>
                      <Text style={[styles.recordSub, isDarkMode && { color: '#9CA3AF' }]}>Kết quả: <Text style={{ color: '#10B981' }}>{item.result}</Text></Text>
                    </>
                  )}
                  {activeTab === 'sieu-am' && (
                    <>
                      <Text style={[styles.recordTitle, isDarkMode && { color: '#F3F4F6' }]}>{item.type}</Text>
                      <Text style={[styles.recordSub, isDarkMode && { color: '#9CA3AF' }]}>KTV/BS: {t(item.clinicKey)}</Text>
                    </>
                  )}
                  {activeTab === 'hoa-don' && (
                    <>
                      <Text style={[styles.recordTitle, isDarkMode && { color: '#F3F4F6' }]}>{item.items}</Text>
                      <Text style={[styles.recordSub, isDarkMode && { color: '#9CA3AF' }]}>Khoa: {t(item.clinicKey)}</Text>
                    </>
                  )}
                </View>
                
                <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#9CA3AF' : COLORS.placeholder} style={styles.chevron} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  
  tabsWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: {
    backgroundColor: '#E0E7FF',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.placeholder,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  contentContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  codeText: {
    fontSize: 12,
    color: COLORS.placeholder,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  recordBody: {
    paddingRight: 24,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  recordSub: {
    fontSize: 14,
    color: COLORS.placeholder,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '60%',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.placeholder,
    marginTop: 12,
  },
});

export default MedicalRecordsScreen;
