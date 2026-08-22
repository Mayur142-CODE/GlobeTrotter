import type { User } from '@/types/user';
import { mockUser } from '@/data/mockUser';

const LATENCY = 500;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

export async function login(email: string, _password: string): Promise<User> {
  return delay({ ...mockUser, email: email || mockUser.email });
}

export async function signup(name: string, email: string, _password: string): Promise<User> {
  return delay({ ...mockUser, name: name || mockUser.name, email: email || mockUser.email });
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
