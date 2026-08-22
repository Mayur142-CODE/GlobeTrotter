import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, TrendingUp, AlertTriangle, Calendar, Plus, Trash2 } from 'lucide-react';
import type { BudgetBreakdown, ExpenseCategory } from '@/types/budget';
import type { Trip } from '@/types/trip';
import { getBudgetBreakdown, createExpense, deleteExpense } from '@/services/budgetService';
import { getTrip } from '@/services/tripService';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { OverbudgetAlert } from '@/components/budget/OverbudgetAlert';
import { BudgetChart } from '@/components/budget/BudgetChart';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateShort } from '@/lib/utils';

export default function TripBudget() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Expense Dialog state
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('meals');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>('');
  const [expenseStopId, setExpenseStopId] = useState<string>('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Delete Expense confirm state
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const loadBudgetData = useCallback(async () => {
    if (!tripId) return;
    try {
      const [b, t] = await Promise.all([getBudgetBreakdown(tripId), getTrip(tripId)]);
      setBudget(b ?? null);
      setTrip(t ?? null);
      if (t?.startDate && !expenseDate) {
        setExpenseDate(t.startDate);
      }
    } finally {
      setLoading(false);
    }
  }, [tripId, expenseDate]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId) return;
    if (!expenseAmount || Number(expenseAmount) <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a positive amount.', variant: 'error' });
      return;
    }
    if (!expenseDate) {
      toast({ title: 'Date required', description: 'Please select an expense date.', variant: 'error' });
      return;
    }

    setSubmittingExpense(true);
    try {
      await createExpense({
        tripId,
        category: expenseCategory,
        description: expenseDescription.trim() || `${expenseCategory.toUpperCase()} Expense`,
        amount: Number(expenseAmount),
        expenseDate,
        stopId: expenseStopId || null,
      });

      toast({ title: 'Expense recorded', description: 'Added to your trip budget.', variant: 'success' });
      setAddExpenseOpen(false);
      setExpenseDescription('');
      setExpenseAmount('');
      await loadBudgetData();
    } catch (err: any) {
      toast({ title: 'Error adding expense', description: err?.message || 'Could not save expense.', variant: 'error' });
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpenseConfirm = async () => {
    if (!deletingExpenseId) return;
    try {
      await deleteExpense(deletingExpenseId);
      toast({ title: 'Expense deleted', description: 'Removed from your budget.', variant: 'success' });
      setDeletingExpenseId(null);
      await loadBudgetData();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Could not remove expense.', variant: 'error' });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!budget || !trip) {
    return (
      <PageContainer>
        <EmptyState
          title="Budget data unavailable"
          description="Could not load budget details for this trip."
          action={<Button onClick={() => navigate('/trips')}>Back to My Trips</Button>}
        />
      </PageContainer>
    );
  }

  const overBudgetDays = budget.daily.filter((d) => d.overBudget);
  const remainingBudget = budget.budgetLimit ? budget.budgetLimit - budget.total : null;

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <button
          onClick={() => navigate(`/itinerary/${trip.id}`)}
          className="flex items-center gap-1.5 font-sans text-sm text-ink/60 hover:text-teal focus-ring rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Back to itinerary
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${trip.id}/calendar`)}>
            <Calendar className="w-4 h-4 mr-1.5" aria-hidden /> Calendar
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddExpenseOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-midnight">{trip.name} — Budget</h1>
          <p className="font-sans text-sm text-ink/60 mt-1">Live cost breakdown, daily spending & expenses</p>
        </div>
        {budget.budgetLimit && (
          <div className="text-right">
            <span className="ticket-mono text-xs text-ink/50 block">TARGET BUDGET</span>
            <span className="ticket-mono text-xl font-bold text-teal">{formatCurrency(budget.budgetLimit)}</span>
            {remainingBudget !== null && (
              <span className={`ticket-mono text-xs font-semibold block mt-0.5 ${remainingBudget >= 0 ? 'text-teal' : 'text-coral'}`}>
                {remainingBudget >= 0 ? `${formatCurrency(remainingBudget)} remaining` : `${formatCurrency(Math.abs(remainingBudget))} over target`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            icon: Wallet,
            label: 'Total Estimated Cost',
            value: formatCurrency(budget.total),
            color: 'text-midnight',
          },
          {
            icon: TrendingUp,
            label: 'Avg Cost / Day',
            value: formatCurrency(budget.averagePerDay),
            color: 'text-teal',
          },
          {
            icon: Calendar,
            label: 'Daily Target Limit',
            value: budget.dailyLimit > 0 ? formatCurrency(budget.dailyLimit) : 'No limit set',
            color: 'text-ink',
          },
          {
            icon: AlertTriangle,
            label: 'Over-Budget Days',
            value: String(overBudgetDays.length),
            color: overBudgetDays.length > 0 ? 'text-coral' : 'text-teal',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="rounded-xl bg-parchment-50 border border-parchment-300/60 shadow-paper p-4"
          >
            <div className="w-9 h-9 rounded-lg bg-midnight/5 flex items-center justify-center mb-2">
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} aria-hidden />
            </div>
            <p className="ticket-mono text-xl font-semibold text-midnight">{stat.value}</p>
            <p className="font-sans text-xs text-ink/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Overbudget Alert */}
      {overBudgetDays.length > 0 && (
        <div className="mb-6">
          <OverbudgetAlert count={overBudgetDays.length} days={overBudgetDays.map((d) => formatDateShort(d.date))} />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Category breakdown — pie chart */}
        <div className="boarding-pass p-5">
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Category Breakdown</h2>
          <BudgetChart lineItems={budget.lineItems} size={200} />
          <div className="mt-4 pt-4 border-t border-dashed border-parchment-300 space-y-2">
            {budget.lineItems.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <span className="font-sans text-midnight font-medium">{item.category}</span>
                <span className="ticket-mono text-ink/70">
                  {formatCurrency(item.amount)} · {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily spending chart */}
        <div className="boarding-pass p-5">
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Daily Spending vs. Limit</h2>
          <div className="flex items-end gap-1.5 h-48 pt-4">
            {budget.daily.map((day, i) => {
              const maxAmount = Math.max(budget.dailyLimit * 1.3, ...budget.daily.map((d) => d.amount), 1000);
              const heightPct = Math.min(100, Math.max(4, (day.amount / maxAmount) * 100));
              const limitPct = Math.min(100, (budget.dailyLimit / maxAmount) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end relative group h-full">
                  <motion.div
                    className={`w-full rounded-t ${day.overBudget ? 'bg-coral' : 'bg-teal'}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.03 }}
                  />
                  <span className="ticket-mono text-[9px] text-ink/50 mt-1">D{i + 1}</span>

                  {/* Daily limit dashed indicator */}
                  {budget.dailyLimit > 0 && (
                    <div
                      className="absolute left-0 right-0 border-t border-dashed border-coral/50 pointer-events-none"
                      style={{ bottom: `${limitPct}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-parchment-300 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-teal" />
              <span className="font-sans text-ink/60">Within budget</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-coral" />
              <span className="font-sans text-ink/60">Over budget day</span>
            </div>
            {budget.dailyLimit > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-px border-t border-dashed border-coral" />
                <span className="font-sans text-ink/60">Daily threshold</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense List Section */}
      <section className="boarding-pass p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-midnight">Logged Expenses</h2>
            <p className="font-sans text-xs text-ink/50">Custom transport, hotel stays, food, and miscellaneous costs</p>
          </div>
          <Button size="sm" onClick={() => setAddExpenseOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Log Expense
          </Button>
        </div>

        {budget.expenses.length === 0 ? (
          <p className="font-sans text-sm text-ink/40 italic py-4 text-center">
            No expenses logged yet. Click "Log Expense" to track travel costs.
          </p>
        ) : (
          <div className="divide-y divide-parchment-200 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="ticket-mono text-[10px] uppercase text-ink/40">
                  <th className="py-2">Date</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-200">
                {budget.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-parchment-100/40">
                    <td className="py-2.5 ticket-mono text-xs text-ink/70">{formatDateShort(exp.expenseDate)}</td>
                    <td className="py-2.5">
                      <Badge variant="teal" className="capitalize text-[10px]">
                        {exp.category}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-medium text-midnight">{exp.description || '—'}</td>
                    <td className="py-2.5 text-right ticket-mono font-semibold text-midnight">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setDeletingExpenseId(exp.id)}
                        className="p-1 rounded text-ink/30 hover:text-coral hover:bg-coral/10 focus-ring"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add Expense Modal */}
      <Dialog open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log a Trip Expense</DialogTitle>
          <DialogDescription>Add stay, flight, meal, or general expense to this trip.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddExpenseSubmit} className="space-y-4 px-6 py-2">
          <div>
            <Label htmlFor="exp-category">Category</Label>
            <Select
              id="exp-category"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
            >
              <option value="transport">Transport (Flights, Trains, Cabs)</option>
              <option value="accommodation">Stay / Accommodation (Hotels, Villas)</option>
              <option value="meals">Meals & Dining</option>
              <option value="activities">Activities & Entry Tickets</option>
              <option value="other">Other / Miscellaneous</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="exp-amount">Amount (INR ₹)</Label>
            <Input
              id="exp-amount"
              type="number"
              min="1"
              step="any"
              required
              placeholder="e.g. 3500"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="exp-date">Expense Date</Label>
            <Input
              id="exp-date"
              type="date"
              required
              min={trip.startDate}
              max={trip.endDate}
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="exp-desc">Description</Label>
            <Input
              id="exp-desc"
              placeholder="e.g. Flight to Paris, Hotel Booking, Dinner at Bistro"
              value={expenseDescription}
              onChange={(e) => setExpenseDescription(e.target.value)}
            />
          </div>

          {trip.stops.length > 0 && (
            <div>
              <Label htmlFor="exp-stop">Associate with Stop (Optional)</Label>
              <Select
                id="exp-stop"
                value={expenseStopId}
                onChange={(e) => setExpenseStopId(e.target.value)}
              >
                <option value="">Trip Wide / No specific stop</option>
                {trip.stops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.city.name} ({formatDateShort(s.startDate)})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setAddExpenseOpen(false)} disabled={submittingExpense}>
              Cancel
            </Button>
            <Button type="submit" disabled={submittingExpense}>
              {submittingExpense ? 'Saving…' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Expense Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={handleDeleteExpenseConfirm}
        title="Delete this expense?"
        description="Are you sure you want to remove this expense record from your trip budget?"
        confirmLabel="Delete expense"
      />
    </PageContainer>
  );
}
