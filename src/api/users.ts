import { apiFetch } from './client';
import { UserAccount } from '../types';

export async function fetchUsers(): Promise<UserAccount[]> {
  return apiFetch('/users');
}

export async function updateUser(payload: {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
}): Promise<Partial<UserAccount>> {
  return apiFetch('/users/update', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch('/users/delete', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}
