/**
 * biometricService.ts
 *
 * Handles Face ID / fingerprint authentication logic.
 * Uses expo-local-authentication for biometric prompt and
 * expo-secure-store to securely persist user tokens between sessions.
 *
 * HOW IT WORKS:
 *  1. After a successful password login, call saveTokenForBiometric(token) to store the token.
 *  2. On subsequent logins, call loginWithBiometric() which:
 *     a. Shows the system Face ID / fingerprint prompt.
 *     b. If approved, reads the saved token from SecureStore.
 *     c. Returns the token so the caller can call the backend API to validate it.
 *
 * BACKEND INTEGRATION (future):
 *  Replace the TODO comments below with actual API calls to your .NET Core backend.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'dtt_user_token';
const PHONE_KEY = 'dtt_user_phone';
const BIOMETRIC_ENABLED_KEY = 'dtt_biometric_enabled';

// ─── Save token after successful password login ────────────────────────────────
export const saveTokenForBiometric = async (token: string, phone: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(PHONE_KEY, phone);
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
};

// ─── Check if biometric login is set up ───────────────────────────────────────
export const isBiometricEnabled = async (): Promise<boolean> => {
  const flag = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return flag === 'true';
};

// ─── Clear saved token (logout / disable biometric) ──────────────────────────
export const clearBiometricToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(PHONE_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
};

// ─── Check device hardware support ────────────────────────────────────────────
export type BiometricCapability = {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: LocalAuthentication.AuthenticationType[] | null;
};

export const checkBiometricCapability = async (): Promise<BiometricCapability> => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
  const biometryType = hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : null;
  return { hasHardware, isEnrolled, biometryType };
};

// ─── Main: Authenticate with biometrics and return token ─────────────────────
export type BiometricLoginResult =
  | { success: true; token: string; phone: string }
  | { success: false; reason: 'no_hardware' | 'not_enrolled' | 'not_setup' | 'auth_failed' | 'cancelled' };

export const loginWithBiometric = async (): Promise<BiometricLoginResult> => {
  // 1. Check hardware
  const { hasHardware, isEnrolled } = await checkBiometricCapability();

  if (!hasHardware) {
    return { success: false, reason: 'no_hardware' };
  }
  if (!isEnrolled) {
    return { success: false, reason: 'not_enrolled' };
  }

  // 2. Check if we have a token saved from a previous login
  const biometricEnabled = await isBiometricEnabled();
  if (!biometricEnabled) {
    return { success: false, reason: 'not_setup' };
  }

  // 3. Show system Face ID / fingerprint prompt
  const authResult = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Đăng nhập vào DTT Healthcare',
    fallbackLabel: 'Sử dụng mật khẩu',
    cancelLabel: 'Hủy',
    disableDeviceFallback: false,
  });

  if (!authResult.success) {
    const reason = authResult.error === 'user_cancel' ? 'cancelled' : 'auth_failed';
    return { success: false, reason };
  }

  // 4. Biometric approved — retrieve the saved token
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const phone = await SecureStore.getItemAsync(PHONE_KEY);

  if (!token || !phone) {
    return { success: false, reason: 'not_setup' };
  }

  // TODO: (After backend integration) Validate token with .NET API:
  //   const response = await axios.post('/api/auth/refresh', { token });
  //   if (!response.data.valid) return { success: false, reason: 'auth_failed' };

  return { success: true, token, phone };
};
