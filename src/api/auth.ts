import { apiFetch } from './client';
import { UserAccount } from '../types';

export interface AuthSession {
  token: string;
  user: UserAccount;
}

export async function login(identifier: string, password: string): Promise<AuthSession> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export async function signup(payload: {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}): Promise<void> {
  await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<{ user: UserAccount }> {
  return apiFetch('/auth/me');
}
