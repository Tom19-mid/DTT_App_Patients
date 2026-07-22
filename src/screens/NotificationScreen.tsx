import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'appointment',
    title: 'Nhắc nhở lịch khám sắp tới',
    message: 'Bạn có lịch khám Nội Tổng quát với BS. Nguyễn Văn A vào lúc 09:30 ngày 26/07/2026.',
    time: '2 giờ trước',
    read: false,
    icon: 'calendar',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: '2',
    type: 'result',
    title: 'Đã có kết quả khám',
    message: 'Kết quả xét nghiệm máu của bạn vào ngày 15/05/2026 đã có. Vui lòng kiểm tra trong Hồ sơ sức khỏe.',
    time: '1 ngày trước',
    read: true,
    icon: 'flask',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: '3',
    type: 'promotion',
    title: 'Ưu đãi 20% gói Tầm soát',
    message: 'Giảm ngay 20% cho gói Tầm soát Ung thư trong tháng 7 này tại DTT Healthcare. Đặt lịch ngay!',
    time: '3 ngày trước',
    read: true,
    icon: 'gift',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: '4',
    type: 'system',
    title: 'Chào mừng bạn đến với DTT Healthcare',
    message: 'Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi. Chúc bạn một ngày tốt lành!',
    time: '1 tuần trước',
    read: true,
    icon: 'information-circle',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  }
];

const NotificationScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const { isVerified } = useAuth();
  const { showAlert } = useCustomAlert();
  const { isDarkMode, t } = useSettings();

  const filteredNotifications = notifications.filter(
    noti => activeTab === 'all' || !noti.read
  );

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handlePressNotification = (item: typeof MOCK_NOTIFICATIONS[0]) => {
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    
    setTimeout(() => {
      if (item.type === 'appointment') {
        navigation.navigate('Calendar');
      } else if (item.type === 'result') {
        if (!isVerified) {
          showAlert({
            title: 'Từ chối truy cập',
            message: 'Vui lòng mang CCCD đến quầy lễ tân bệnh viện để xác thực tài khoản trước khi xem hồ sơ y tế.',
            type: 'error'
          });
        } else {
          navigation.navigate('MedicalRecords', { initialTab: 'xet-nghiem' });
        }
      } else {
        showAlert({ title: item.title, message: item.message, type: 'info' });
      }
    }, 200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && { backgroundColor: '#1F2937' }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <Text style={[styles.headerTitle, isDarkMode && { color: '#F3F4F6' }]}>{t('notifications')}</Text>
        <TouchableOpacity style={[styles.headerRightBtn, isDarkMode && { backgroundColor: '#374151' }]} onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-done" size={20} color={isDarkMode ? '#60A5FA' : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={[styles.tabsContainer, isDarkMode && { backgroundColor: '#1F2937', borderBottomColor: '#374151' }]}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[
            styles.tabText, 
            isDarkMode && { color: '#9CA3AF' },
            activeTab === 'all' && [styles.tabTextActive, isDarkMode && { color: '#60A5FA' }]
          ]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'unread' && styles.tabBtnActive]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[
            styles.tabText, 
            isDarkMode && { color: '#9CA3AF' },
            activeTab === 'unread' && [styles.tabTextActive, isDarkMode && { color: '#60A5FA' }]
          ]}>
            Chưa đọc ({notifications.filter(n => !n.read).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={isDarkMode ? '#4B5563' : "#E5E7EB"} />
          <Text style={[styles.emptyText, isDarkMode && { color: '#9CA3AF' }]}>{t('no_notifications')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.notificationCard, 
                !item.read && styles.notificationCardUnread,
                isDarkMode && { backgroundColor: '#374151', borderBottomColor: '#4B5563' },
                !item.read && isDarkMode && { backgroundColor: '#1E3A8A' } // Darker blue for unread
              ]}
              onPress={() => handlePressNotification(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? `${item.color}33` : item.bgColor }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              
              <View style={styles.contentBox}>
                <Text style={[styles.title, !item.read && styles.titleUnread, isDarkMode && { color: '#F3F4F6' }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.message, isDarkMode && { color: '#D1D5DB' }]} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={[styles.time, isDarkMode && { color: '#9CA3AF' }]}>{item.time}</Text>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}
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
  headerRightBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabBtnActive: {
    backgroundColor: '#E0E7FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.placeholder,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  notificationCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentBox: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  titleUnread: {
    fontWeight: 'bold',
    color: '#0F172A',
  },
  message: {
    fontSize: 14,
    color: COLORS.placeholder,
    lineHeight: 20,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: 16,
    right: 16,
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

export default NotificationScreen;
