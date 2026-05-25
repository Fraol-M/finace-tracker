import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction } from '../types';
import { fetchTransactions, createTransaction, updateTransaction as updateTransactionApi, deleteTransaction as deleteTransactionApi } from '../api/transactions';

export const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
export const currentYear = new Date().getFullYear();

const d = new Date();
export const CURRENT_MONTH_VAL = d.getMonth() + 1;
export const CURRENT_MONTH_STR = String(CURRENT_MONTH_VAL).padStart(2, '0');
export const CURRENT_MONTH_PREFIX = `${currentYear}-${CURRENT_MONTH_STR}`;

export const YEARLY_MONTHS_CONFIG = [
  { name: 'January', prefix: `${currentYear}-01`, short: 'J' },
  { name: 'February', prefix: `${currentYear}-02`, short: 'F' },
  { name: 'March', prefix: `${currentYear}-03`, short: 'M' },
  { name: 'April', prefix: `${currentYear}-04`, short: 'A' },
  { name: 'May', prefix: `${currentYear}-05`, short: 'M' },
  { name: 'June', prefix: `${currentYear}-06`, short: 'J' },
  { name: 'July', prefix: `${currentYear}-07`, short: 'J' },
  { name: 'August', prefix: `${currentYear}-08`, short: 'A' },
  { name: 'September', prefix: `${currentYear}-09`, short: 'S' },
  { name: 'October', prefix: `${currentYear}-10`, short: 'O' },
  { name: 'November', prefix: `${currentYear}-11`, short: 'N' },
  { name: 'December', prefix: `${currentYear}-12`, short: 'D' },
];

export interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: number) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ userId, children }: { userId?: string; children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadTransactions = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const addTransaction = async (newTx: Transaction) => {
    try {
      const data = await createTransaction(newTx);
      setTransactions(prev => [data, ...prev]);
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  const updateTransaction = async (updatedTx: Transaction) => {
    try {
      const data = await updateTransactionApi(updatedTx);
      setTransactions(prev => prev.map(t => t.id === updatedTx.id ? data : t));
    } catch (err) {
      console.error('Failed to update transaction:', err);
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await deleteTransactionApi(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const value = useMemo(() => ({
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  }), [transactions]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
