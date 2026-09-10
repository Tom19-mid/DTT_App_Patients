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

import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { storage } from "./storage";

// // Auto-switch: 10.0.2.2 for Android Emulator, localhost for Web, 192.168.1.8 and 192.168.2.101 for physical device / Expo Go
// const DEV_SERVER_IP = "192.168.1.8";
// export const BASE_URL =
//   Platform.OS === "web"
//     ? "http://localhost:5000/api"
//     : Platform.OS === "android"
//       ? "http://10.0.2.2:5000/api"
//       : `http://${DEV_SERVER_IP}:5000/api`;

// Backend đã deploy lên Render (xem mục 3.6.1 báo cáo) — dùng URL này thay vì
// dò IP LAN cục bộ, để app chạy được ở bất kỳ đâu có Internet, không cần cùng
// mạng với máy chạy dotnet run nữa.
const CLOUD_BASE_URL = "https://dtt-healthcare-api.onrender.com/api";

// Đặt false nếu muốn quay lại chạy Backend cục bộ (dò IP LAN của máy chạy Expo
// Metro bundler) để phát triển/debug offline.
const USE_CLOUD_BACKEND = true;

// Tự động nhận diện IP của máy tính đang chạy Expo Metro bundler (chỉ dùng khi
// USE_CLOUD_BACKEND = false)
const getDevServerIp = (): string => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    return hostUri.split(":")[0];
  }
  return "192.168.1.6";
};

const DEV_SERVER_IP = getDevServerIp();
export const BASE_URL = USE_CLOUD_BACKEND
  ? CLOUD_BASE_URL
  : Platform.OS === "web"
    ? "http://localhost:5000/api"
    : `http://${DEV_SERVER_IP}:5000/api`;

if (__DEV__) {
  console.log(`[API Service] BASE_URL configured as: ${BASE_URL}`);
}

const TOKEN_KEY = "dtt_user_token";

// ── High-Performance Caching & Auto-Heal Engine (Stage 2 Optimization) ────────
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
const DTTQueryCache = new Map<string, CacheItem<any>>();
const DEFAULT_TTL = 60 * 1000; // 60 seconds standard cache TTL for GET queries

// Trước đây DTTQueryCache không giới hạn dung lượng — mỗi endpoint có tham số động (vd:
// getDoctorSchedules(doctorId, specialtyId, dateStr) duyệt qua nhiều bác sĩ/ngày) tạo ra 1 cacheKey
// riêng và tồn tại vĩnh viễn, phiên dùng app càng lâu càng tích tụ bộ nhớ. Giới hạn kiểu LRU đơn giản
// (Map giữ thứ tự chèn trong JS — xoá bớt entry cũ nhất khi vượt giới hạn, "chạm" lại entry khi đọc
// trúng cache để đẩy nó về cuối, giữ những gì đang dùng thường xuyên).
const MAX_CACHE_ENTRIES = 150;
function cacheGet(key: string): CacheItem<any> | undefined {
  const item = DTTQueryCache.get(key);
  if (item) {
    // Move-to-end (LRU touch)
    DTTQueryCache.delete(key);
    DTTQueryCache.set(key, item);
  }
  return item;
}
function cacheSet(key: string, item: CacheItem<any>) {
  DTTQueryCache.delete(key);
  DTTQueryCache.set(key, item);
  while (DTTQueryCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = DTTQueryCache.keys().next().value;
    if (oldestKey === undefined) break;
    DTTQueryCache.delete(oldestKey);
  }
}

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
// timeoutMs mặc định 8s cho hầu hết endpoint; endpoint nào gọi tới AI (Gemini có thể mất vài giây
// + backend tự retry 1 lần khi rớt mạng) cần truyền timeoutMs dài hơn để không tự bỏ cuộc trước khi
// backend kịp trả lời thật.
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  customTtl: number = DEFAULT_TTL,
  timeoutMs: number = 8000,
): Promise<T> {
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const cacheKey = `${endpoint}_${JSON.stringify(options.body || "")}`;

  // 1. Instant Cache Retrieval (Stale-While-Revalidate 0ms latency)
  if (isGet && DTTQueryCache.has(cacheKey)) {
    const cached = cacheGet(cacheKey)!;
    const now = Date.now();
    if (now - cached.timestamp < cached.ttl) {
      // Return cached result instantly at 0ms latency
      return cached.data as T;
    }
  }
  //const token = await SecureStore.getItemAsync(TOKEN_KET);
  const token = await storage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 2. Auto-Heal Exponential Retry with Timeout Protection
  let attempt = 0;
  const maxRetries = isGet ? 2 : 0; // Only retry GET requests to prevent duplicate writes
  let lastError: any;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);
      // KHÔNG được gọi response.json() vô điều kiện — một số phản hồi lỗi (403 Forbidden do
      // AccessControl chặn, hoặc trang lỗi HTML mặc định của ASP.NET khi debug) có body RỖNG hoặc
      // không phải JSON, khiến response.json() ném lỗi parse JSON thay vì lỗi HTTP rõ ràng, làm mọi
      // màn hình bắt lỗi hiển thị "SyntaxError: Unexpected end of JSON input" khó hiểu thay vì thông
      // báo đúng nghĩa.
      const rawText = await response.text();
      let data: any = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        const httpError: any = new Error(
          data.message ||
            (response.status === 403
              ? "Bạn không có quyền thực hiện thao tác này."
              : "Đã xảy ra lỗi khi kết nối máy chủ"),
        );
        httpError.status = response.status;
        throw httpError;
      }

      // Save to cache for GET requests
      if (isGet) {
        cacheSet(cacheKey, { data, timestamp: Date.now(), ttl: customTtl });
      } else {
        // Automatically invalidate cache for affected domains on POST/PUT/DELETE
        if (endpoint.includes("/appointments")) clearApiCache("/appointments");
        if (endpoint.includes("/familymembers"))
          clearApiCache("/familymembers");
        if (endpoint.includes("/notifications"))
          clearApiCache("/notifications");
        if (endpoint.includes("/healthpackages"))
          clearApiCache("/healthpackages");
        if (endpoint.includes("/auth/profile")) clearApiCache("/auth/profile");
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      attempt++;

      // If network fails but we have stale cache, gracefully fall back to stale cache!
      // KHÔNG áp dụng cho lỗi 401/403 (hết hạn đăng nhập / không có quyền) — đó là phản hồi THẬT
      // từ server, không phải lỗi mạng, nên trả lại stale cache sẽ che giấu việc phiên đã hết hạn
      // (vd: sau khi đăng xuất, màn hình vẫn âm thầm hiện dữ liệu cũ như chưa hề đăng xuất).
      const isAuthError = error?.status === 401 || error?.status === 403;
      if (
        attempt > maxRetries &&
        isGet &&
        !isAuthError &&
        DTTQueryCache.has(cacheKey)
      ) {
        console.warn(
          `[Network Degraded] Serving fallback cache for ${endpoint}`,
        );
        return cacheGet(cacheKey)!.data as T;
      }

      // 401/403 sẽ luôn thất bại lại y hệt khi retry với cùng token — dừng ngay thay vì thử lại vô ích.
      if (isAuthError) break;

      if (attempt <= maxRetries && error.name !== "AbortError") {
        const backoffDelay = Math.pow(2, attempt) * 300; // 600ms, 1200ms
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  if (lastError?.name === "AbortError") {
    throw new Error(
      "Kết nối máy chủ bị quá tải (Timeout). Vui lòng kiểm tra đường truyền mạng.",
    );
  }
  throw lastError;
}

// ── Auth APIs ──────────────────────────────────────────────────────────────────
export const apiAuth = {
  login: (phone: string, password: string) =>
    request<{
      token: string;
      userId: string;
      patientId: number;
      fullName: string;
      phone: string;
      email: string;
      verificationStatus: string;
      otpCode?: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),

  register: (
    fullName: string,
    phone: string,
    email: string,
    password: string,
  ) =>
    request<{
      token: string;
      userId: string;
      patientId: number;
      fullName: string;
      phone: string;
      email: string;
      verificationStatus: string;
      otpCode?: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, phone, email, password }),
    }),

  updateProfile: (data: {
    patientId: number;
    fullName?: string;
    email?: string;
    gender?: string;
    address?: string;
    healthInsuranceNumber?: string;
    dateOfBirth?: string;
  }) =>
    request<{ success: boolean; message: string; fullName: string }>(
      "/auth/profile",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),

  changePassword: (
    phone: string,
    currentPassword: string,
    newPassword: string,
  ) =>
    request<{ success: boolean; message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ phone, currentPassword, newPassword }),
    }),

  sendOtp: (phone: string) =>
    request<{ success: boolean; message: string; otpCode?: string }>(
      "/auth/send-otp",
      {
        method: "POST",
        body: JSON.stringify({ phone }),
      },
    ),

  verifyOtp: (phone: string, otpCode: string) =>
    request<{
      success: boolean;
      message: string;
      token?: string;
      userId?: string;
      patientId?: number;
      fullName?: string;
      phone?: string;
      email?: string;
      verificationStatus?: string;
    }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otpCode }),
    }),

  resetPassword: (phone: string, otpCode: string, newPassword: string) =>
    request<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ phone, otpCode, newPassword }),
    }),
};

// ── Medical Data APIs ─────────────────────────────────────────────────────────
export const apiMedical = {
  getSpecialties: () =>
    request<
      Array<{ specialtyId: number; specialtyName: string; description: string }>
    >("/specialties"),

  getDoctors: (specialtyId?: number) =>
    request<
      Array<{
        doctorId: number;
        fullName: string;
        degree: string;
        experienceYears: number;
        rating: number;
      }>
    >(`/doctors${specialtyId ? `?specialtyId=${specialtyId}` : ""}`),

  getDoctorSchedules: (
    doctorId?: number,
    specialtyId?: number,
    dateStr?: string,
  ) =>
    request<
      Array<{
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
      }>
    >(
      `/doctors/schedules?${doctorId ? `doctorId=${doctorId}&` : ""}${specialtyId ? `specialtyId=${specialtyId}&` : ""}${dateStr ? `dateStr=${dateStr}` : ""}`,
    ),
};

export interface PatientAppointmentDto {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  specialtyName: string;
  date: string;
  timeSlot: string;
  status: string;
  reason?: string;
  // Tính thật từ invoices.payment_status ở backend: 'unpaid' | 'partial' | 'paid'
  paymentStatus?: string;
  queueNumber: number;
  clinicRoom: string;
  fee: string;
  isPackage?: boolean;
  createdAt: string;
  // Backend đã trả sẵn (AppointmentResponseDto) nhưng trước đây type này thiếu khai báo nên UI không
  // đọc tới — lịch hẹn đặt cho người thân (memberId khác null) phải hiển thị đúng tên/giới tính/tuổi
  // của NGƯỜI THÂN đó, không phải của chủ tài khoản.
  memberId?: number | null;
  patientName?: string;
  patientGender?: string;
  patientAge?: number;
}

// ── Appointment APIs ──────────────────────────────────────────────────────────
export const apiAppointment = {
  createAppointment: (data: {
    patientId?: number;
    memberId?: number;
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
      memberId?: number;
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
    }>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPatientAppointments: (patientId: number) =>
    request<PatientAppointmentDto[]>(`/appointments/patient/${patientId}`),

  cancelAppointment: (
    id: number,
    cancelledBy?: string,
    cancelReason?: string,
  ) =>
    request<{ success: boolean; message: string }>(
      `/appointments/${id}/cancel`,
      {
        method: "PUT",
        body: JSON.stringify({
          cancelReason: cancelReason || "Bệnh nhân hủy lịch qua ứng dụng",
          cancelledBy: cancelledBy || "patient",
        }),
      },
    ),

  getAllAppointments: () => request<Array<any>>("/appointments"),
};

// ── Health Package APIs ───────────────────────────────────────────────────────

export interface HealthPackage {
  packageId: number;
  title: string;
  description: string;
  price: number;
  priceFormatted: string;
  genderTarget: "male" | "female" | "all";
  imageUrl?: string;
  bookedCount: number;
  bookedCountFormatted: string;
  isActive: boolean;
  details: string[];
}

export const apiHealthPackage = {
  getAll: (gender?: "male" | "female") =>
    request<HealthPackage[]>(
      `/healthpackages${gender ? `?gender=${gender}` : ""}`,
    ),

  getById: (id: number) => request<HealthPackage>(`/healthpackages/${id}`),

  bookPackage: (
    id: number,
    data: {
      patientId: number;
      memberId?: number;
      patientName: string;
      preferredDate?: string;
      preferredTimeSlot?: string;
      priceFormatted?: string;
    },
  ) =>
    request<{
      success: boolean;
      message: string;
      appointmentId: number;
      packageTitle: string;
      priceFormatted: string;
      preferredDate: string;
      queueNumber: number;
    }>(`/healthpackages/${id}/book`, {
      method: "POST",
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
  // Backend (AuthController/FamilyMembersController/PatientsController) chỉ từng set 'pending'
  // hoặc 'verified' — không có action "reject" nào tồn tại. 'rejected' giữ trong type để khớp
  // với AuthContext.VerificationStatus (phòng khi tính năng từ chối hồ sơ được thêm sau), nhưng
  // hiện tại backend không bao giờ trả về giá trị này.
  verificationStatus: "pending" | "verified" | "rejected";
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
    request<{ success: boolean; message: string; profile?: ProfileDto }>(
      "/familymembers",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  update: (
    id: string,
    data: {
      realId?: number;
      isOwner?: boolean;
      name?: string;
      relationship?: string;
      dob?: string;
      gender?: string;
      phone?: string;
      cccd?: string;
      bhyt?: string;
    },
  ) =>
    request<{ success: boolean; message: string }>(`/familymembers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/familymembers/${id}`, {
      method: "DELETE",
    }),
};

// ── Notification APIs ─────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: "appointment" | "result" | "promotion" | "system" | string;
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
      if (key.includes("/notifications/patient/")) {
        const list = val.data as NotificationItem[];
        if (Array.isArray(list)) {
          val.data = list.map((n) => (n.id === id ? { ...n, read: true } : n));
        }
      }
    });
    return request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: "PUT",
    }).catch(() => ({ success: true }));
  },

  markAllAsRead: async (patientId: number) => {
    DTTQueryCache.forEach((val, key) => {
      if (key.includes(`/notifications/patient/${patientId}`)) {
        const list = val.data as NotificationItem[];
        if (Array.isArray(list)) {
          val.data = list.map((n) => ({ ...n, read: true }));
        }
      }
    });
    return request<{ success: boolean; count: number }>(
      `/notifications/patient/${patientId}/read-all`,
      { method: "PUT" },
    ).catch(() => ({ success: true, count: 0 }));
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
  linkByQr: (data: {
    patientId: string;
    verifyCode: string;
    ownerPatientId?: number;
  }) =>
    request<{ success: boolean; message: string; profile?: ProfileDto }>(
      "/patients/link-by-qr",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

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
        verificationStatus: "pending" | "verified" | "rejected";
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
        patient: {
          verificationStatus: string;
          cccd?: string;
          verificationNote?: string;
        };
      }>(`/patients/${patientId}`);
      if (res?.success && res.patient) {
        return {
          verified: res.patient.verificationStatus === "verified",
          verificationStatus: res.patient.verificationStatus as
            | "pending"
            | "verified"
            | "rejected",
          cccd: res.patient.cccd,
          note: res.patient.verificationNote,
        };
      }
    } catch {}
    return { verified: false, verificationStatus: "pending" as const };
  },
};

// ── AI Symptom Checker + Escalate to Staff APIs ───────────────────────────────
// Xem Tai Lieu/ai_chatbot_luong_nghiep_vu.md — 1 session bắt đầu ở status 'AI'
// (Gemini trả lời), có thể chuyển 'Escalated' (Lễ tân) rồi 'Closed'.

export interface ChatMessageItem {
  messageId: number;
  senderType: "Patient" | "AI" | "Staff";
  senderUserId?: string | null;
  // Chỉ có giá trị khi senderType='Staff' — tên thật của lễ tân đang tư vấn.
  senderName?: string | null;
  content: string;
  createdAt: string;
}

export const apiChat = {
  createSession: () =>
    request<{ success: boolean; sessionId: number; status: string }>(
      "/chat/sessions",
      {
        method: "POST",
      },
    ),

  // Tìm phiên đang mở (AI/Escalated) gần nhất của bệnh nhân — gọi TRƯỚC createSession mỗi khi vào
  // màn Chat, để tiếp tục phiên cũ thay vì luôn tạo mới (không thì phiên đang chờ Lễ tân trả lời sẽ
  // bị "mồ côi" mỗi khi bệnh nhân thoát ra vào lại). customTtl=0 — không cache, luôn kiểm tra mới nhất.
  getActiveSession: () =>
    request<{
      success: boolean;
      hasActive: boolean;
      sessionId?: number;
      status?: string;
    }>("/chat/sessions/active", {}, 0),

  // timeoutMs=28000 — khi status='AI', backend chờ Gemini trả lời (tự retry 1 lần nếu rớt mạng,
  // mỗi lần tối đa ~12s) trước khi trả về; 8s mặc định của request() sẽ tự bỏ cuộc quá sớm và
  // hiện lỗi "quá tải" ngay cả khi backend sắp trả lời thành công.
  sendMessage: (sessionId: number, content: string) =>
    request<{
      success: boolean;
      escalated?: boolean;
      reply?: string;
      suggestedSpecialtyId?: number | null;
      suggestedSpecialtyName?: string | null;
      shouldEscalate?: boolean;
      // 'Closed' khi AI phát hiện bệnh nhân muốn kết thúc cuộc trò chuyện (vd: "kết thúc", "tạm biệt")
      status?: string;
    }>(
      `/chat/sessions/${sessionId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
      DEFAULT_TTL,
      28000,
    ),

  // customTtl=0 — luôn lấy dữ liệu mới nhất khi polling, không dùng cache 60s mặc định
  // (nếu không, bệnh nhân sẽ không thấy tin nhắn mới của Lễ tân trong tối đa 60 giây).
  getMessages: (sessionId: number) =>
    request<{ success: boolean; status: string; messages: ChatMessageItem[] }>(
      `/chat/sessions/${sessionId}/messages`,
      {},
      0,
    ),

  escalate: (sessionId: number) =>
    request<{ success: boolean; status: string }>(
      `/chat/sessions/${sessionId}/escalate`,
      {
        method: "POST",
      },
    ),
};

// ── Stage 2 Optimization: Intelligent Pre-Warming Engine ──────────────────────
export const prewarmCoreData = (patientId?: number) => {
  // Execute background requests to warm up in-memory cache without blocking main UI thread
  setTimeout(() => {
    try {
      apiMedical.getDoctors().catch(() => {});
      apiHealthPackage.getAll().catch(() => {});
      if (patientId) {
        apiAppointment.getPatientAppointments(patientId).catch(() => {});
        apiFamilyMembers.getByPatient(patientId).catch(() => {});
      }
      console.log("[Stage 2] Pre-warmed core data cache successfully.");
    } catch (e) {
      // Suppress network logs during silent warmup
    }
  }, 300);
};
