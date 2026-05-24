export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  isUnverified?: boolean;
  password?: string;
}

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  icon?: string;
  uid?: string;
}

export interface MonthlyMetric {
  month: string;
  shortMonth: string;
  expense: number;
  income: number;
  net: number;
}
