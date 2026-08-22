export type BudgetCategory = 'Transport' | 'Accommodation' | 'Activities' | 'Meals' | 'Misc';

export interface BudgetLineItem {
  category: BudgetCategory;
  amount: number; // INR
  percentage: number;
}

export interface DailyBudget {
  date: string; // ISO
  amount: number; // INR
  overBudget: boolean;
}

export interface BudgetBreakdown {
  tripId: string;
  total: number; // INR
  averagePerDay: number;
  dailyLimit: number; // INR threshold per day
  lineItems: BudgetLineItem[];
  daily: DailyBudget[];
}
