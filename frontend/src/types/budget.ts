export type BudgetCategory = 'Transport' | 'Accommodation' | 'Activities' | 'Meals' | 'Misc';

export type ExpenseCategory = 'transport' | 'accommodation' | 'activities' | 'meals' | 'other';

export interface ExpenseItem {
  id: string;
  tripId: string;
  stopId?: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  createdAt?: string;
}

export interface BudgetLineItem {
  category: BudgetCategory;
  amount: number; // INR
  percentage: number;
}

export interface DailyBudget {
  date: string; // ISO YYYY-MM-DD
  amount: number; // INR
  overBudget: boolean;
}

export interface BudgetBreakdown {
  tripId: string;
  budgetLimit?: number; // Target budget set by user
  total: number; // Total actual + activity costs in INR
  averagePerDay: number;
  dailyLimit: number; // Target budget / trip days
  lineItems: BudgetLineItem[];
  daily: DailyBudget[];
  expenses: ExpenseItem[];
}
