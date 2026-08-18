/**
 * biometricService.ts
 *
 * Handles Face ID / fingerprint authentication logic.
 * Uses expo-local-authentication for biometric prompt and
 *  * expo-secure-store to securely persist user tokens between sessions.
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
 *
 * cross-platform storage to securely persist user tokens between sessions.
 */

import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { storage } from "./storage";

const TOKEN_KEY = "dtt_user_token";
const PHONE_KEY = "dtt_user_phone";
const BIOMETRIC_ENABLED_KEY = "dtt_biometric_enabled";
// Hồ sơ đầy đủ (patientId/fullName/email/verificationStatus...) trả về lúc đăng nhập bằng
// mật khẩu — lưu lại để khôi phục đúng AuthContext.currentUser khi đăng nhập lại bằng Face ID,
// KHÔNG được để currentUser rơi về giá trị mặc định hardcode (patientId: 2) như trước đây.
const USER_DATA_KEY = "dtt_user_data";

// ─── Save token after successful password login ────────────────────────────────
export const saveTokenForBiometric = async (
  token: string,
  phone: string,
  userData?: any,
): Promise<void> => {
  await storage.setItem(TOKEN_KEY, token);
  await storage.setItem(PHONE_KEY, phone);
  await storage.setItem(BIOMETRIC_ENABLED_KEY, "true");
  if (userData) {
    //await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
    await storage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }
};

// ─── Check if biometric login is set up ───────────────────────────────────────
export const isBiometricEnabled = async (): Promise<boolean> => {
  //const flag = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  //return flag === 'true';
  const flag = await storage.getItem(BIOMETRIC_ENABLED_KEY);
  return flag === "true";
};

// ─── Clear saved token (logout / disable biometric) ──────────────────────────
export const clearBiometricToken = async (): Promise<void> => {
  // await SecureStore.deleteItemAsync(TOKEN_KEY);
  // await SecureStore.deleteItemAsync(PHONE_KEY);
  // await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  // await SecureStore.deleteItemAsync(USER_DATA_KEY);
  await storage.removeItem(TOKEN_KEY);
  await storage.removeItem(PHONE_KEY);
  await storage.removeItem(BIOMETRIC_ENABLED_KEY);
  await storage.removeItem(USER_DATA_KEY);
};

// ─── Check device hardware support ────────────────────────────────────────────
export type BiometricCapability = {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: LocalAuthentication.AuthenticationType[] | null;
};

export const checkBiometricCapability =
  async (): Promise<BiometricCapability> => {
    if (Platform.OS === "web") {
      return { hasHardware: false, isEnrolled: false, biometryType: null };
    }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      const biometryType = hasHardware
        ? await LocalAuthentication.supportedAuthenticationTypesAsync()
        : null;
      return { hasHardware, isEnrolled, biometryType };
    } catch (e) {
      console.warn("Check biometric capability error:", e);
      return { hasHardware: false, isEnrolled: false, biometryType: null };
    }
  };

// ─── Main: Authenticate with biometrics and return token ─────────────────────
export type BiometricLoginResult =
  | { success: true; token: string; phone: string; userData: any }
  | {
      success: false;
      reason:
        | "no_hardware"
        | "not_enrolled"
        | "not_setup"
        | "auth_failed"
        | "cancelled";
    };

export const loginWithBiometric = async (): Promise<BiometricLoginResult> => {
  // 1. Check hardware
  const { hasHardware, isEnrolled } = await checkBiometricCapability();

  if (!hasHardware) {
    return { success: false, reason: "no_hardware" };
  }
  if (!isEnrolled) {
    return { success: false, reason: "not_enrolled" };
  }

  // 2. Check if we have a token saved from a previous login
  const biometricEnabled = await isBiometricEnabled();
  if (!biometricEnabled) {
    return { success: false, reason: "not_setup" };
  }

  // 3. Show system Face ID / fingerprint prompt
  try {
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Đăng nhập vào DTT Healthcare",
      fallbackLabel: "Sử dụng mật khẩu",
      cancelLabel: "Hủy",
      disableDeviceFallback: false,
    });

    if (!authResult.success) {
      const reason =
        authResult.error === "user_cancel" ? "cancelled" : "auth_failed";
      return { success: false, reason };
    }
  } catch (e) {
    console.warn("Biometric auth error:", e);
    return { success: false, reason: "auth_failed" };
  }

  // 4. Biometric approved — retrieve the saved token + hồ sơ đầy đủ từ lần đăng nhập mật khẩu gần nhất
  // const token = await SecureStore.getItemAsync(TOKEN_KEY);
  // const phone = await SecureStore.getItemAsync(PHONE_KEY);
  // const userDataRaw = await SecureStore.getItemAsync(USER_DATA_KEY);

  const token = await storage.getItem(TOKEN_KEY);
  const phone = await storage.getItem(PHONE_KEY);
  const userDataRaw = await storage.getItem(USER_DATA_KEY);

  if (!token || !phone || !userDataRaw) {
    return { success: false, reason: "not_setup" };
  }

  let userData: any;
  try {
    userData = JSON.parse(userDataRaw);
  } catch {
    return { success: false, reason: "not_setup" };
  }

  return { success: true, token, phone, userData };
};
