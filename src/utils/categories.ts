import { Transaction } from '../types';

/** Suggested labels for empty category dropdowns (form UX only, not persisted data). */
const EXPENSE_SUGGESTIONS = ['Infrastructure', 'Meals', 'Travel', 'Software', 'Marketing', 'Operations'];
const INCOME_SUGGESTIONS = ['Consulting', 'Salary', 'Investments', 'Revenue'];

export function getCategoriesForType(
  transactions: Transaction[],
  type: 'income' | 'expense'
): string[] {
  const fromDb = transactions.filter((t) => t.type === type).map((t) => t.category);
  const suggestions = type === 'expense' ? EXPENSE_SUGGESTIONS : INCOME_SUGGESTIONS;
  return Array.from(new Set([...suggestions, ...fromDb]));
}

export function getAllCategories(transactions: Transaction[]): string[] {
  const fromDb = transactions.map((t) => t.category);
  return Array.from(new Set([...EXPENSE_SUGGESTIONS, ...INCOME_SUGGESTIONS, ...fromDb]));
}

export function defaultCategoryForType(type: 'income' | 'expense'): string {
  return type === 'income' ? 'Consulting' : 'Infrastructure';
}
