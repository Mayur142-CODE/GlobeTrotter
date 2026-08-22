import { AlertTriangle } from 'lucide-react';

interface OverbudgetAlertProps {
  count: number;
  days: string[];
}

export function OverbudgetAlert({ count, days }: OverbudgetAlertProps) {
  return (
    <div className="rounded-xl border border-coral/30 bg-coral/8 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-coral/15 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5 text-coral" aria-hidden />
      </div>
      <div>
        <p className="font-serif text-base font-semibold text-coral-700">
          {count} {count === 1 ? 'day is' : 'days are'} over budget
        </p>
        <p className="font-sans text-sm text-ink/60 mt-0.5">
          Spending exceeded the daily limit on: <span className="ticket-mono text-midnight">{days.join(', ')}</span>
        </p>
        <p className="font-sans text-xs text-ink/50 mt-1.5">
          Consider redistributing activities or adjusting your daily limit to stay on track.
        </p>
      </div>
    </div>
  );
}
