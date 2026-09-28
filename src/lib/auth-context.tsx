'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getUserById } from '@/lib/db';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const profile = await getUserById(session.user.id);
          if (isMounted) setUser(profile);
        }
      } catch {
        // ignore init errors
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await getUserById(session.user.id);
          if (isMounted) {
            setUser(profile);
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        setIsLoading(false);
        return false;
      }
      const profile = await getUserById(data.user.id);
      setUser(profile);
      setIsLoading(false);
      return true;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
