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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as Profile);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
