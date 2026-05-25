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

export interface BudgetBills {
  rent: number;
  utilities: number;
  transportation: number;
  food: number;
  insurance: number;
  subscriptions: number;
  otherBills: number;
}

export interface BudgetRecommendation {
  totalFixedExpenses: number;
  remainingAfterBills: number;
  remainingAfterSavings: number;
  remainingAfterVacation: number;
  dailySpendingLimit: number;
  daysInMonth?: number;
  insights: string[];
}

export interface BudgetCalendarExpense {
  category: string;
  amount: number;
  status: string;
}

export interface BudgetCalendarDay {
  date: string;
  type: string;
  plannedExpenses: BudgetCalendarExpense[];
  availableToSpend: number;
  runningBalance: number;
  notes: string;
}

export interface BudgetPlan {
  id: number;
  month: string;
  monthlyIncome: number;
  bills: BudgetBills;
  savingsGoal: number;
  hasVacation: boolean;
  vacationBudget: number;
  createdAt?: string;
  updatedAt?: string;
}
