import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from './SettingsContext';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showAlert = (options: AlertOptions) => {
    setConfig(options);
    setVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 180, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
    });
  };

  const handleConfirm = () => {
    const action = config?.onConfirm;
    hideAlert();
    if (action) setTimeout(action, 200);
  };

  const handleCancel = () => {
    const action = config?.onCancel;
    hideAlert();
    if (action) setTimeout(action, 200);
  };

  const getIcon = () => {
    switch (config?.type) {
      case 'success': return { name: 'checkmark-circle-sharp', color: '#10B981', bg: '#D1FAE5' };
      case 'error': return { name: 'close-circle-sharp', color: '#EF4444', bg: '#FEE2E2' };
      case 'warning': return { name: 'warning-sharp', color: '#F59E0B', bg: '#FEF3C7' };
      case 'info':
      default: return { name: 'information-circle-sharp', color: COLORS.primary, bg: '#DBEAFE' };
    }
  };

  const iconData = getIcon();

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      {visible && (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
          <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
            
            <Animated.View 
              style={[
                styles.alertBox, 
                SHADOWS.card,
                { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
              ]}
            >
              <View style={[styles.iconWrapper, { backgroundColor: iconData.bg }]}>
                <Ionicons name={iconData.name as any} size={48} color={iconData.color} />
              </View>
              
              <Text style={[styles.title, !config?.message && { marginBottom: 20 }]}>{config?.title}</Text>
              {!!config?.message && <Text style={styles.message}>{config.message}</Text>}
              
              <View style={styles.buttonRow}>
                {config?.showCancel && (
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    activeOpacity={0.8}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelText}>{config?.cancelText || 'Hủy'}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.button, 
                    styles.confirmButton, 
                    { backgroundColor: config?.type === 'error' ? '#EF4444' : config?.type === 'warning' ? '#F59E0B' : COLORS.primary }
                  ]} 
                  activeOpacity={0.8}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmText}>{config?.confirmText || 'Đồng ý'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </AlertContext.Provider>
  );
};

export const useCustomAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '400',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
