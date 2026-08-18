import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Cross-platform Storage Helper
 * Uses expo-secure-store on iOS/Android for hardware-encrypted security,
 * and localStorage on Web where SecureStore is not supported.
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch (e) {
        console.warn('localStorage read error:', e);
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('SecureStore read error:', e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn('localStorage write error:', e);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('SecureStore write error:', e);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('localStorage delete error:', e);
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('SecureStore delete error:', e);
    }
  },
};
