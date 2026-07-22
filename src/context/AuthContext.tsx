import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface PatientProfile {
  id: string;
  name: string;
  patientId: string;
  relationship: string;
  isVerified: boolean;
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
    isVerified: false,
    dob: '15/03/1970',
    gender: 'Nam',
  }
];

interface AuthContextType {
  isVerified: boolean;
  setIsVerified: (value: boolean) => void;
  profiles: PatientProfile[];
  addProfile: (profile: Omit<PatientProfile, 'id' | 'patientId' | 'isVerified'>) => void;
  updateProfile: (id: string, updates: Partial<PatientProfile>) => void;
  deleteProfile: (id: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  isVerified: true,
  setIsVerified: () => {},
  profiles: [],
  addProfile: () => {},
  updateProfile: () => {},
  deleteProfile: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isVerified, setIsVerified] = useState(true);
  const [profiles, setProfiles] = useState<PatientProfile[]>(MOCK_PROFILES);

  // Sync the 'Bản thân' profile's isVerified state with the global isVerified state
  React.useEffect(() => {
    setProfiles(prev => prev.map(p => p.relationship === 'Bản thân' ? { ...p, isVerified } : p));
  }, [isVerified]);

  const addProfile = (data: Omit<PatientProfile, 'id' | 'patientId' | 'isVerified'>) => {
    const newProfile: PatientProfile = {
      ...data,
      id: Math.random().toString(36).substring(7),
      patientId: `#0000${Math.floor(Math.random() * 90) + 10}`, // Random PID
      isVerified: false, // New profiles always start unverified
    };
    setProfiles(prev => [...prev, newProfile]);
  };

  const updateProfile = (id: string, updates: Partial<PatientProfile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  return (
    <AuthContext.Provider value={{ isVerified, setIsVerified, profiles, addProfile, updateProfile, deleteProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
