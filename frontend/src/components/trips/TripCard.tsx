import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, MapPin, Wallet } from 'lucide-react';
import type { Trip } from '@/types/trip';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, formatDateShort, daysBetween, tripNumber } from '@/lib/utils';

const statusConfig: Record<Trip['status'], { label: string; variant: 'teal' | 'gold' | 'default' | 'coral' }> = {
  upcoming: { label: 'Upcoming', variant: 'teal' },
  active: { label: 'In Progress', variant: 'gold' },
  completed: { label: 'Completed', variant: 'default' },
  draft: { label: 'Draft', variant: 'coral' },
};

export function TripCard({ trip, index = 0 }: { trip: Trip; index?: number }) {
  const navigate = useNavigate();
  const status = statusConfig[trip.status];
  const days = daysBetween(trip.startDate, trip.endDate);
  const route = trip.stops.map((s) => s.city.name).join(' → ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3) }}
      whileHover={{ y: -4 }}
      className="boarding-pass cursor-pointer group"
      onClick={() => navigate(`/itinerary/${trip.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/itinerary/${trip.id}`);
        }
      }}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <span className="ticket-mono text-xs text-ink/50">TRIP {tripNumber(trip.id)}</span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Main content */}
      <div className="px-5 pb-3">
        <h3 className="font-serif text-xl font-semibold text-midnight mb-1 group-hover:text-teal transition-colors">
          {trip.name}
        </h3>
        {route && (
          <p className="font-sans text-sm text-ink/60 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {route}
          </p>
        )}
      </div>

      {/* Perforation */}
      <div className="relative h-px mx-5 mb-3">
        <div className="absolute inset-0 perforation-x h-px opacity-50" />
        <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-parchment border border-parchment-300/60" />
        <div className="absolute -right-2 -top-1.5 w-3 h-3 rounded-full bg-parchment border border-parchment-300/60" />
      </div>

      {/* Metadata */}
      <div className="px-5 pb-4 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Departure</span>
          <span className="ticket-mono text-sm text-midnight font-medium">{formatDateShort(trip.startDate)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Stops</span>
          <span className="ticket-mono text-sm text-midnight font-medium">
            {String(trip.stops.length).padStart(2, '0')}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Est. Cost</span>
          <span className="ticket-mono text-sm text-midnight font-medium">{formatCurrency(trip.budget.total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between">
        <span className="ticket-mono text-xs text-ink/50 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" aria-hidden />
          {days} DAYS
        </span>
        <span className="flex items-center gap-1 font-sans text-sm font-semibold text-teal group-hover:gap-2 transition-all">
          View itinerary
          <ArrowRight className="w-4 h-4" aria-hidden />
        </span>
      </div>
    </motion.div>
  );
}
