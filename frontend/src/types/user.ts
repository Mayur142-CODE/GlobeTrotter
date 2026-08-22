export type UserRole = 'traveler' | 'admin';

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  country?: string;
  country_id?: string;
  city_id?: string;
  additional_info?: string;
  avatar_url?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatarUrl: string;
  phone?: string;
  city?: string;
  cityId?: string;
  country?: string;
  countryId?: string;
  additionalInfo?: string;
  language: string;
  savedDestinationIds: string[];
  role: UserRole;
  joinedAt: string;
  emailConfirmed?: boolean;
}
