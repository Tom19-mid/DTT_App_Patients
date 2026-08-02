import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { apiMedicalRecords } from '../services/apiService';

const TABS = [
  { id: 'phieu-kham', titleKey: 'exam_ticket', icon: 'document-text' },
  { id: 'toa-thuoc', titleKey: 'prescription', icon: 'medkit' },
  { id: 'xet-nghiem', titleKey: 'tests', icon: 'flask' },
  { id: 'sieu-am', titleKey: 'ultrasound', icon: 'scan' },
  { id: 'hoa-don', titleKey: 'invoice', icon: 'receipt' },
];

const EMPTY_RECORDS = {
  'phieu-kham': [],
  'toa-thuoc': [],
  'xet-nghiem': [],
  'sieu-am': [],
  'hoa-don': []
};

const MedicalRecordsScreen = ({ route, navigation }: any) => {
  const { isDarkMode, t } = useSettings();
  const { currentUser } = useAuth();

  const initialTab = route.params?.initialTab || 'phieu-kham';
  const filterSpecialty = route.params?.specialty;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [recordsData, setRecordsData] = useState<any>(EMPTY_RECORDS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedicalRecords = useCallback(async (isRefresh = false) => {
    if (!currentUser?.patientId) {
      setRecordsData(EMPTY_RECORDS);
      setLoading(false);
      if (isRefresh) setRefreshing(false);
      return;
    }
    if (!isRefresh && !recordsData['phieu-kham']?.length) setLoading(true);
    try {
      const res = await apiMedicalRecords.getByPatient(currentUser.patientId);
      if (res) {
        setRecordsData({
          'phieu-kham': res.phieu_kham || [],
          'toa-thuoc': res.toa_thuoc || [],
          'xet-nghiem': res.xet_nghiem || [],
          'sieu-am': res.sieu_am || [],
          'hoa-don': res.hoa_don || [],
        });
      }
    } catch (e) {
      console.log('[MedicalRecordsScreen] Error fetching medical records:', e);
      setRecordsData(EMPTY_RECORDS);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [currentUser?.patientId]);

  useEffect(() => {
    fetchMedicalRecords();
  }, [fetchMedicalRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicalRecords(true);
  };

  const getFilteredRecords = (): any[] => {
    let records = recordsData[activeTab] || [];
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
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
            <ActivityIndicator size="large" color={isDarkMode ? '#818CF8' : COLORS.primary} />
          </View>
        ) : filteredRecords.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredRecords as any[]}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={isDarkMode ? '#818CF8' : COLORS.primary}
              />
            }
            renderItem={({ item }: any) => (
                <TouchableOpacity 
                style={[styles.recordCard, SHADOWS.card, isDarkMode && { backgroundColor: '#1F2937' }]} 
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('DocumentViewer', {
                    title: TABS.find(t => t.id === activeTab)?.titleKey ? t(TABS.find(t => t.id === activeTab)!.titleKey) : 'Hồ sơ',
                    docType: activeTab, // 'phieu-kham' | 'toa-thuoc' | 'xet-nghiem' | 'sieu-am' | 'hoa-don' — dùng để chọn đúng mẫu hiển thị, không phụ thuộc title đã dịch (dễ vỡ khi đổi ngôn ngữ)
                    specialty: t(item.clinicKey),
                    date: item.date,
                    recordData: item,
                    patientName: currentUser?.fullName || 'Bệnh nhân'
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
                      <Text style={[styles.recordTitle, isDarkMode && { color: '#F3F4F6' }]}>{item.specialtyName || t(item.clinicKey) || item.clinicKey}</Text>
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
