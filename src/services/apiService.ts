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

  markAsRead: (id: string | number) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllAsRead: (patientId: number) =>
    request<{ success: boolean; count: number }>(`/notifications/patient/${patientId}/read-all`, { method: 'PUT' }),
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
};
