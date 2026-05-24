import { apiFetch } from './client';
import { Transaction, NewTransaction } from '../types';

export async function fetchTransactions(): Promise<Transaction[]> {
  return apiFetch('/transactions');
}

export async function createTransaction(tx: NewTransaction): Promise<Transaction> {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(tx),
  });
}

export async function updateTransaction(tx: Transaction): Promise<Transaction> {
  return apiFetch('/transactions/update', {
    method: 'PUT',
    body: JSON.stringify(tx),
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  await apiFetch('/transactions/delete', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}
