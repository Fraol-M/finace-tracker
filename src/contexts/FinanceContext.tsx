import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, NewTransaction } from '../types';
import * as transactionsApi from '../api/transactions';

export interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (tx: NewTransaction) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({
  userId,
  children,
}: {
  userId?: string;
  children: React.ReactNode;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadTransactions = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await transactionsApi.fetchTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const addTransaction = useCallback(async (newTx: NewTransaction) => {
    try {
      const data = await transactionsApi.createTransaction(newTx);
      setTransactions((prev) => [data, ...prev]);
    } catch (err) {
      console.error('Failed to add transaction:', err);
      throw err;
    }
  }, []);

  const updateTransaction = useCallback(async (updatedTx: Transaction) => {
    try {
      const data = await transactionsApi.updateTransaction(updatedTx);
      setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? data : t)));
    } catch (err) {
      console.error('Failed to update transaction:', err);
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: number) => {
    try {
      await transactionsApi.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [transactions, addTransaction, updateTransaction, deleteTransaction]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
