import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

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

  const showAlert = (options: AlertOptions) => {
    setConfig(options);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    setTimeout(() => setConfig(null), 300); // clear after animation
  };

  const handleConfirm = () => {
    hideAlert();
    if (config?.onConfirm) config.onConfirm();
  };

  const handleCancel = () => {
    hideAlert();
    if (config?.onCancel) config.onCancel();
  };

  const getIcon = () => {
    switch (config?.type) {
      case 'success': return { name: 'checkmark-circle', color: '#10B981' };
      case 'error': return { name: 'close-circle', color: '#EF4444' };
      case 'warning': return { name: 'warning', color: '#F59E0B' };
      case 'info':
      default: return { name: 'information-circle', color: COLORS.primary };
    }
  };

  const iconData = getIcon();

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.alertBox, SHADOWS.card]}>
            <View style={[styles.iconWrapper, { backgroundColor: iconData.color + '15' }]}>
              <Ionicons name={iconData.name as any} size={40} color={iconData.color} />
            </View>
            
            <Text style={styles.title}>{config?.title}</Text>
            <Text style={styles.message}>{config?.message}</Text>
            
            <View style={styles.buttonRow}>
              {config?.showCancel && (
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                  <Text style={styles.cancelText}>{config?.cancelText || 'Hủy'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.confirmButton, 
                  { backgroundColor: config?.type === 'error' || config?.type === 'warning' ? '#EF4444' : COLORS.primary }
                ]} 
                onPress={handleConfirm}
              >
                <Text style={styles.confirmText}>{config?.confirmText || 'Đồng ý'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useCustomAlert = () => useContext(AlertContext);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.placeholder,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.placeholder,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
