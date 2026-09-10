import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useCustomAlert } from '../context/AlertContext';
import { useSettings } from '../context/SettingsContext';
import { apiNotifications, NotificationItem } from '../services/apiService';
import DraggableChat from '../components/DraggableChat';

const NotificationScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { currentUser, isVerified, notificationsTick } = useAuth();
  const { showAlert } = useCustomAlert();
  const { isDarkMode, t } = useSettings();

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!currentUser?.patientId) {
      setNotifications([]);
      setLoading(false);
      if (isRefresh) setRefreshing(false);
      return;
    }
    if (!isRefresh) setLoading(true);
    try {
      const res = await apiNotifications.getByPatient(currentUser.patientId);
      if (Array.isArray(res)) {
        setNotifications(res);
      }
    } catch (err) {
      console.log('[NotificationScreen] Failed to fetch live notifications:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [currentUser?.patientId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time: Hub báo có thông báo mới (vd Admin vừa phát) — làm mới ngay không cần người dùng tự kéo refresh.
  useEffect(() => {
    if (notificationsTick > 0) fetchNotifications(true);
  }, [notificationsTick, fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const filteredNotifications = notifications.filter(
    noti => activeTab === 'all' || !noti.read
  );

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.patientId) return;
    const previous = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await apiNotifications.markAllAsRead(currentUser.patientId);
    } catch (e) {
      // Rollback nếu API thất bại — trước đây chỉ console.log, badge "chưa đọc" trên toàn app vẫn hiện
      // đã đọc hết dù backend chưa hề cập nhật, không đồng bộ với dữ liệu thật.
      setNotifications(previous);
      console.log('Error mark all read:', e);
    }
  };

  const handlePressNotification = async (item: NotificationItem) => {
    if (!item.read) {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
      try {
        await apiNotifications.markAsRead(item.id);
      } catch (e) {
        // Rollback: trả lại trạng thái "chưa đọc" nếu API thất bại, tránh badge chưa đọc lệch khỏi DB.
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: false } : n));
        console.log('Error marking as read:', e);
      }
    }
    
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
      ) : loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={isDarkMode ? '#60A5FA' : COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={isDarkMode ? '#60A5FA' : COLORS.primary}
            />
          }
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
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={13} color={isDarkMode ? '#9CA3AF' : '#9CA3AF'} style={{ marginRight: 4 }} />
                  <Text style={[styles.time, isDarkMode && { color: '#9CA3AF' }]}>{item.time}</Text>
                </View>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}

      <DraggableChat onPress={() => navigation.navigate('AIChat')} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    // Đủ chỗ chừa cho thanh tab nổi (CustomTabBar) + nút chat nổi (DraggableChat) đè lên phía dưới —
    // trước đây chỉ padding: 16 nên các thông báo cuối danh sách bị 2 lớp nổi này che khuất khi cuộn
    // hết, trông như "không hiện gì" dù dữ liệu vẫn còn.
    paddingBottom: 150,
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
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
