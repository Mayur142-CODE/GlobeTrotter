import { motion } from 'framer-motion';
import { Clock, Star, Plus, Check, Trash2, Edit2, Loader2 } from 'lucide-react';
import type { Activity } from '@/types/activity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface ActivityCardProps {
  activity: Activity;
  onAdd?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  added?: boolean;
  loading?: boolean;
  index?: number;
}

export function ActivityCard({
  activity,
  onAdd,
  onRemove,
  onEdit,
  onDelete,
  added = false,
  loading = false,
  index = 0,
}: ActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25) }}
      className="rounded-xl overflow-hidden border border-parchment-300/60 shadow-paper bg-parchment-50 flex flex-col sm:flex-row"
    >
      <div className="sm:w-32 sm:h-auto h-32 shrink-0 overflow-hidden relative">
        <img
          src={activity.imageUrl}
          alt={activity.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <Badge variant="teal" className="mb-1.5">{activity.category}</Badge>
            <h3 className="font-serif text-base font-semibold text-midnight">{activity.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {activity.popularity >= 90 && (
              <Badge variant="gold" className="shrink-0">
                <Star className="w-3 h-3" aria-hidden /> Popular
              </Badge>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0 text-ink/60 hover:text-teal">
                <Edit2 className="w-3.5 h-3.5" aria-hidden />
                <span className="sr-only">Edit activity</span>
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-ink/60 hover:text-coral">
                <Trash2 className="w-3.5 h-3.5" aria-hidden />
                <span className="sr-only">Delete activity</span>
              </Button>
            )}
          </div>
        </div>
        <p className="font-sans text-sm text-ink/60 line-clamp-2 mb-3">{activity.description}</p>
        <div className="flex items-center justify-between mt-auto gap-2">
          <div className="flex items-center gap-3">
            <span className="ticket-mono text-sm font-semibold text-midnight">
              {formatCurrency(activity.price)}
            </span>
            <span className="ticket-mono text-xs text-ink/50 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden />
              {activity.durationHours}h
            </span>
            <span className="ticket-mono text-xs text-ink/50 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-gold" aria-hidden />
              {activity.rating}
            </span>
          </div>
          {added ? (
            onRemove ? (
              <Button variant="coral" size="sm" onClick={onRemove}>
                <Trash2 className="w-4 h-4" aria-hidden />
                Remove
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled className="bg-parchment-200/50 text-teal border-teal/40 font-medium cursor-not-allowed">
                <Check className="w-4 h-4 text-teal" aria-hidden />
                Added
              </Button>
            )
          ) : loading ? (
            <Button variant="primary" size="sm" disabled className="opacity-80">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Adding…
            </Button>
          ) : (
            onAdd && (
              <Button variant="primary" size="sm" onClick={onAdd}>
                <Plus className="w-4 h-4" aria-hidden />
                Add
              </Button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
