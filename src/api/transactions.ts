import { apiFetch } from './client';
import { Transaction } from '../types';

export async function fetchTransactions(): Promise<Transaction[]> {
  return apiFetch('/transactions');
}

export async function createTransaction(newTx: Transaction): Promise<Transaction> {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(newTx),
  });
}

export async function updateTransaction(updatedTx: Transaction): Promise<Transaction> {
  return apiFetch('/transactions/update', {
    method: 'PUT',
    body: JSON.stringify(updatedTx),
  });
}

export async function deleteTransaction(id: number): Promise<void> {
  await apiFetch('/transactions/delete', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}
