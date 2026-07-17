import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CalendarScreen from '../screens/CalendarScreen';
import NotificationScreen from '../screens/NotificationScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

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

  return (
    <View style={[styles.tabBarWrapper, { bottom: Math.max(insets.bottom + 8, 20) }]}>
      <View style={styles.tabBarPill}>
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
              <View style={[styles.iconContainer, isFocused && styles.activeTab]}>
                <Ionicons
                  name={iconName}
                  size={24}
                  color={isFocused ? COLORS.text : COLORS.placeholder}
                />
              </View>
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
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
});
