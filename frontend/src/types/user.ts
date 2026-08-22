export type UserRole = 'traveler' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  language: string;
  savedDestinationIds: string[];
  role: UserRole;
  joinedAt: string;
}
