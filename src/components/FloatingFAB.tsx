import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';

interface FloatingFABProps {
  navigation: any;
}

const FloatingFAB: React.FC<FloatingFABProps> = ({ navigation }) => {
  const { isDarkMode } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  const handleCall115 = () => {
    Alert.alert(
      'Cấp cứu 115',
      'Bạn có chắc chắn muốn gọi số Cấp cứu 115 không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gọi ngay 115',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:115').catch(() => {
              Alert.alert('Lỗi', 'Không thể thực hiện cuộc gọi khẩn cấp trên thiết bị này.');
            });
          },
        },
      ]
    );
  };

  // Animations
  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  const getActionStyle = (offset: number) => ({
    transform: [
      { scale: animation },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -offset],
        }),
      },
    ],
    opacity: animation,
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop overlay when open */}
      {isOpen && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      {/* Action 3: SOS 115 */}
      <Animated.View style={[styles.actionRow, getActionStyle(170)]}>
        <View style={[styles.labelCard, isDarkMode && styles.labelCardDark]}>
          <Text style={[styles.labelText, isDarkMode && styles.labelTextDark]}>Cấp cứu 115</Text>
        </View>
        <TouchableOpacity
          style={[styles.miniFab, { backgroundColor: '#EF4444' }]}
          onPress={() => { toggleMenu(); handleCall115(); }}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Action 2: Quét QR */}
      <Animated.View style={[styles.actionRow, getActionStyle(115)]}>
        <View style={[styles.labelCard, isDarkMode && styles.labelCardDark]}>
          <Text style={[styles.labelText, isDarkMode && styles.labelTextDark]}>Quét QR</Text>
        </View>
        <TouchableOpacity
          style={[styles.miniFab, { backgroundColor: '#10B981' }]}
          onPress={() => { toggleMenu(); navigation.navigate('QRScanner'); }}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Action 1: Đặt lịch */}
      <Animated.View style={[styles.actionRow, getActionStyle(60)]}>
        <View style={[styles.labelCard, isDarkMode && styles.labelCardDark]}>
          <Text style={[styles.labelText, isDarkMode && styles.labelTextDark]}>Đặt lịch khám</Text>
        </View>
        <TouchableOpacity
          style={[styles.miniFab, { backgroundColor: '#3B82F6' }]}
          onPress={() => { toggleMenu(); navigation.navigate('Booking'); }}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Trigger FAB */}
      <TouchableOpacity
        style={[styles.mainFab, SHADOWS.card, isDarkMode && { backgroundColor: '#60A5FA' }]}
        onPress={toggleMenu}
        activeOpacity={0.85}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="add" size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 95,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  mainFab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  actionRow: {
    position: 'absolute',
    right: 5, // Center aligning miniFab (44px) with mainFab (54px): (54-44)/2 = 5px
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  miniFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  labelCard: {
    marginRight: 10,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  labelCardDark: {
    backgroundColor: '#374151',
  },
  labelText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  labelTextDark: {
    color: '#F3F4F6',
  },
});

export default FloatingFAB;
