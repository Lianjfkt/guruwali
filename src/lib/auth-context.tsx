'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { USERS } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock credentials untuk demo
const MOCK_CREDENTIALS: Record<string, string> = {
  'ahmad.fauzi@globalsmpmadani.sch.id': 'guru123',
  'fatimah.zahra@globalsmpmadani.sch.id': 'guru123',
  'rizky.pratama@globalsmpmadani.sch.id': 'guru123',
  'nurul.hidayah@globalsmpmadani.sch.id': 'guru123',
  'admin@globalsmpmadani.sch.id': 'admin123',
  'bambang.irawan@gmail.com': 'ortu123',
};

const STORAGE_KEY = 'guru_wali_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          // Cross-check against USERS or keep stored
          const fresh = USERS.find(u => u.id === parsed.id) || parsed;
          setUser(fresh);
        }
      }
    } catch {
      // In case of parsing error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));

    const validPassword = MOCK_CREDENTIALS[email];
    if (validPassword && validPassword === password) {
      const foundUser = USERS.find(u => u.email === email);
      if (foundUser) {
        setUser(foundUser);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
        } catch {
          // ignore storage quota error
        }
        setIsLoading(false);
        return true;
      }
    }
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const switchUser = (userId: string) => {
    const target = USERS.find(u => u.id === userId);
    if (target) {
      setUser(target);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
      } catch {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'guru_wali': return '/dashboard';
    case 'admin': return '/admin';
    case 'orang_tua': return '/portal-orang-tua';
    default: return '/login';
  }
}
