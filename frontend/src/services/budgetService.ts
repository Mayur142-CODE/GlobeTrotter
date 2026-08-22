import { supabase } from '@/lib/supabase';
import type { BudgetBreakdown, BudgetCategory, BudgetLineItem, DailyBudget, ExpenseCategory, ExpenseItem } from '@/types/budget';
import { daysBetween } from '@/lib/utils';

interface SupabaseExpenseRow {
  id: string;
  trip_id: string;
  stop_id?: string | null;
  category: string;
  description?: string | null;
  amount: number | string;
  currency?: string | null;
  expense_date: string;
  created_at?: string;
}

export interface CreateExpensePayload {
  tripId: string;
  stopId?: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency?: string;
  expenseDate: string;
}

/**
 * Fetch all expenses for a specific trip from Supabase.
 */
export async function getExpenses(tripId: string): Promise<ExpenseItem[]> {
  try {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: true });

    if (error || !data) {
      console.warn('[GlobeTrotter] getExpenses notice:', error?.message);
      return [];
    }

    return (data as SupabaseExpenseRow[]).map((e) => ({
      id: e.id,
      tripId: e.trip_id,
      stopId: e.stop_id,
      category: e.category.toLowerCase() as ExpenseCategory,
      description: e.description || '',
      amount: Number(e.amount) || 0,
      currency: e.currency || 'INR',
      expenseDate: e.expense_date,
      createdAt: e.created_at,
    }));
  } catch (err) {
    console.warn('[GlobeTrotter] getExpenses exception:', err);
    return [];
  }
}

/**
 * Create a new expense item in Supabase.
 */
export async function createExpense(payload: CreateExpensePayload): Promise<ExpenseItem> {
  const { data, error } = await supabase
    .from('trip_expenses')
    .insert({
      trip_id: payload.tripId,
      stop_id: payload.stopId || null,
      category: payload.category.toLowerCase(),
      description: payload.description.trim() || null,
      amount: payload.amount,
      currency: payload.currency || 'INR',
      expense_date: payload.expenseDate,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to add expense.');
  }

  const e = data as SupabaseExpenseRow;
  return {
    id: e.id,
    tripId: e.trip_id,
    stopId: e.stop_id,
    category: e.category.toLowerCase() as ExpenseCategory,
    description: e.description || '',
    amount: Number(e.amount) || 0,
    currency: e.currency || 'INR',
    expenseDate: e.expense_date,
    createdAt: e.created_at,
  };
}

/**
 * Update an existing expense item in Supabase.
 */
export async function updateExpense(
  id: string,
  updates: Partial<CreateExpensePayload>
): Promise<ExpenseItem> {
  const payload: Record<string, unknown> = {};
  if (updates.category !== undefined) payload.category = updates.category.toLowerCase();
  if (updates.description !== undefined) payload.description = updates.description.trim() || null;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.expenseDate !== undefined) payload.expense_date = updates.expenseDate;
  if (updates.stopId !== undefined) payload.stop_id = updates.stopId || null;

  const { data, error } = await supabase
    .from('trip_expenses')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update expense.');
  }

  const e = data as SupabaseExpenseRow;
  return {
    id: e.id,
    tripId: e.trip_id,
    stopId: e.stop_id,
    category: e.category.toLowerCase() as ExpenseCategory,
    description: e.description || '',
    amount: Number(e.amount) || 0,
    currency: e.currency || 'INR',
    expenseDate: e.expense_date,
    createdAt: e.created_at,
  };
}

/**
 * Delete an expense item from Supabase.
 */
export async function deleteExpense(id: string): Promise<boolean> {
  const { error } = await supabase.from('trip_expenses').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Failed to delete expense.');
  }
  return true;
}

/**
 * Compute the complete dynamic budget breakdown from Supabase trip, activities, and expenses.
 */
export async function getBudgetBreakdown(tripId: string): Promise<BudgetBreakdown | undefined> {
  try {
    // 1. Fetch trip metadata
    const { data: tripData, error: tripErr } = await supabase
      .from('trips')
      .select(`
        id,
        start_date,
        end_date,
        budget_limit,
        trip_stops (
          id,
          start_date,
          end_date,
          trip_activities (
            id,
            activity_date,
            estimated_cost,
            activities (
              name,
              estimated_cost
            )
          )
        )
      `)
      .eq('id', tripId)
      .maybeSingle();

    if (tripErr || !tripData) {
      console.warn('[GlobeTrotter] getBudgetBreakdown notice:', tripErr?.message);
      return undefined;
    }

    // 2. Fetch all expenses
    const expenses = await getExpenses(tripId);

    // 3. Aggregate activity costs
    let totalActivityCost = 0;
    const dailyActivityCostMap: Record<string, number> = {};

    (tripData.trip_stops || []).forEach((stop: any) => {
      (stop.trip_activities || []).forEach((ta: any) => {
        const cost = Number(ta.estimated_cost ?? ta.activities?.estimated_cost) || 0;
        totalActivityCost += cost;
        const dateStr = ta.activity_date || stop.start_date || tripData.start_date;
        dailyActivityCostMap[dateStr] = (dailyActivityCostMap[dateStr] || 0) + cost;
      });
    });

    // 4. Aggregate expenses by category
    const categoryTotals: Record<BudgetCategory, number> = {
      Transport: 0,
      Accommodation: 0,
      Activities: totalActivityCost,
      Meals: 0,
      Misc: 0,
    };

    const dailyExpenseMap: Record<string, number> = {};

    expenses.forEach((exp) => {
      const amt = exp.amount;
      const cat = exp.category;
      if (cat === 'transport') categoryTotals.Transport += amt;
      else if (cat === 'accommodation') categoryTotals.Accommodation += amt;
      else if (cat === 'activities') categoryTotals.Activities += amt;
      else if (cat === 'meals') categoryTotals.Meals += amt;
      else categoryTotals.Misc += amt;

      dailyExpenseMap[exp.expenseDate] = (dailyExpenseMap[exp.expenseDate] || 0) + amt;
    });

    const totalCost =
      categoryTotals.Transport +
      categoryTotals.Accommodation +
      categoryTotals.Activities +
      categoryTotals.Meals +
      categoryTotals.Misc;

    const lineItems: BudgetLineItem[] = (
      ['Transport', 'Accommodation', 'Activities', 'Meals', 'Misc'] as BudgetCategory[]
    ).map((cat) => ({
      category: cat,
      amount: categoryTotals[cat],
      percentage: totalCost > 0 ? Math.round((categoryTotals[cat] / totalCost) * 100) : 0,
    }));

    // 5. Calculate trip duration & daily limits
    const days = Math.max(1, daysBetween(tripData.start_date, tripData.end_date));
    const targetBudget = Number(tripData.budget_limit) || totalCost;
    const dailyLimit = Math.round(targetBudget / days);
    const averagePerDay = Math.round(totalCost / days);

    // 6. Build daily spending schedule
    const daily: DailyBudget[] = [];
    for (let i = 0; i < days; i++) {
      const curDate = new Date(tripData.start_date);
      curDate.setDate(curDate.getDate() + i);
      const dateStr = curDate.toISOString().slice(0, 10);

      const daySpent = (dailyExpenseMap[dateStr] || 0) + (dailyActivityCostMap[dateStr] || 0);
      daily.push({
        date: dateStr,
        amount: daySpent,
        overBudget: dailyLimit > 0 && daySpent > dailyLimit,
      });
    }

    return {
      tripId,
      budgetLimit: Number(tripData.budget_limit) || undefined,
      total: totalCost,
      averagePerDay,
      dailyLimit,
      lineItems,
      daily,
      expenses,
    };
  } catch (err) {
    console.warn('[GlobeTrotter] getBudgetBreakdown exception:', err);
    return undefined;
  }
}
