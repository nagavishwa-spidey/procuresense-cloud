import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/types/procurement';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoUser: boolean;
  loginDemoUser: (role?: 'admin' | 'analyst' | 'manager' | 'viewer') => void;
  signInWithEmail: (email: string, password?: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password?: string, fullName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const DEMO_USER: UserProfile = {
  id: 'usr-demo-01',
  organization_id: 'org-demo-01',
  email: 'analyst@procuresense.cloud',
  full_name: 'Elena Rostova',
  role: 'admin',
  avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  created_at: '2025-01-01T00:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('procuresense_auth_user');
    return saved ? JSON.parse(saved) : DEMO_USER; // Default to demo user for first-run evaluator experience
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return localStorage.getItem('procuresense_is_demo') !== 'false';
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          organization_id: session.user.user_metadata?.organization_id || 'org-live-01',
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Cloud Procurement Lead',
          role: session.user.user_metadata?.role || 'admin',
          created_at: session.user.created_at,
        });
        setIsDemoUser(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          organization_id: session.user.user_metadata?.organization_id || 'org-live-01',
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'Cloud Procurement Lead',
          role: session.user.user_metadata?.role || 'admin',
          created_at: session.user.created_at,
        });
        setIsDemoUser(false);
      } else if (!isDemoUser) {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [isDemoUser]);

  const loginDemoUser = (role: 'admin' | 'analyst' | 'manager' | 'viewer' = 'admin') => {
    const demo = { ...DEMO_USER, role };
    setUser(demo);
    setIsDemoUser(true);
    localStorage.setItem('procuresense_auth_user', JSON.stringify(demo));
    localStorage.setItem('procuresense_is_demo', 'true');
  };

  const signInWithEmail = async (email: string, password: string = 'ProcureSense2026!'): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        // Fallback for evaluator without live Supabase env
        const fallbackUser: UserProfile = {
          id: 'usr-local-01',
          organization_id: 'org-demo-01',
          email,
          full_name: email.split('@')[0],
          role: 'admin',
          created_at: new Date().toISOString(),
        };
        setUser(fallbackUser);
        setIsDemoUser(false);
        localStorage.setItem('procuresense_auth_user', JSON.stringify(fallbackUser));
        localStorage.setItem('procuresense_is_demo', 'false');
        return {};
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        setUser({
          id: data.user.id,
          organization_id: data.user.user_metadata?.organization_id || 'org-live-01',
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          role: data.user.user_metadata?.role || 'admin',
          created_at: data.user.created_at,
        });
        setIsDemoUser(false);
      }
      return {};
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string = 'ProcureSense2026!',
    fullName: string = 'Enterprise User'
  ): Promise<{ error?: string }> => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured || !supabase) {
        const fallbackUser: UserProfile = {
          id: 'usr-local-01',
          organization_id: 'org-demo-01',
          email,
          full_name: fullName,
          role: 'admin',
          created_at: new Date().toISOString(),
        };
        setUser(fallbackUser);
        setIsDemoUser(false);
        localStorage.setItem('procuresense_auth_user', JSON.stringify(fallbackUser));
        localStorage.setItem('procuresense_is_demo', 'false');
        return {};
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'analyst',
          },
        },
      });

      if (error) return { error: error.message };
      if (data.user) {
        setUser({
          id: data.user.id,
          organization_id: 'org-live-01',
          email: data.user.email || email,
          full_name: fullName,
          role: 'analyst',
          created_at: data.user.created_at,
        });
        setIsDemoUser(false);
      }
      return {};
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemoUser(false);
    localStorage.removeItem('procuresense_auth_user');
    localStorage.removeItem('procuresense_is_demo');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoUser,
        loginDemoUser,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
