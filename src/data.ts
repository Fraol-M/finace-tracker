import { UserAccount } from './types';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u1',
    username: 'astral_fox',
    fullName: 'Eleanor Vance',
    email: 'eleanor.v@gmail.com',
    phone: '+1 (555) 019-2834',
    role: 'user',
    password: 'Password123!'
  },
  {
    id: 'u2',
    username: 'cipher_node',
    fullName: 'Marcus Sterling',
    email: 'm.sterling.dev@gmail.com',
    phone: '+1 (555) 837-9921',
    role: 'user',
    password: 'Password123!'
  },
  {
    id: 'u3',
    username: 'nova_pulse',
    fullName: 'Sarah Jenkins',
    email: 's.jenkins88@gmail.com',
    phone: '+44 7700 900077',
    role: 'user',
    password: 'Password123!'
  },
  {
    id: 'u4',
    username: 'echo_base',
    fullName: 'Unverified User',
    email: 'echo.b@gmail.com',
    phone: '-',
    role: 'user',
    isUnverified: true,
    password: 'Password123!'
  },
  // We add Admin credentials and Default User (Kaleb) credentials
  {
    id: 'admin',
    username: 'admin',
    fullName: 'FinPrecision Admin',
    email: 'admin@finprecision.com',
    phone: '+1 (555) 555-0100',
    role: 'admin',
    password: 'admin'
  },
  {
    id: 'kaleb',
    username: 'kaleb',
    fullName: 'Kaleb Seyoum',
    email: 'kalebseyoum1234@gmail.com',
    phone: '+1 (555) 777-2023',
    role: 'user',
    password: 'user'
  }
];
