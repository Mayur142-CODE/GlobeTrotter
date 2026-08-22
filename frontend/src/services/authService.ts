import type { User } from '@/types/user';
import { mockUser } from '@/data/mockUser';

const LATENCY = 500;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

export async function login(email: string, _password: string): Promise<User> {
  return delay({ ...mockUser, email: email || mockUser.email });
}

export interface SignupData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  phone?: string;
  city?: string;
  country?: string;
  additionalInfo?: string;
  avatarUrl?: string;
}

export async function signup(
  nameOrData: string | SignupData,
  email?: string,
  _password?: string
): Promise<User> {
  if (typeof nameOrData === 'object') {
    const fullName = nameOrData.name || `${nameOrData.firstName || ''} ${nameOrData.lastName || ''}`.trim() || mockUser.name;
    const userUpdates: User = {
      ...mockUser,
      name: fullName,
      firstName: nameOrData.firstName,
      lastName: nameOrData.lastName,
      email: nameOrData.email || mockUser.email,
      phone: nameOrData.phone,
      city: nameOrData.city,
      country: nameOrData.country,
      additionalInfo: nameOrData.additionalInfo,
      avatarUrl: nameOrData.avatarUrl || mockUser.avatarUrl,
    };
    Object.assign(mockUser, userUpdates);
    return delay(userUpdates);
  }
  const fullName = nameOrData || mockUser.name;
  const userUpdates: User = {
    ...mockUser,
    name: fullName,
    email: email || mockUser.email,
  };
  Object.assign(mockUser, userUpdates);
  return delay(userUpdates);
}

export async function forgotPassword(_email: string): Promise<{ success: boolean; message: string }> {
  return delay({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
}

export async function getCurrentUser(): Promise<User> {
  return delay({ ...mockUser });
}

export async function updateUser(updates: Partial<User>): Promise<User> {
  Object.assign(mockUser, updates);
  return delay({ ...mockUser });
}
