export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  isUnverified?: boolean;
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

/** Payload for creating a transaction (server assigns id). */
export type NewTransaction = Omit<Transaction, 'id' | 'uid'>;
