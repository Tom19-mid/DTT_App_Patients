import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { apiFamilyMembers, clearApiCache } from '../services/apiService';
import { clearBiometricToken } from '../services/biometricService';
import { connectNotificationHub, disconnectNotificationHub } from '../services/signalrService';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface PatientProfile {
  id: string;
  realId?: number;
  isOwner?: boolean;
  name: string;
  patientId: string;
  relationship: string;
  verificationStatus: VerificationStatus;
  isVerified?: boolean; // legacy compatibility getter
  verificationNote?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  cccd?: string;
  bhyt?: string;
}

// Placeholder trước khi đăng nhập — AppNavigator luôn khởi động ở màn Login (initialRouteName="Login"),
// nên state này chỉ tồn tại trong khoảnh khắc trước khi login()/fetch profiles thật ghi đè, KHÔNG bao
// giờ thực sự hiển thị cho người dùng thật. Cố tình để trống dữ liệu cá nhân thay vì số CCCD/BHYT giả
// trông như thật để tránh nhầm là dữ liệu demo còn sót.
const PLACEHOLDER_PROFILES: PatientProfile[] = [
  {
    id: 'placeholder_owner',
    isOwner: true,
    name: '',
    patientId: '',
    relationship: 'Bản thân',
    verificationStatus: 'pending',
    isVerified: false,
  }
];

export interface RecentServiceItem {
  id: string;
  name: string;
  detail: string;
  time: string;
  icon: string;
  type: 'doctor' | 'specialty' | 'package';
  doctorName?: string;
  specialtyName?: string;
  doctorId?: number;
  specialtyId?: number;
}

// Trước đây có sẵn 3 mục demo (BS. Nguyễn Văn A, Nhi khoa, Gói Khám Nam) hiện ra ngay cả khi người
// dùng CHƯA từng tương tác gì — nhìn như dữ liệu lịch sử thật nhưng thực chất là hàng giả/ngẫu nhiên
// (đúng như QA report "Đã dùng gần đây như là đang để random"). Để trống, giống PLACEHOLDER_PROFILES ở
// trên, cho tới khi addRecentService() ghi nhận tương tác thật — HomeScreen đã tự ẩn cả section khi rỗng.
const INITIAL_RECENT_SERVICES: RecentServiceItem[] = [];

export interface User {
  token?: string;
  userId?: string;
  patientId: number;
  fullName: string;
  phone: string;
  email?: string;
  verificationStatus?: string;
  avatarInitials?: string;
}

interface AuthContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  login: (userData: any) => void;
  logout: () => Promise<void>;
  isVerified: boolean;
  setIsVerified: (value: boolean) => void;
  profiles: PatientProfile[];
  // Cả 3 hàm đều throw khi backend từ chối (vd tài khoản chưa xác thực CCCD) — màn hình gọi PHẢI await +
  // try/catch để biết thao tác thất bại, thay vì coi mọi lần gọi đều thành công.
  addProfile: (profile: Omit<PatientProfile, 'id' | 'patientId' | 'verificationStatus' | 'isVerified'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<PatientProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  recentServices: RecentServiceItem[];
  addRecentService: (item: Omit<RecentServiceItem, 'id' | 'time'> & { time?: string }) => void;
  // Tăng dần mỗi khi Hub báo "NotificationsChanged" — màn nào cần tự làm mới danh sách/badge
  // thông báo real-time chỉ cần useEffect theo dõi giá trị này (xem NotificationScreen.tsx).
  notificationsTick: number;
}

// Placeholder trước khi đăng nhập (xem PLACEHOLDER_PROFILES ở trên) — patientId=0 là sentinel
// "không tồn tại" (cùng quy ước với login() bên dưới), KHÔNG dùng patientId thật nào để tránh
// mọi đoạn code lỡ gọi API bằng currentUser này trước khi login() ghi đè vô tình trỏ vào dữ liệu
// bệnh nhân thật.
const defaultUser: User = {
  patientId: 0,
  fullName: '',
  phone: '',
  verificationStatus: 'pending',
};

const AuthContext = createContext<AuthContextType>({
  currentUser: defaultUser,
  setCurrentUser: () => {},
  login: () => {},
  logout: async () => {},
  isVerified: false,
  setIsVerified: () => {},
  profiles: [],
  addProfile: async () => {},
  updateProfile: async () => {},
  deleteProfile: async () => {},
  recentServices: [],
  addRecentService: () => {},
  notificationsTick: 0,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [isVerified, setIsVerified] = useState(false);
  const [profiles, setProfiles] = useState<PatientProfile[]>(PLACEHOLDER_PROFILES);
  const [recentServices, setRecentServices] = useState<RecentServiceItem[]>(INITIAL_RECENT_SERVICES);
  const [notificationsTick, setNotificationsTick] = useState(0);

  // Kết nối SignalR khi có phiên đăng nhập hợp lệ (patientId > 0), ngắt khi logout — AppNavigator
  // luôn khởi động ở màn Login (không tự khôi phục phiên cũ) nên hiệu ứng này bao quát đủ mọi luồng
  // đăng nhập (mật khẩu/Face ID/OTP), vì tất cả đều đi qua login() cập nhật currentUser.
  useEffect(() => {
    if (currentUser?.patientId) {
      connectNotificationHub({
        onNotificationsChanged: () => setNotificationsTick(t => t + 1),
        onVerificationStatusChanged: (data) => {
          setIsVerified(data.verificationStatus === 'verified');
        },
      });
    } else {
      disconnectNotificationHub();
    }
    return () => { disconnectNotificationHub(); };
  }, [currentUser?.patientId]);

  // Load patient profiles from backend DB whenever patientId changes
  useEffect(() => {
    let isMounted = true;
    if (currentUser && currentUser.patientId) {
      apiFamilyMembers.getByPatient(currentUser.patientId)
        .then(res => {
          if (isMounted && res && Array.isArray(res) && res.length > 0) {
            const loadedProfiles: PatientProfile[] = res.map((p: any) => ({
              id: p.id,
              realId: p.realId,
              isOwner: p.isOwner,
              name: p.name,
              patientId: p.patientId,
              relationship: p.relationship,
              verificationStatus: (p.verificationStatus as VerificationStatus) || 'pending',
              isVerified: p.isVerified || p.verificationStatus === 'verified',
              verificationNote: p.verificationNote,
              dob: p.dob,
              gender: p.gender,
              phone: p.phone,
              cccd: p.cccd,
              bhyt: p.bhyt,
            }));
            setProfiles(loadedProfiles);
          }
        })
        .catch(err => {
          console.log('[AuthContext] Failed to fetch real family profiles:', err);
        });
    }
    return () => { isMounted = false; };
  }, [currentUser.patientId]);

  const login = useCallback((userData: any) => {
    const name = userData.fullName || 'Người Dùng';
    const parts = name.trim().split(' ');
    let initials = 'U';
    if (parts.length >= 2) {
      initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else if (name.length >= 1) {
      initials = name.substring(0, 2).toUpperCase();
    }
    
    const loggedUser: User = {
      token: userData.token,
      userId: userData.userId,
      // KHÔNG được fallback về một patientId THẬT (id=2) khi response bất thường — trước đây làm vậy
      // khiến mọi tài khoản gặp lỗi này vô tình dùng chung dữ liệu của bệnh nhân #2. Dùng 0 (không tồn
      // tại) để mọi endpoint theo patientId thất bại rõ ràng thay vì âm thầm trỏ nhầm sang người khác.
      patientId: typeof userData.patientId === 'number' ? userData.patientId : 0,
      fullName: name,
      phone: userData.phone || '0909123456',
      email: userData.email || 'user@dtthealthcare.com',
      verificationStatus: userData.verificationStatus || 'verified',
      avatarInitials: initials,
    };

    setCurrentUser(loggedUser);
    setIsVerified(loggedUser.verificationStatus === 'verified');
  }, []);

  const logout = useCallback(async () => {
    await clearBiometricToken();
    clearApiCache();
    setCurrentUser(defaultUser);
  }, []);

  // Keep primary profile ("Bản thân") synced with currentUser state if offline
  useEffect(() => {
    setProfiles(prev => prev.map(p => p.relationship === 'Bản thân' ? {
      ...p,
      name: currentUser.fullName.toUpperCase(),
      phone: currentUser.phone,
      patientId: `#${String(currentUser.patientId).padStart(6, '0')}`,
      verificationStatus: isVerified ? 'verified' : 'pending',
      isVerified
    } : p));
  }, [isVerified, currentUser]);

  const addProfile = useCallback(async (data: Omit<PatientProfile, 'id' | 'patientId' | 'verificationStatus' | 'isVerified'>) => {
    const tempId = Math.random().toString(36).substring(7);
    const newProfile: PatientProfile = {
      ...data,
      id: tempId,
      patientId: `#F${Math.floor(Math.random() * 90000) + 10000}`,
      verificationStatus: 'pending',
      isVerified: false,
    };
    setProfiles(prev => [...prev, newProfile]);

    try {
      const res = await apiFamilyMembers.create({
        ownerPatientId: currentUser.patientId,
        name: data.name,
        relationship: data.relationship,
        dob: data.dob,
        gender: data.gender,
        phone: data.phone,
        cccd: data.cccd,
        bhyt: data.bhyt,
      });
      if (!res || !res.success || !res.profile) {
        throw new Error(res?.message || 'Không thể thêm hồ sơ người thân.');
      }
      setProfiles(prev => prev.map(p => p.id === tempId ? {
        id: res.profile!.id,
        realId: res.profile!.realId,
        isOwner: res.profile!.isOwner,
        name: res.profile!.name,
        patientId: res.profile!.patientId,
        relationship: res.profile!.relationship,
        verificationStatus: (res.profile!.verificationStatus as VerificationStatus) || 'pending',
        isVerified: res.profile!.isVerified,
        dob: res.profile!.dob,
        gender: res.profile!.gender,
        phone: res.profile!.phone,
        cccd: res.profile!.cccd,
        bhyt: res.profile!.bhyt,
      } : p));
    } catch (e) {
      // Rollback optimistic update — bản ghi tạm này CHƯA hề được lưu vào DB (vd bị backend từ chối vì
      // chủ tài khoản chưa xác thực CCCD) — trước đây lỗi chỉ console.log, hồ sơ giả vẫn nằm lại trong
      // state và màn ProfileDetailScreen vẫn hiện "Đã thêm hồ sơ mới" như thể thành công thật. Phải gỡ
      // khỏi state VÀ ném lại lỗi để màn hình gọi biết thao tác thất bại, hiển thị đúng thông báo lỗi.
      setProfiles(prev => prev.filter(p => p.id !== tempId));
      console.log('[AuthContext] Failed to save profile to DB:', e);
      throw e;
    }
  }, [currentUser.patientId]);

  const updateProfile = useCallback(async (id: string, updates: Partial<PatientProfile>) => {
    const target = profiles.find(p => p.id === id);
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        if (updates.verificationStatus) {
          updated.isVerified = updates.verificationStatus === 'verified';
        }
        return updated;
      }
      return p;
    }));

    try {
      await apiFamilyMembers.update(id, {
        realId: target?.realId,
        isOwner: target?.isOwner || target?.relationship === 'Bản thân',
        name: updates.name,
        relationship: updates.relationship,
        dob: updates.dob,
        gender: updates.gender,
        phone: updates.phone,
        cccd: updates.cccd,
        bhyt: updates.bhyt,
      });
    } catch (e) {
      // Rollback về đúng giá trị TRƯỚC khi sửa nếu API thất bại — trước đây chỉ console.log, màn hình
      // gọi vẫn hiện "Đã cập nhật hồ sơ" dù DB không hề đổi gì.
      if (target) {
        setProfiles(prev => prev.map(p => p.id === id ? target : p));
      }
      console.log('[AuthContext] Failed to update profile in DB:', e);
      throw e;
    }
  }, [profiles]);

  const deleteProfile = useCallback(async (id: string) => {
    const removed = profiles.find(p => p.id === id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    try {
      await apiFamilyMembers.delete(id);
    } catch (e) {
      // Rollback: khôi phục lại hồ sơ nếu xóa thất bại ở backend — trước đây hồ sơ vẫn "biến mất" khỏi
      // app dù thực tế vẫn còn tồn tại trong DB.
      if (removed) {
        setProfiles(prev => [...prev, removed]);
      }
      console.log('[AuthContext] Failed to delete profile in DB:', e);
      throw e;
    }
  }, [profiles]);

  const addRecentService = useCallback((item: Omit<RecentServiceItem, 'id' | 'time'> & { time?: string }) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timeStr = item.time || `Tương tác: ${day}/${month}`;

    const newItem: RecentServiceItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      time: timeStr,
    };

    setRecentServices(prev => {
      const filtered = prev.filter(p => p.name !== item.name);
      return [newItem, ...filtered].slice(0, 6);
    });
  }, []);

  // Memo hoá value — trước đây là object literal mới mỗi lần render, khiến MỌI component đọc
  // useAuth() (gần như toàn bộ app) re-render theo bất kỳ thay đổi state nào trong provider này,
  // kể cả state không liên quan tới component đó đang đọc.
  const value = useMemo<AuthContextType>(() => ({
    currentUser, setCurrentUser, login, logout,
    isVerified, setIsVerified, profiles, addProfile, updateProfile, deleteProfile,
    recentServices, addRecentService, notificationsTick
  }), [currentUser, login, logout, isVerified, profiles, addProfile, updateProfile, deleteProfile, recentServices, addRecentService, notificationsTick]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

