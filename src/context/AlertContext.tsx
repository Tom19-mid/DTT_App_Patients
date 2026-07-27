import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSettings } from './SettingsContext';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'danger' | 'destructive';

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
      case 'success':
        return { name: 'checkmark-circle', color: '#10B981', bg: '#D1FAE5', outerBg: '#ECFDF5', btnColor: '#10B981' };
      case 'danger':
      case 'destructive':
        return { name: 'warning', color: '#DC2626', bg: '#FEE2E2', outerBg: '#FFF1F2', btnColor: '#DC2626' };
      case 'error':
        return { name: 'close-circle', color: '#EF4444', bg: '#FEE2E2', outerBg: '#FEF2F2', btnColor: '#EF4444' };
      case 'warning':
        return { name: 'alert-circle', color: '#6366F1', bg: '#E0E7FF', outerBg: '#EEF2FF', btnColor: '#6366F1' }; // Electric Indigo for modern notices & reminders
      case 'info':
      default:
        return { name: 'information-circle', color: '#0284C7', bg: '#E0F2FE', outerBg: '#F0F9FF', btnColor: '#0284C7' };
    }
  };

  const iconData = getIcon();

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      {visible && (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
          <View style={styles.overlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleCancel}>
              <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
            </TouchableOpacity>
            
            <Animated.View 
              onStartShouldSetResponder={() => true}
              style={[
                styles.alertBox, 
                SHADOWS.card,
                { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
              ]}
            >
              <View style={[styles.outerIconRing, { backgroundColor: iconData.outerBg }]}>
                <View style={[styles.iconWrapper, { backgroundColor: iconData.bg }]}>
                  <Ionicons name={iconData.name as any} size={44} color={iconData.color} />
                </View>
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
                    { 
                      backgroundColor: iconData.btnColor,
                      shadowColor: iconData.btnColor,
                    }
                  ]} 
                  activeOpacity={0.85}
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
    paddingHorizontal: 26,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
    alignItems: 'center',
    elevation: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  outerIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 26,
    paddingHorizontal: 4,
    fontWeight: '400',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  confirmButton: {
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
