/**
 * apiService.ts
 *
 * REST API client module connecting the React Native Patient App
 * to the ASP.NET Core Web API backend (DTT_Backend_API).
 *
 * BASE_URL NOTE:
 * - Android Emulator: 'http://10.0.2.2:5000/api'
 * - Physical Phone / LAN: 'http://<YOUR_LOCAL_IP>:5000/api'
 */

import Platform from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Change this to your computer's local Wi-Fi IP when testing on a physical phone
const LOCAL_IP = '10.0.2.2'; // Standard Android Emulator host loopback
export const BASE_URL = `http://${LOCAL_IP}:5000/api`;

const TOKEN_KEY = 'dtt_user_token';

// ── Helper for HTTP requests ──────────────────────────────────────────────────
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Đã xảy ra lỗi khi kết nối máy chủ');
  }

  return data as T;
}

// ── Auth APIs ──────────────────────────────────────────────────────────────────
export const apiAuth = {
  login: (phone: string, password: string) =>
    request<{ token: string; userId: string; patientId: number; fullName: string; phone: string; email: string; verificationStatus: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      }
    ),

  register: (fullName: string, phone: string, email: string, password: string) =>
    request<{ token: string; userId: string; patientId: number; fullName: string; phone: string; email: string; verificationStatus: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ fullName, phone, email, password }),
      }
    ),
};

// ── Medical Data APIs ─────────────────────────────────────────────────────────
export const apiMedical = {
  getSpecialties: () =>
    request<Array<{ specialtyId: number; specialtyName: string; description: string }>>('/specialties'),

  getDoctors: (specialtyId?: number) =>
    request<Array<{ doctorId: number; fullName: string; degree: string; experienceYears: number; rating: number }>>(
      `/doctors${specialtyId ? `?specialtyId=${specialtyId}` : ''}`
    ),
};
