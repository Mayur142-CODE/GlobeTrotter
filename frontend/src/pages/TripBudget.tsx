import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import type { BudgetBreakdown } from '@/types/budget';
import type { Trip } from '@/types/trip';
import { getBudgetBreakdown } from '@/services/budgetService';
import { getTrip } from '@/services/tripService';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { OverbudgetAlert } from '@/components/budget/OverbudgetAlert';
import { BudgetChart } from '@/components/budget/BudgetChart';
import { formatCurrency, formatDateShort } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Transport: '#1F8A83',
  Accommodation: '#16233A',
  Activities: '#D8A93E',
  Meals: '#F0664B',
  Misc: '#56719E',
};

export default function TripBudget() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<BudgetBreakdown | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tripId) return;
    Promise.all([getBudgetBreakdown(tripId), getTrip(tripId)]).then(([b, t]) => {
      setBudget(b ?? null);
      setTrip(t ?? null);
      setLoading(false);
    });
  }, [tripId]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <LoadingSkeleton className="h-64 w-full" /><LoadingSkeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!budget || !trip) {
    return (
      <PageContainer>
        <EmptyState title="Budget not found" description="This trip's budget data is unavailable." action={<Button onClick={() => navigate('/trips')}>Back to My Trips</Button>} />
      </PageContainer>
    );
  }

  const overBudgetDays = budget.daily.filter((d) => d.overBudget);

  return (
    <PageContainer>
      <button onClick={() => navigate(`/itinerary/${trip.id}`)} className="flex items-center gap-1.5 font-sans text-sm text-ink/60 hover:text-teal mb-4 focus-ring rounded">
        <ArrowLeft className="w-4 h-4" aria-hidden /> Back to itinerary
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-midnight">{trip.name}</h1>
          <p className="font-sans text-sm text-ink/60 mt-1">Budget breakdown & daily spending</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/trip/${trip.id}/calendar`)}>
          <Calendar className="w-4 h-4" aria-hidden /> View calendar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Wallet, label: 'Total Estimated', value: formatCurrency(budget.total), color: 'text-midnight' },
          { icon: TrendingUp, label: 'Avg per Day', value: formatCurrency(budget.averagePerDay), color: 'text-teal' },
          { icon: Calendar, label: 'Daily Limit', value: formatCurrency(budget.dailyLimit), color: 'text-ink' },
          { icon: AlertTriangle, label: 'Over-Budget Days', value: String(overBudgetDays.length), color: overBudgetDays.length > 0 ? 'text-coral' : 'text-teal' },
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

      {overBudgetDays.length > 0 && (
        <div className="mb-6">
          <OverbudgetAlert count={overBudgetDays.length} days={overBudgetDays.map((d) => formatDateShort(d.date))} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category breakdown — pie chart */}
        <div className="boarding-pass p-5" ref={chartRef}>
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Category Breakdown</h2>
          <BudgetChart lineItems={budget.lineItems} size={200} />
          <div className="mt-4 pt-4 border-t border-dashed border-parchment-300 space-y-2">
            {budget.lineItems.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="font-sans text-sm text-midnight">{item.category}</span>
                <span className="ticket-mono text-sm text-ink/60">{formatCurrency(item.amount)} · {item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily spending chart */}
        <div className="boarding-pass p-5">
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Daily Spending vs. Limit</h2>
          <div className="flex items-end gap-1 h-48">
            {budget.daily.map((day, i) => {
              const maxAmount = Math.max(budget.dailyLimit * 1.3, ...budget.daily.map((d) => d.amount));
              const heightPct = (day.amount / maxAmount) * 100;
              const limitPct = (budget.dailyLimit / maxAmount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end relative group">
                  <motion.div
                    className={`w-full rounded-t ${day.overBudget ? 'bg-coral' : 'bg-teal'}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                  />
                  <span className="ticket-mono text-[8px] text-ink/40 mt-1">{i + 1}</span>
                  {/* Limit line */}
                  <div className="absolute left-0 right-0 border-t border-dashed border-coral/40" style={{ bottom: `${limitPct}%` }} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-parchment-300">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-teal" />
              <span className="font-sans text-xs text-ink/50">Within budget</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-coral" />
              <span className="font-sans text-xs text-ink/50">Over budget</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-px border-t border-dashed border-coral/60" />
              <span className="font-sans text-xs text-ink/50">Daily limit</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
