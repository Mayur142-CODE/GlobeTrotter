import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, ChevronDown, Clock, Wallet, GripVertical } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import type { Activity } from '@/types/activity';
import { getTrip } from '@/services/tripService';
import { getStops, reorderStops } from '@/services/itineraryService';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateShort, formatDate, daysBetween } from '@/lib/utils';

interface CalendarDay {
  dayNum: number;
  date: string;
  stop: Stop | undefined;
  isTravelDay: boolean;
}

export default function TripCalendar() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [dayActivities, setDayActivities] = useState<Record<number, Activity[]>>({});

  useEffect(() => {
    if (!tripId) return;
    Promise.all([getTrip(tripId), getStops(tripId)]).then(([t, s]) => {
      setTrip(t ?? null);
      setStops(s);
      const actsByDay: Record<number, Activity[]> = {};
      s.forEach((stop) => {
        const stopDays = daysBetween(stop.startDate, stop.endDate);
        for (let d = 0; d < stopDays; d++) {
          const tripDayNum = Math.round((new Date(stop.startDate).getTime() - new Date(t!.startDate).getTime()) / (1000 * 60 * 60 * 24)) + d + 1;
          if (d === 0) actsByDay[tripDayNum] = [...stop.activities];
        }
      });
      setDayActivities(actsByDay);
      setLoading(false);
    });
  }, [tripId]);

  function handleReorderActivities(dayNum: number, reordered: Activity[]) {
    setDayActivities((prev) => ({ ...prev, [dayNum]: reordered }));
    toast({ title: 'Activities reordered', description: 'New order saved for this day.', variant: 'success' });
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <LoadingSkeleton key={i} className="h-20 w-full" />)}
        </div>
      </PageContainer>
    );
  }

  if (!trip) {
    return (
      <PageContainer>
        <EmptyState title="Trip not found" description="This trip may have been deleted." action={<Button onClick={() => navigate('/trips')}>Back to My Trips</Button>} />
      </PageContainer>
    );
  }

  const days = daysBetween(trip.startDate, trip.endDate);
  const calendarDays: CalendarDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(trip.startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    const stop = stops.find((s) => dateStr >= s.startDate && dateStr <= s.endDate);
    calendarDays.push({ dayNum: i + 1, date: dateStr, stop, isTravelDay: !stop });
  }

  return (
    <PageContainer>
      <button onClick={() => navigate(`/itinerary/${trip.id}`)} className="flex items-center gap-1.5 font-sans text-sm text-ink/60 hover:text-teal mb-4 focus-ring rounded">
        <ArrowLeft className="w-4 h-4" aria-hidden /> Back to itinerary
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-midnight">{trip.name} — Calendar</h1>
          <p className="font-sans text-sm text-ink/60 mt-1">{formatDate(trip.startDate)} — {formatDate(trip.endDate)} · {days} days</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/trip/${trip.id}/budget`)}>
          <Wallet className="w-4 h-4" aria-hidden /> View budget
        </Button>
      </div>

      <p className="font-sans text-xs text-ink/50 mb-4 text-center sm:text-left">
        Tip: expand a day and drag activities to reorder them.
      </p>

      {/* Calendar grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {calendarDays.map((day, i) => {
          const isExpanded = expandedDay === day.dayNum;
          const activities = dayActivities[day.dayNum] ?? [];
          const activityCount = activities.length;
          return (
            <motion.div
              key={day.dayNum}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
              className={`boarding-pass overflow-hidden ${day.isTravelDay ? 'opacity-70' : ''}`}
            >
              <button
                onClick={() => setExpandedDay(isExpanded ? null : day.dayNum)}
                className="w-full text-left p-3 focus-ring"
                aria-expanded={isExpanded}
                aria-label={`Day ${day.dayNum}, ${day.stop ? day.stop.city.name : 'travel day'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="ticket-mono text-xs text-ink/40">DAY {String(day.dayNum).padStart(2, '0')}</span>
                  <ChevronDown className={`w-4 h-4 text-ink/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden />
                </div>
                <p className="ticket-mono text-sm text-midnight font-medium">{formatDateShort(day.date)}</p>
                {day.stop ? (
                  <p className="font-serif text-sm font-semibold text-midnight flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-teal" aria-hidden /> {day.stop.city.name}
                  </p>
                ) : (
                  <p className="font-sans text-sm text-ink/40 italic mt-1">Travel day</p>
                )}
                {activityCount > 0 && (
                  <Badge variant="teal" className="mt-1.5">{activityCount} {activityCount === 1 ? 'activity' : 'activities'}</Badge>
                )}
              </button>

              <AnimatePresence>
                {isExpanded && activities.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-dashed border-parchment-300"
                  >
                    <Reorder.Group
                      axis="y"
                      values={activities}
                      onReorder={(reordered) => handleReorderActivities(day.dayNum, reordered)}
                      className="p-3 space-y-2"
                    >
                      {activities.map((act) => (
                        <Reorder.Item
                          key={act.id}
                          value={act}
                          className="flex items-center gap-2 rounded-lg bg-parchment-100/60 px-2.5 py-2 cursor-grab active:cursor-grabbing list-none"
                          whileDrag={{ scale: 1.03, boxShadow: '0 8px 24px rgba(22,35,58,0.15)' }}
                        >
                          <GripVertical className="w-4 h-4 text-ink/30 shrink-0" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="font-sans text-sm font-medium text-midnight truncate">{act.name}</p>
                            <p className="ticket-mono text-xs text-ink/50 flex items-center gap-1">
                              <Clock className="w-3 h-3" aria-hidden />{act.durationHours}h
                            </p>
                          </div>
                          <span className="ticket-mono text-xs text-ink/60 shrink-0">{formatCurrency(act.price)}</span>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </motion.div>
                )}
                {isExpanded && activities.length === 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-dashed border-parchment-300 p-3"
                  >
                    <p className="font-sans text-sm text-ink/40 italic">
                      {day.isTravelDay ? 'No city scheduled for this day.' : 'No activities planned.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </PageContainer>
  );
}
