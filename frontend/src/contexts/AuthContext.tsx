import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User, UserProfile } from '@/types/user';

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  city?: string;
  cityId?: string;
  country?: string;
  countryId?: string;
  additionalInfo?: string;
  avatarFile?: File | Blob | null;
  avatarUrl?: string;
}

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ user: SupabaseUser; isVerified: boolean }>;
  signUp: (payload: SignupPayload) => Promise<{ user: SupabaseUser | null; isVerified: boolean }>;
  signOut: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  uploadAvatar: (userId: string, file: File | Blob) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to convert technical Supabase errors to friendly messages
export function getFriendlyAuthErrorMessage(error: AuthError | Error | null): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const message = error.message?.toLowerCase() || '';

  if (message.includes('413') || message.includes('too large') || message.includes('bytes')) {
    return 'The image or form data is too large. Please select a smaller photo.';
  }
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Email or password is incorrect.';
  }
  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'This email is already associated with a GlobeTrotter account.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please verify your email address before continuing.';
  }
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    message.includes('over_email_send_rate_limit')
  ) {
    return 'Too many sign-up attempts. Supabase free email rate limit reached. Please wait a few minutes before trying again or configure custom SMTP in Supabase.';
  }
  if (message.includes('password') && (message.includes('least 6') || message.includes('short'))) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection error. Please check your internet and try again.';
  }

  return error.message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or upsert profile in public.profiles
  const loadProfile = useCallback(async (sbUser: SupabaseUser | null): Promise<UserProfile | null> => {
    if (!sbUser) {
      setProfile(null);
      setUser(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[GlobeTrotter] Could not load profile from database:', error.message);
      }

      const meta = sbUser.user_metadata || {};
      const firstName = data?.first_name || meta.first_name || '';
      const lastName = data?.last_name || meta.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || meta.name || sbUser.email?.split('@')[0] || 'Traveler';
      const avatarUrl = data?.avatar_url || (meta.avatar_url && !meta.avatar_url.startsWith('data:') ? meta.avatar_url : '') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';

      const currentProfile: UserProfile = {
        id: sbUser.id,
        first_name: firstName,
        last_name: lastName,
        phone: data?.phone || meta.phone || '',
        city: data?.city || meta.city || '',
        country: data?.country || meta.country || '',
        country_id: data?.country_id || meta.country_id || '',
        city_id: data?.city_id || meta.city_id || '',
        additional_info: data?.additional_info || meta.additional_info || '',
        avatar_url: avatarUrl,
        language: data?.language || 'en',
        created_at: data?.created_at || sbUser.created_at,
        updated_at: data?.updated_at,
      };

      const appUser: User = {
        id: sbUser.id,
        name: fullName,
        firstName,
        lastName,
        email: sbUser.email || '',
        avatarUrl,
        phone: currentProfile.phone,
        city: currentProfile.city,
        cityId: currentProfile.city_id,
        country: currentProfile.country,
        countryId: currentProfile.country_id,
        additionalInfo: currentProfile.additional_info,
        language: currentProfile.language || 'en',
        savedDestinationIds: [],
        role: 'traveler',
        joinedAt: currentProfile.created_at || new Date().toISOString(),
        emailConfirmed: !!(sbUser.email_confirmed_at || sbUser.confirmed_at),
      };

      setProfile(currentProfile);
      setUser(appUser);
      return currentProfile;
    } catch (err) {
      console.error('[GlobeTrotter] Profile error:', err);
      return null;
    }
  }, []);

  // Initialize session on mount and listen to changes
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[GlobeTrotter] Error getting session:', error.message);
        }

        if (mounted) {
          const currentSession = data?.session || null;
          setSession(currentSession);
          setSupabaseUser(currentSession?.user || null);
          if (currentSession?.user) {
            await loadProfile(currentSession.user);
          }
        }
      } catch (err) {
        console.error('[GlobeTrotter] Auth initialization failure:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Subscribe to auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setSupabaseUser(newSession?.user || null);
      if (newSession?.user) {
        await loadProfile(newSession.user);
      } else {
        setProfile(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Upload avatar to Supabase Storage
  const uploadAvatar = async (userId: string, file: File | Blob): Promise<string | null> => {
    try {
      const fileExt = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
      const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

      if (uploadError) {
        console.warn('[GlobeTrotter] Avatar storage notice:', uploadError.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrlData?.publicUrl || null;
    } catch (err) {
      console.warn('[GlobeTrotter] Avatar upload exception:', err);
      return null;
    }
  };

  // Sign In with Supabase
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(getFriendlyAuthErrorMessage(error));
      }

      if (!data.user) {
        throw new Error('Sign in failed. No user returned.');
      }

      const isVerified = !!(data.user.email_confirmed_at || data.user.confirmed_at);
      setSupabaseUser(data.user);
      setSession(data.session);
      await loadProfile(data.user);

      return { user: data.user, isVerified };
    } finally {
      setLoading(false);
    }
  };

  // Sign Up with Supabase
  const signUp = async (payload: SignupPayload) => {
    setLoading(true);
    try {
      // CRITICAL: Never include base64 data URIs in Supabase Auth user_metadata payload
      // because Supabase Auth enforces a 1MB request body limit (Status 413).
      const safeAvatarUrl =
        payload.avatarUrl && !payload.avatarUrl.startsWith('data:')
          ? payload.avatarUrl
          : '';

      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim(),
        password: payload.password || '',
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: payload.firstName.trim(),
            last_name: payload.lastName.trim(),
            phone: payload.phone?.trim() || '',
            city: payload.city?.trim() || '',
            city_id: payload.cityId || '',
            country: payload.country?.trim() || '',
            country_id: payload.countryId || '',
            additional_info: payload.additionalInfo?.trim() || '',
            avatar_url: safeAvatarUrl,
          },
        },
      });

      if (error) {
        throw new Error(getFriendlyAuthErrorMessage(error));
      }

      const createdUser = data.user;
      const isVerified = !!(createdUser?.email_confirmed_at || createdUser?.confirmed_at);
      let uploadedAvatarUrl = safeAvatarUrl;

      // If user uploaded a photo file and user ID is available, upload separately to storage
      if (createdUser && payload.avatarFile) {
        const uploadedUrl = await uploadAvatar(createdUser.id, payload.avatarFile);
        if (uploadedUrl) {
          uploadedAvatarUrl = uploadedUrl;
        }
      }

      // Upsert profile in public.profiles table
      if (createdUser) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: createdUser.id,
            first_name: payload.firstName.trim(),
            last_name: payload.lastName.trim(),
            phone: payload.phone?.trim() || null,
            city: payload.city?.trim() || null,
            country: payload.country?.trim() || null,
            additional_info: payload.additionalInfo?.trim() || null,
            avatar_url: uploadedAvatarUrl || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

        if (profileError) {
          console.warn('[GlobeTrotter] Profile insertion notice:', profileError.message);
        }

        await loadProfile(createdUser);
      }

      return { user: createdUser, isVerified };
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSupabaseUser(null);
      setSession(null);
      setProfile(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Verification
  const resendVerificationEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error(getFriendlyAuthErrorMessage(error));
    }
  };

  // Reset Password for Email
  const resetPasswordForEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw new Error(getFriendlyAuthErrorMessage(error));
    }
  };

  // Update Password for Authenticated / Recovery Session
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      throw new Error(getFriendlyAuthErrorMessage(error));
    }
  };

  const refreshProfile = async () => {
    if (supabaseUser) {
      await loadProfile(supabaseUser);
    }
  };

  const isEmailVerified = !!(supabaseUser?.email_confirmed_at || supabaseUser?.confirmed_at);
  const isAuthenticated = !!session && !!supabaseUser;

  return (
    <AuthContext.Provider
      value={{
        supabaseUser,
        user,
        session,
        profile,
        loading,
        isAuthenticated,
        isEmailVerified,
        signIn,
        signUp,
        signOut,
        resendVerificationEmail,
        resetPasswordForEmail,
        updatePassword,
        uploadAvatar,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
