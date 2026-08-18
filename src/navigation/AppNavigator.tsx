import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { apiNotifications } from '../services/apiService';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CalendarScreen from '../screens/CalendarScreen';
import NotificationScreen from '../screens/NotificationScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OTPScreen from '../screens/OTPScreen';
import BookingScreen from '../screens/BookingScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import PackagesScreen from '../screens/PackagesScreen';
import ConfirmBookingScreen from '../screens/ConfirmBookingScreen';
import MedicalRecordsScreen from '../screens/MedicalRecordsScreen';
import SpecialtyDoctorsScreen from '../screens/SpecialtyDoctorsScreen';
import DocumentViewerScreen from '../screens/DocumentViewerScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';
import PatientProfilesScreen from '../screens/PatientProfilesScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import SupportScreen from '../screens/SupportScreen';
import GeneralSettingsScreen from '../screens/GeneralSettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import AIChatScreen from '../screens/AIChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- CUSTOM FLOATING TAB BAR ---
// Fully custom component — bypasses all React Navigation internal layout logic
// so it renders identically on both iOS and Android.
const iconMap: Record<string, { focused: string; outline: string }> = {
  Home:         { focused: 'home',          outline: 'home-outline' },
  Calendar:     { focused: 'calendar',      outline: 'calendar-outline' },
  Notification: { focused: 'notifications', outline: 'notifications-outline' },
  Profile:      { focused: 'person',        outline: 'person-outline' },
};

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useSettings();
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const checkUnread = async () => {
      try {
        if (currentUser?.patientId) {
          const res = await apiNotifications.getByPatient(currentUser.patientId);
          if (isMounted && Array.isArray(res)) {
            setUnreadCount(res.filter(n => !n.read).length);
          }
        }
      } catch (err) { }
    };

    // Trước đây poll chạy 5s/lần vô thời hạn suốt phiên đăng nhập, kể cả khi app bị đưa xuống nền
    // (không có màn hình nào hiển thị số chưa đọc để cập nhật) — tốn pin/dữ liệu di động vô ích.
    // Chỉ chạy interval khi app đang ở foreground, dừng hẳn khi bị background thay vì tiếp tục ngầm.
    const startPolling = () => {
      if (intervalId) return;
      checkUnread();
      intervalId = setInterval(checkUnread, 5000);
    };
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    if (AppState.currentState === 'active') startPolling();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') startPolling();
      else stopPolling();
    });

    return () => {
      isMounted = false;
      stopPolling();
      subscription.remove();
    };
  }, [currentUser?.patientId, state.index]);

  return (
    <View style={[styles.tabBarWrapper, { bottom: Math.max(insets.bottom + 8, 20) }]}>
      <View style={[styles.tabBarPill, isDarkMode && { backgroundColor: '#1F2937' }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const icons = iconMap[route.name] ?? { focused: 'ellipse', outline: 'ellipse-outline' };
          const iconName: any = isFocused ? icons.focused : icons.outline;

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isFocused && [styles.activeTab, isDarkMode && { backgroundColor: '#374151' }]]}>
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? (isDarkMode ? '#60A5FA' : COLORS.text) : (isDarkMode ? '#9CA3AF' : COLORS.placeholder)}
                />
              </View>
              {route.name === 'Notification' && unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Notification" component={NotificationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="Packages" component={PackagesScreen} />
        <Stack.Screen name="ConfirmBooking" component={ConfirmBookingScreen} />
        <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
        <Stack.Screen name="MedicalRecords" component={MedicalRecordsScreen} />
        <Stack.Screen name="SpecialtyDoctors" component={SpecialtyDoctorsScreen} />
        <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} />
        <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
        <Stack.Screen name="PatientProfiles" component={PatientProfilesScreen} />
        <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="GeneralSettings" component={GeneralSettingsScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="AIChat" component={AIChatScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  // Wrapper covers full width, centers the pill
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // The actual pill shape — fixed 260px, fully self-contained
  tabBarPill: {
    flexDirection: 'row',
    width: 260,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    // Shadow (Android)
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22, // Perfect circle (half of 44)
    overflow: 'hidden',
  },
  activeTab: {
    backgroundColor: '#E8E8E8',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
