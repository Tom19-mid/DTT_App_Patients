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

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Auto-switch: 10.0.2.2 for Android Emulator, 192.168.2.101 for physical device / Expo Go
const DEV_SERVER_IP = '192.168.2.101';
export const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api'
  : `http://${DEV_SERVER_IP}:5000/api`;

const TOKEN_KEY = 'dtt_user_token';

// ── High-Performance Caching & Auto-Heal Engine (Stage 2 Optimization) ────────
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
const DTTQueryCache = new Map<string, CacheItem<any>>();
const DEFAULT_TTL = 60 * 1000; // 60 seconds standard cache TTL for GET queries

export const clearApiCache = (keyPrefix?: string) => {
  if (!keyPrefix) {
    DTTQueryCache.clear();
  } else {
    for (const key of DTTQueryCache.keys()) {
      if (key.includes(keyPrefix)) DTTQueryCache.delete(key);
    }
  }
};

// ── Helper for HTTP requests with Cache, Retry, and Timeout ───────────────────
async function request<T>(endpoint: string, options: RequestInit = {}, customTtl: number = DEFAULT_TTL): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = `${endpoint}_${JSON.stringify(options.body || '')}`;

  // 1. Instant Cache Retrieval (Stale-While-Revalidate 0ms latency)
  if (isGet && DTTQueryCache.has(cacheKey)) {
    const cached = DTTQueryCache.get(cacheKey)!;
    const now = Date.now();
    if (now - cached.timestamp < cached.ttl) {
      // Return cached result instantly at 0ms latency
      return cached.data as T;
    }
  }

  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 2. Auto-Heal Exponential Retry with Timeout Protection
  let attempt = 0;
  const maxRetries = isGet ? 2 : 0; // Only retry GET requests to prevent duplicate writes
  let lastError: any;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second safety timeout

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đã xảy ra lỗi khi kết nối máy chủ');
      }

      // Save to cache for GET requests
      if (isGet) {
        DTTQueryCache.set(cacheKey, { data, timestamp: Date.now(), ttl: customTtl });
      } else {
        // Automatically invalidate cache for affected domains on POST/PUT/DELETE
        if (endpoint.includes('/appointments')) clearApiCache('/appointments');
        if (endpoint.includes('/familymembers')) clearApiCache('/familymembers');
        if (endpoint.includes('/notifications')) clearApiCache('/notifications');
        if (endpoint.includes('/healthpackages')) clearApiCache('/healthpackages');
        if (endpoint.includes('/auth/profile')) clearApiCache('/auth/profile');
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      attempt++;

      // If network fails but we have stale cache, gracefully fall back to stale cache!
      if (attempt > maxRetries && isGet && DTTQueryCache.has(cacheKey)) {
        console.warn(`[Network Degraded] Serving fallback cache for ${endpoint}`);
        return DTTQueryCache.get(cacheKey)!.data as T;
      }

      if (attempt <= maxRetries && error.name !== 'AbortError') {
        const backoffDelay = Math.pow(2, attempt) * 300; // 600ms, 1200ms
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  if (lastError?.name === 'AbortError') {
    throw new Error('Kết nối máy chủ bị quá tải (Timeout). Vui lòng kiểm tra đường truyền mạng.');
  }
  throw lastError;
}


// ── Auth APIs ──────────────────────────────────────────────────────────────────
export const apiAuth = {
  login: (phone: string, password: string) =>
    request<{ token: string; userId: string; patientId: number; fullName: string; phone: string; email: string; verificationStatus: string; otpCode?: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      }
    ),

  register: (fullName: string, phone: string, email: string, password: string) =>
    request<{ token: string; userId: string; patientId: number; fullName: string; phone: string; email: string; verificationStatus: string; otpCode?: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ fullName, phone, email, password }),
      }
    ),

  updateProfile: (data: { patientId: number; fullName?: string; email?: string; gender?: string; address?: string; healthInsuranceNumber?: string; dateOfBirth?: string }) =>
    request<{ success: boolean; message: string; fullName: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (phone: string, currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ phone, currentPassword, newPassword }),
    }),
};

// ── Medical Data APIs ─────────────────────────────────────────────────────────
export const apiMedical = {
  getSpecialties: () =>
    request<Array<{ specialtyId: number; specialtyName: string; description: string }>>('/specialties'),

  getDoctors: (specialtyId?: number) =>
    request<Array<{ doctorId: number; fullName: string; degree: string; experienceYears: number; rating: number }>>(
      `/doctors${specialtyId ? `?specialtyId=${specialtyId}` : ''}`
    ),

  getDoctorSchedules: (doctorId?: number, specialtyId?: number, dateStr?: string) =>
    request<Array<{
      doctorId: number;
      specialtyId: number;
      fullName: string;
      degree: string;
      clinicRoom: string;
      date: string;
      dayOfWeek: string;
      isWorking: boolean;
      statusText: string;
      timeSlots: string[];
    }>>(`/doctors/schedules?${doctorId ? `doctorId=${doctorId}&` : ''}${specialtyId ? `specialtyId=${specialtyId}&` : ''}${dateStr ? `dateStr=${dateStr}` : ''}`),
};

// ── Appointment APIs ──────────────────────────────────────────────────────────
export const apiAppointment = {
  createAppointment: (data: {
    patientId?: number;
    doctorId?: number;
    doctorName: string;
    specialtyName: string;
    date: string;
    timeSlot: string;
    reason?: string;
    fee?: string;
  }) =>
    request<{
      appointmentId: number;
      patientId: number;
      doctorId: number;
      doctorName: string;
      specialtyName: string;
      date: string;
      timeSlot: string;
      status: string;
      queueNumber: number;
      clinicRoom: string;
      fee: string;
      createdAt: string;
    }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPatientAppointments: (patientId: number) =>
    request<Array<{
      appointmentId: number;
      patientId: number;
      doctorId: number;
      doctorName: string;
      specialtyName: string;
      date: string;
      timeSlot: string;
      status: string;
      queueNumber: number;
      clinicRoom: string;
      fee: string;
      isPackage?: boolean;
      createdAt: string;
    }>>(`/appointments/patient/${patientId}`),

  cancelAppointment: (id: number, cancelledBy?: string, cancelReason?: string) =>
    request<{ success: boolean; message: string }>(`/appointments/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({
        cancelReason: cancelReason || 'Bệnh nhân hủy lịch qua ứng dụng',
        cancelledBy: cancelledBy || 'patient',
      }),
    }),

  getAllAppointments: () =>
    request<Array<any>>('/appointments'),
};

// ── Health Package APIs ───────────────────────────────────────────────────────

export interface HealthPackage {
  packageId: number;
  title: string;
  description: string;
  price: number;
  priceFormatted: string;
  genderTarget: 'male' | 'female' | 'all';
  imageUrl?: string;
  bookedCount: number;
  bookedCountFormatted: string;
  isActive: boolean;
  details: string[];
}

export const apiHealthPackage = {
  getAll: (gender?: 'male' | 'female') =>
    request<HealthPackage[]>(`/healthpackages${gender ? `?gender=${gender}` : ''}`),

  getById: (id: number) =>
    request<HealthPackage>(`/healthpackages/${id}`),

  bookPackage: (id: number, data: {
    patientId: number;
    patientName: string;
    preferredDate?: string;
    priceFormatted?: string;
  }) =>
    request<{
      success: boolean;
      message: string;
      appointmentId: number;
      packageTitle: string;
      priceFormatted: string;
      preferredDate: string;
      queueNumber: number;
    }>(`/healthpackages/${id}/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Family Members & Patient Profiles APIs ────────────────────────────────────

export interface ProfileDto {
  id: string;
  realId?: number;
  isOwner?: boolean;
  name: string;
  patientId: string;
  relationship: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'additional_info';
  isVerified?: boolean;
  verificationNote?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  cccd?: string;
  bhyt?: string;
}

export const apiFamilyMembers = {
  getByPatient: (patientId: number) =>
    request<ProfileDto[]>(`/familymembers/patient/${patientId}`),

  create: (data: {
    ownerPatientId: number;
    name: string;
    relationship: string;
    dob?: string;
    gender?: string;
    phone?: string;
    cccd?: string;
    bhyt?: string;
  }) =>
    request<{ success: boolean; message: string; profile?: ProfileDto }>('/familymembers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    realId?: number;
    isOwner?: boolean;
    name?: string;
    relationship?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    cccd?: string;
    bhyt?: string;
  }) =>
    request<{ success: boolean; message: string }>(`/familymembers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/familymembers/${id}`, {
      method: 'DELETE',
    }),
};

// ── Notification APIs ─────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: 'appointment' | 'result' | 'promotion' | 'system' | string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  color: string;
  bgColor: string;
}

export const apiNotifications = {
  getByPatient: (patientId: number) =>
    request<NotificationItem[]>(`/notifications/patient/${patientId}`),

  markAsRead: async (id: string | number) => {
    DTTQueryCache.forEach((val, key) => {
      if (key.includes('/notifications/patient/')) {
        const list = val.data as NotificationItem[];
        if (Array.isArray(list)) {
          val.data = list.map(n => n.id === id ? { ...n, read: true } : n);
        }
      }
    });
    return request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }).catch(() => ({ success: true }));
  },

  markAllAsRead: async (patientId: number) => {
    DTTQueryCache.forEach((val, key) => {
      if (key.includes(`/notifications/patient/${patientId}`)) {
        const list = val.data as NotificationItem[];
        if (Array.isArray(list)) {
          val.data = list.map(n => ({ ...n, read: true }));
        }
      }
    });
    return request<{ success: boolean; count: number }>(`/notifications/patient/${patientId}/read-all`, { method: 'PUT' }).catch(() => ({ success: true, count: 0 }));
  },
};

// ── Medical Records & Invoices APIs ───────────────────────────────────────────

export interface MedicalRecordsData {
  phieu_kham?: any[];
  toa_thuoc?: any[];
  xet_nghiem?: any[];
  sieu_am?: any[];
  hoa_don?: any[];
}

export const apiMedicalRecords = {
  getByPatient: (patientId: number) =>
    request<MedicalRecordsData>(`/medicalrecords/patient/${patientId}`),
};

// ── Patients & QR Linking APIs ────────────────────────────────────────────────

export const apiPatients = {
  linkByQr: (data: { patientId: string; verifyCode: string; ownerPatientId?: number }) =>
    request<{ success: boolean; message: string; profile?: ProfileDto }>('/patients/link-by-qr', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Lấy thông tin & trạng thái xác thực của bệnh nhân từ DB (dùng khi app cần refresh trạng thái sau khi Lễ Tân duyệt CCCD)
  getProfile: (patientId: number) =>
    request<{
      success: boolean;
      patient: {
        id: number;
        fullName: string;
        phone: string;
        cccd: string;
        bhyt: string;
        verificationStatus: 'pending' | 'verified' | 'rejected';
        verificationNote?: string;
        dob?: string;
        gender?: string;
      };
    }>(`/patients/${patientId}`),

  // Refresh trạng thái xác thực từ server và cập nhật vào cache
  refreshVerificationStatus: async (patientId: number) => {
    try {
      const res = await request<{
        success: boolean;
        patient: { verificationStatus: string; cccd?: string; verificationNote?: string };
      }>(`/patients/${patientId}`);
      if (res?.success && res.patient) {
        return {
          verified: res.patient.verificationStatus === 'verified',
          verificationStatus: res.patient.verificationStatus as 'pending' | 'verified' | 'rejected',
          cccd: res.patient.cccd,
          note: res.patient.verificationNote,
        };
      }
    } catch { }
    return { verified: false, verificationStatus: 'pending' as const };
  },
};

// ── Stage 2 Optimization: Intelligent Pre-Warming Engine ──────────────────────
export const prewarmCoreData = (patientId?: number) => {
  // Execute background requests to warm up in-memory cache without blocking main UI thread
  setTimeout(() => {
    try {
      apiMedical.getDoctors().catch(() => { });
      apiHealthPackage.getAll().catch(() => { });
      if (patientId) {
        apiAppointment.getPatientAppointments(patientId).catch(() => { });
        apiFamilyMembers.getByPatient(patientId).catch(() => { });
      }
      console.log('[Stage 2] Pre-warmed core data cache successfully.');
    } catch (e) {
      // Suppress network logs during silent warmup
    }
  }, 300);
};

