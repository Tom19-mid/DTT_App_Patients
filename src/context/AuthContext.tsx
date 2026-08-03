import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { apiFamilyMembers, clearApiCache } from '../services/apiService';
import { clearBiometricToken } from '../services/biometricService';

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

const MOCK_PROFILES: PatientProfile[] = [
  {
    id: 'owner_2',
    realId: 2,
    isOwner: true,
    name: 'ĐẶNG NGUYỄN',
    patientId: '#000002',
    relationship: 'Bản thân',
    verificationStatus: 'verified',
    isVerified: true,
    dob: '28/06/2000',
    gender: 'Nam',
    phone: '0909123456',
    cccd: '079099123456',
    bhyt: 'DN4797912345678'
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
}

const INITIAL_RECENT_SERVICES: RecentServiceItem[] = [
  { id: '1', name: 'BS. Nguyễn Văn A', detail: 'Nội tổng quát', time: 'Khám gần nhất: 15/05', icon: 'stethoscope', type: 'doctor', doctorName: 'BS. Nguyễn Văn A', specialtyName: 'Nội tổng quát' },
  { id: '2', name: 'Nhi khoa', detail: 'BS. Lê Thị B', time: 'Khám gần nhất: 21/07', icon: 'baby', type: 'specialty', specialtyName: 'Nhi khoa' },
  { id: '3', name: 'Gói Khám Nam', detail: 'DTT Healthcare', time: 'Đã lưu', icon: 'medkit', type: 'package' },
];

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
  addProfile: (profile: Omit<PatientProfile, 'id' | 'patientId' | 'verificationStatus' | 'isVerified'>) => void;
  updateProfile: (id: string, updates: Partial<PatientProfile>) => void;
  deleteProfile: (id: string) => void;
  recentServices: RecentServiceItem[];
  addRecentService: (item: Omit<RecentServiceItem, 'id' | 'time'> & { time?: string }) => void;
}

const defaultUser: User = {
  patientId: 2,
  fullName: 'Đặng Nguyễn',
  phone: '0909123456',
  email: 'dang@dtthealthcare.com',
  avatarInitials: 'ĐN',
  verificationStatus: 'verified',
};

const AuthContext = createContext<AuthContextType>({
  currentUser: defaultUser,
  setCurrentUser: () => {},
  login: () => {},
  logout: async () => {},
  isVerified: true,
  setIsVerified: () => {},
  profiles: [],
  addProfile: () => {},
  updateProfile: () => {},
  deleteProfile: () => {},
  recentServices: [],
  addRecentService: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [isVerified, setIsVerified] = useState(true);
  const [profiles, setProfiles] = useState<PatientProfile[]>(MOCK_PROFILES);
  const [recentServices, setRecentServices] = useState<RecentServiceItem[]>(INITIAL_RECENT_SERVICES);

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

  const login = (userData: any) => {
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
  };

  const logout = async () => {
    await clearBiometricToken();
    clearApiCache();
    setCurrentUser(defaultUser);
  };

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

  const addProfile = async (data: Omit<PatientProfile, 'id' | 'patientId' | 'verificationStatus' | 'isVerified'>) => {
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
      if (res && res.success && res.profile) {
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
      }
    } catch (e) {
      console.log('[AuthContext] Failed to save profile to DB:', e);
    }
  };

  const updateProfile = async (id: string, updates: Partial<PatientProfile>) => {
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
      console.log('[AuthContext] Failed to update profile in DB:', e);
    }
  };

  const deleteProfile = async (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    try {
      await apiFamilyMembers.delete(id);
    } catch (e) {
      console.log('[AuthContext] Failed to delete profile in DB:', e);
    }
  };

  const addRecentService = (item: Omit<RecentServiceItem, 'id' | 'time'> & { time?: string }) => {
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
  };

  return (
    <AuthContext.Provider value={{
      currentUser, setCurrentUser, login, logout,
      isVerified, setIsVerified, profiles, addProfile, updateProfile, deleteProfile,
      recentServices, addRecentService
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

