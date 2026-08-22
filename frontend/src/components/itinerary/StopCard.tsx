import { motion } from 'framer-motion';
import { GripVertical, MapPin, Calendar, Trash2, Plus } from 'lucide-react';
import type { Stop } from '@/types/stop';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateShort, daysBetween, formatCurrency } from '@/lib/utils';

interface StopCardProps {
  stop: Stop;
  index: number;
  onAddActivity?: () => void;
  onRemove?: () => void;
  onActivityRemove?: (activityId: string) => void;
  draggable?: boolean;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}

export function StopCard({
  stop,
  index,
  onAddActivity,
  onRemove,
  onActivityRemove,
  draggable = false,
  dragHandleProps,
  isDragging = false,
}: StopCardProps) {
  const days = daysBetween(stop.startDate, stop.endDate);
  const totalActivityCost = stop.activities.reduce((sum, a) => sum + a.price, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="boarding-pass overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-stretch">
        {draggable && (
          <div
            className="flex items-center justify-center px-2 cursor-grab active:cursor-grabbing bg-midnight/5 text-ink/30 hover:text-ink/60 transition-colors"
            {...dragHandleProps}
          >
            <GripVertical className="w-5 h-5" aria-hidden />
          </div>
        )}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="ticket-mono text-xs text-ink/40">STOP {String(index + 1).padStart(2, '0')}</span>
              <Badge variant="gold">{days} {days === 1 ? 'day' : 'days'}</Badge>
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-lg text-ink/40 hover:text-coral hover:bg-coral/10 transition-colors focus-ring"
                title={`Delete ${stop.city.name} stop`}
                aria-label={`Remove ${stop.city.name} stop from itinerary`}
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            )}
          </div>
          <h3 className="font-serif text-lg font-semibold text-midnight flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal shrink-0" aria-hidden />
            {stop.city.name}, {stop.city.country}
          </h3>
          <p className="ticket-mono text-xs text-ink/50 flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5" aria-hidden />
            {formatDateShort(stop.startDate)} — {formatDateShort(stop.endDate)}
          </p>
        </div>
      </div>

      {/* Perforation */}
      <div className="relative h-px mx-4">
        <div className="absolute inset-0 perforation-x h-px opacity-50" />
      </div>

      {/* Activities */}
      <div className="p-4">
        {stop.activities.length === 0 ? (
          <p className="font-sans text-sm text-ink/40 italic">No activities planned yet.</p>
        ) : (
          <ul className="space-y-2 mb-3">
            {stop.activities.map((act) => (
              <li
                key={act.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-parchment-100/60 px-3 py-2 border border-parchment-300/40 hover:border-parchment-300 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-sans text-sm font-medium text-midnight truncate">{act.name}</p>
                  <p className="ticket-mono text-xs text-ink/50">
                    {act.durationHours}h · {formatCurrency(act.price)}
                  </p>
                </div>
                {onActivityRemove && (
                  <button
                    type="button"
                    onClick={() => onActivityRemove(act.id)}
                    className="p-1 rounded-md text-ink/40 hover:text-coral hover:bg-coral/10 transition-colors focus-ring shrink-0"
                    title={`Delete ${act.name}`}
                    aria-label={`Remove ${act.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between pt-1">
          {totalActivityCost > 0 ? (
            <span className="ticket-mono text-xs text-ink/50">
              Activities total: {formatCurrency(totalActivityCost)}
            </span>
          ) : (
            <span />
          )}
          {onAddActivity && (
            <Button variant="outline" size="sm" onClick={onAddActivity} className="ml-auto text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" aria-hidden />
              Add Activity
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
