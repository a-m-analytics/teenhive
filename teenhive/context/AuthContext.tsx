import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import React from 'react';

export type Profile = {
  id: string;
  role: 'teen' | 'parent';
  full_name: string;
  age: number | null;
  bio: string | null;
  neighborhood: string | null;
  hourly_rate: number | null;
  skills: string[];
  availability: string[];
  trust_score: number;
  jobs_completed: number;
  rating: number;
  rating_count: number;
  is_verified: boolean;
  phone_verified: boolean;
  avatar_url: string | null;
  phone: string | null;
  reference_name: string | null;
  reference_contact: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | null;
};

type SignUpData = {
  role: string;
  full_name: string;
  age: number;
  bio: string;
  neighborhood?: string;
  hourly_rate?: number;
  skills?: string[];
  availability?: string[];
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, data: SignUpData) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) {
        setProfile(data as Profile);
      } else if (error?.code === 'PGRST116') {
        // Profile row deleted but auth session still active — sign out cleanly
        setProfile(null);
        setUser(null);
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('fetchProfile error:', e);
    }
  }

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (e) {
        console.warn('Auth init error:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      });
      subscription = data.subscription;
    } catch (e) {
      console.warn('Auth subscription error:', e);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    data: SignUpData
  ): Promise<{ error: string | null }> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: data.role, full_name: data.full_name },
      },
    });

    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'Failed to create account.' };

    // Session available when email auto-confirm is enabled in Supabase dashboard
    if (authData.session) {
      await supabase
        .from('profiles')
        .update({
          age: data.age,
          bio: data.bio,
          neighborhood: data.neighborhood ?? null,
          hourly_rate: data.hourly_rate ?? null,
          skills: data.skills ?? [],
          availability: data.availability ?? [],
        })
        .eq('id', authData.user.id);

      await fetchProfile(authData.user.id);
    }

    return { error: null };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) await fetchProfile(data.user.id);
    return { error: null };
  };

  const signOut = async () => {
    // Clear state immediately so UI reacts at once, then sign out
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
