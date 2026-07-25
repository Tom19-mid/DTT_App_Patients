import React, { createContext, useState, useContext, ReactNode } from 'react';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface PatientProfile {
  id: string;
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
    id: '1',
    name: 'NGUYỄN ABC',
    patientId: '#000001',
    relationship: 'Bản thân',
    verificationStatus: 'verified',
    isVerified: true,
    dob: '28/06/2000',
    gender: 'Nam',
    phone: '0900031245',
    cccd: '079099123456',
    bhyt: 'DN4797912345678'
  },
  {
    id: '2',
    name: 'NGUYỄN VĂN D',
    patientId: '#000045',
    relationship: 'Bố',
    verificationStatus: 'pending',
    isVerified: false,
    dob: '15/03/1970',
    gender: 'Nam',
    phone: '0912345678',
    cccd: '079070999888'
  },
  {
    id: '3',
    name: 'NGUYỄN THỊ E',
    patientId: '#000088',
    relationship: 'Mẹ',
    verificationStatus: 'rejected',
    isVerified: false,
    verificationNote: 'Số CCCD không trùng khớp với dữ liệu cơ sở dữ liệu quốc gia.',
    dob: '10/08/1973',
    gender: 'Nữ',
    phone: '0987654321',
    cccd: '079073111222'
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

interface AuthContextType {
  isVerified: boolean;
  setIsVerified: (value: boolean) => void;
  profiles: PatientProfile[];
  addProfile: (profile: Omit<PatientProfile, 'id' | 'patientId' | 'verificationStatus' | 'isVerified'>) => void;
  updateProfile: (id: string, updates: Partial<PatientProfile>) => void;
  deleteProfile: (id: string) => void;
  recentServices: RecentServiceItem[];
  addRecentService: (item: Omit<RecentServiceItem, 'id' | 'time'> & { time?: string }) => void;
}

const AuthContext = createContext<AuthContextType>({
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
  const [isVerified, setIsVerified] = useState(true);
  const [profiles, setProfiles] = useState<PatientProfile[]>(MOCK_PROFILES);
  const [recentServices, setRecentServices] = useState<RecentServiceItem[]>(INITIAL_RECENT_SERVICES);

  // Sync the 'Bản thân' profile's verification status with global state
  React.useEffect(() => {
    setProfiles(prev => prev.map(p => p.relationship === 'Bản thân' ? {
      ...p,
      verificationStatus: isVerified ? 'verified' : 'pending',
      isVerified
    } : p));
  }, [isVerified]);

  const addProfile = (data: Omit<PatientProfile, 'id' | 'patientId' | 'verificationStatus' | 'isVerified'>) => {
    const newProfile: PatientProfile = {
      ...data,
      id: Math.random().toString(36).substring(7),
      patientId: `#0000${Math.floor(Math.random() * 90) + 10}`,
      verificationStatus: 'pending',
      isVerified: false,
    };
    setProfiles(prev => [...prev, newProfile]);
  };

  const updateProfile = (id: string, updates: Partial<PatientProfile>) => {
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
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
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
      isVerified, setIsVerified, profiles, addProfile, updateProfile, deleteProfile,
      recentServices, addRecentService
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

