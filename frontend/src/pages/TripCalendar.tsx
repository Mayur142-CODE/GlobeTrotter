import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ChevronDown,
  Wallet,
  GripVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import type { Activity } from '@/types/activity';
import { getTrip } from '@/services/tripService';
import {
  getStops,
  reorderActivitiesInStop,
  updateActivityInStop,
  removeActivityFromStop,
} from '@/services/itineraryService';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
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

  // Quick edit modal state
  const [editingActivity, setEditingActivity] = useState<{ activity: Activity; stopId: string } | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Quick delete activity confirm state
  const [deletingActivity, setDeletingActivity] = useState<{ stopId: string; activityId: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!tripId) return;
    try {
      const [t, s] = await Promise.all([getTrip(tripId), getStops(tripId)]);
      setTrip(t ?? null);
      setStops(s);

      if (t) {
        const tripDays = Math.max(1, daysBetween(t.startDate, t.endDate));
        const actsByDay: Record<number, Activity[]> = {};

        for (let i = 0; i < tripDays; i++) {
          const curDate = new Date(t.startDate);
          curDate.setDate(curDate.getDate() + i);
          const dateStr = curDate.toISOString().slice(0, 10);
          const dayNum = i + 1;

          // Find stop for this day
          const matchingStop = s.find((stop) => dateStr >= stop.startDate && dateStr <= stop.endDate);
          if (matchingStop) {
            // Filter activities scheduled on this specific date or all stop activities on first day
            const scheduled = matchingStop.activities.filter(
              (act) => act.scheduledDate === dateStr || (!act.scheduledDate && dateStr === matchingStop.startDate)
            );
            actsByDay[dayNum] = scheduled.length > 0 ? scheduled : matchingStop.activities;
          } else {
            actsByDay[dayNum] = [];
          }
        }
        setDayActivities(actsByDay);
      }
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleReorderActivities(dayNum: number, reordered: Activity[]) {
    setDayActivities((prev) => ({ ...prev, [dayNum]: reordered }));
    if (!tripId) return;

    // Find corresponding stop
    const day = calendarDays.find((d) => d.dayNum === dayNum);
    if (day?.stop) {
      try {
        await reorderActivitiesInStop(tripId, day.stop.id, reordered.map((a) => a.id));
        toast({ title: 'Activities reordered', description: 'Schedule updated in Supabase.', variant: 'success' });
      } catch (err: any) {
        console.warn('[GlobeTrotter] reorder activity error:', err);
      }
    }
  }

  const openEditModal = (activity: Activity, stopId: string) => {
    setEditingActivity({ activity, stopId });
    setEditStartTime(activity.startTime || '10:00');
    setEditEndTime(activity.endTime || '12:00');
    setEditCost(String(activity.price || 0));
    setEditNotes(activity.notes || '');
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId || !editingActivity) return;

    setSavingEdit(true);
    try {
      await updateActivityInStop(tripId, editingActivity.stopId, editingActivity.activity.id, {
        startTime: editStartTime,
        endTime: editEndTime,
        customCost: Number(editCost) || 0,
        notes: editNotes,
      });

      toast({ title: 'Experience updated', description: 'Saved changes to Supabase.', variant: 'success' });
      setEditingActivity(null);
      await loadData();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err?.message, variant: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteActivityConfirm = async () => {
    if (!tripId || !deletingActivity) return;
    try {
      await removeActivityFromStop(tripId, deletingActivity.stopId, deletingActivity.activityId);
      toast({ title: 'Experience removed', description: `"${deletingActivity.name}" removed.`, variant: 'success' });
      setDeletingActivity(null);
      await loadData();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message, variant: 'error' });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!trip) {
    return (
      <PageContainer>
        <EmptyState
          title="Trip not found"
          description="Could not load calendar for this trip."
          action={<Button onClick={() => navigate('/trips')}>Back to My Trips</Button>}
        />
      </PageContainer>
    );
  }

  const days = Math.max(1, daysBetween(trip.startDate, trip.endDate));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <button
          onClick={() => navigate(`/itinerary/${trip.id}`)}
          className="flex items-center gap-1.5 font-sans text-sm text-ink/60 hover:text-teal focus-ring rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Back to itinerary
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${trip.id}/view`)}>
            View Itinerary
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${trip.id}/budget`)}>
            <Wallet className="w-4 h-4 mr-1.5" aria-hidden /> Budget
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-midnight">{trip.name} — Calendar & Timeline</h1>
          <p className="font-sans text-sm text-ink/60 mt-1">
            {formatDate(trip.startDate)} — {formatDate(trip.endDate)} · {days} days · {stops.length} destinations
          </p>
        </div>
      </div>

      <p className="font-sans text-xs text-ink/50 mb-4">
        Tip: Expand any day below to view scheduled experiences, drag to reorder them, or click edit to set custom times and costs.
      </p>

      {/* Calendar Grid */}
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
                className="w-full text-left p-3.5 focus-ring"
                aria-expanded={isExpanded}
                aria-label={`Day ${day.dayNum}, ${day.stop ? day.stop.city.name : 'travel day'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="ticket-mono text-xs text-ink/40">DAY {String(day.dayNum).padStart(2, '0')}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-ink/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </div>
                <p className="ticket-mono text-sm text-midnight font-medium">{formatDateShort(day.date)}</p>
                {day.stop ? (
                  <p className="font-serif text-sm font-semibold text-midnight flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-teal" aria-hidden /> {day.stop.city.name}
                  </p>
                ) : (
                  <p className="font-sans text-sm text-ink/40 italic mt-1">Travel / Transit Day</p>
                )}
                {activityCount > 0 && (
                  <Badge variant="teal" className="mt-2 text-[10px]">
                    {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                  </Badge>
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
                          className="flex items-center gap-2 rounded-lg bg-parchment-100/70 p-2 cursor-grab active:cursor-grabbing list-none border border-parchment-300/60"
                        >
                          <GripVertical className="w-4 h-4 text-ink/30 shrink-0" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="font-sans text-xs font-semibold text-midnight truncate">{act.name}</p>
                            <div className="flex items-center gap-2 ticket-mono text-[10px] text-ink/60">
                              {act.startTime && <span>{act.startTime}</span>}
                              <span>{act.durationHours}h</span>
                              <span>{formatCurrency(act.price)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {day.stop && (
                              <button
                                onClick={() => openEditModal(act, day.stop!.id)}
                                className="p-1 text-ink/40 hover:text-teal rounded focus-ring"
                                aria-label="Edit activity details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {day.stop && (
                              <button
                                onClick={() => setDeletingActivity({ stopId: day.stop!.id, activityId: act.id, name: act.name })}
                                className="p-1 text-ink/40 hover:text-coral rounded focus-ring"
                                aria-label="Delete activity from day"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
                    className="border-t border-dashed border-parchment-300 p-3 text-center"
                  >
                    <p className="font-sans text-xs text-ink/40 italic">
                      {day.isTravelDay ? 'No stops scheduled.' : 'No activities scheduled for this day.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Edit Activity Modal */}
      <Dialog open={!!editingActivity} onClose={() => setEditingActivity(null)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Activity Schedule</DialogTitle>
          <DialogDescription>{editingActivity?.activity.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveEditSubmit} className="space-y-4 px-6 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="act-start">Start Time</Label>
              <Input
                id="act-start"
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="act-end">End Time</Label>
              <Input
                id="act-end"
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="act-cost">Cost (INR ₹)</Label>
            <Input
              id="act-cost"
              type="number"
              min="0"
              value={editCost}
              onChange={(e) => setEditCost(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="act-notes">Notes / Booking Details</Label>
            <Input
              id="act-notes"
              placeholder="e.g. Booking Ref #1234, Entry gate 4"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setEditingActivity(null)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button type="submit" disabled={savingEdit}>
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Activity Confirm */}
      <ConfirmDialog
        open={!!deletingActivity}
        onClose={() => setDeletingActivity(null)}
        onConfirm={handleDeleteActivityConfirm}
        title="Remove activity from day?"
        description={`Are you sure you want to remove "${deletingActivity?.name}" from this itinerary stop?`}
        confirmLabel="Remove activity"
      />
    </PageContainer>
  );
}
