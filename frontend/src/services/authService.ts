import { supabase } from '@/lib/supabase';
import type { User, UserProfile } from '@/types/user';
import { getFriendlyAuthErrorMessage } from '@/contexts/AuthContext';

export interface SignupData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  phone?: string;
  city?: string;
  cityId?: string;
  country?: string;
  countryId?: string;
  additionalInfo?: string;
  avatarUrl?: string;
  avatarFile?: File | Blob | null;
}

export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }

  if (!data.user) {
    throw new Error('Login failed: no user returned.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  const meta = data.user.user_metadata || {};
  const firstName = profile?.first_name || meta.first_name || '';
  const lastName = profile?.last_name || meta.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || meta.name || data.user.email?.split('@')[0] || 'Traveler';

  return {
    id: data.user.id,
    name: fullName,
    firstName,
    lastName,
    email: data.user.email || '',
    avatarUrl: profile?.avatar_url || (meta.avatar_url && !meta.avatar_url.startsWith('data:') ? meta.avatar_url : '') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    phone: profile?.phone || meta.phone || '',
    city: profile?.city || meta.city || '',
    cityId: profile?.city_id || meta.city_id || '',
    country: profile?.country || meta.country || '',
    countryId: profile?.country_id || meta.country_id || '',
    additionalInfo: profile?.additional_info || meta.additional_info || '',
    language: profile?.language || 'en',
    savedDestinationIds: [],
    role: 'traveler',
    joinedAt: profile?.created_at || data.user.created_at,
    emailConfirmed: !!(data.user.email_confirmed_at || data.user.confirmed_at),
  };
}

export async function signup(
  nameOrData: string | SignupData,
  emailParam?: string,
  passwordParam?: string
): Promise<User> {
  const data: SignupData =
    typeof nameOrData === 'object'
      ? nameOrData
      : {
          name: nameOrData,
          email: emailParam || '',
          password: passwordParam || '',
        };

  const safeAvatarUrl =
    data.avatarUrl && !data.avatarUrl.startsWith('data:') ? data.avatarUrl : '';

  const redirectUrl = `${window.location.origin}/auth/callback`;
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email.trim(),
    password: data.password || '',
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        first_name: data.firstName || '',
        last_name: data.lastName || '',
        phone: data.phone || '',
        city: data.city || '',
        city_id: data.cityId || '',
        country: data.country || '',
        country_id: data.countryId || '',
        additional_info: data.additionalInfo || '',
        avatar_url: safeAvatarUrl,
      },
    },
  });

  if (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }

  const createdUser = authData.user;
  if (!createdUser) {
    throw new Error('Sign up failed: no user returned.');
  }

  // Upsert profile in public.profiles table
  await supabase.from('profiles').upsert(
    {
      id: createdUser.id,
      first_name: data.firstName?.trim() || null,
      last_name: data.lastName?.trim() || null,
      phone: data.phone?.trim() || null,
      city: data.city?.trim() || null,
      country: data.country?.trim() || null,
      additional_info: data.additionalInfo?.trim() || null,
      avatar_url: safeAvatarUrl || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  return {
    id: createdUser.id,
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    avatarUrl: safeAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    phone: data.phone,
    city: data.city,
    cityId: data.cityId,
    country: data.country,
    countryId: data.countryId,
    additionalInfo: data.additionalInfo,
    language: 'en',
    savedDestinationIds: [],
    role: 'traveler',
    joinedAt: createdUser.created_at,
    emailConfirmed: !!(createdUser.email_confirmed_at || createdUser.confirmed_at),
  };
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const redirectUrl = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: redirectUrl,
  });

  if (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }

  return {
    success: true,
    message: 'If an account exists for that email, a reset link has been sent.',
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user: sbUser },
  } = await supabase.auth.getUser();

  if (!sbUser) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sbUser.id)
    .maybeSingle();

  const meta = sbUser.user_metadata || {};
  const firstName = profile?.first_name || meta.first_name || '';
  const lastName = profile?.last_name || meta.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || meta.name || sbUser.email?.split('@')[0] || 'Traveler';

  return {
    id: sbUser.id,
    name: fullName,
    firstName,
    lastName,
    email: sbUser.email || '',
    avatarUrl: profile?.avatar_url || (meta.avatar_url && !meta.avatar_url.startsWith('data:') ? meta.avatar_url : '') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    phone: profile?.phone || meta.phone || '',
    city: profile?.city || meta.city || '',
    cityId: profile?.city_id || meta.city_id || '',
    country: profile?.country || meta.country || '',
    countryId: profile?.country_id || meta.country_id || '',
    additionalInfo: profile?.additional_info || meta.additional_info || '',
    language: profile?.language || 'en',
    savedDestinationIds: [],
    role: 'traveler',
    joinedAt: profile?.created_at || sbUser.created_at,
    emailConfirmed: !!(sbUser.email_confirmed_at || sbUser.confirmed_at),
  };
}

export async function updateUser(updates: Partial<User & UserProfile>): Promise<User | null> {
  const {
    data: { user: sbUser },
  } = await supabase.auth.getUser();

  if (!sbUser) return null;

  const profileUpdates: Partial<UserProfile> = {};
  if (updates.firstName !== undefined || updates.first_name !== undefined) {
    profileUpdates.first_name = updates.firstName ?? updates.first_name;
  }
  if (updates.lastName !== undefined || updates.last_name !== undefined) {
    profileUpdates.last_name = updates.lastName ?? updates.last_name;
  }
  if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
  if (updates.city !== undefined) profileUpdates.city = updates.city;
  if (updates.country !== undefined) profileUpdates.country = updates.country;
  if (updates.additionalInfo !== undefined || updates.additional_info !== undefined) {
    profileUpdates.additional_info = updates.additionalInfo ?? updates.additional_info;
  }
  if (updates.avatarUrl !== undefined || updates.avatar_url !== undefined) {
    profileUpdates.avatar_url = updates.avatarUrl ?? updates.avatar_url;
  }

  const { error } = await supabase
    .from('profiles')
    .update(profileUpdates)
    .eq('id', sbUser.id);

  if (error) {
    throw new Error(error.message);
  }

  return await getCurrentUser();
}
