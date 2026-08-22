export type UserRole = 'traveler' | 'admin';

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
}


