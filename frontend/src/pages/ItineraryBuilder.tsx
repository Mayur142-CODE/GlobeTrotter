import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, Reorder } from 'framer-motion';
import { PlusCircle, MapPin, Calendar, Wallet, ArrowLeft, Search, Clock } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import type { City } from '@/types/city';
import type { Activity } from '@/types/activity';
import { getTrip } from '@/services/tripService';
import {
  getStops,
  addStop,
  deleteStop,
  reorderStops,
  addActivityToStop,
  removeActivityFromStop,
} from '@/services/itineraryService';
import { searchCities } from '@/services/citySearchService';
import { searchActivities } from '@/services/activitySearchService';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { StopCard } from '@/components/itinerary/StopCard';
import { ActivityCard } from '@/components/itinerary/ActivityCard';
import { FlightPathLine } from '@/components/itinerary/FlightPathLine';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateShort, daysBetween } from '@/lib/utils';

export default function ItineraryBuilder() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [addActivityForStop, setAddActivityForStop] = useState<Stop | null>(null);

  // Stop delete confirm state
  const [deletingStopId, setDeletingStopId] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    if (!tripId) return;
    const [t, s] = await Promise.all([getTrip(tripId), getStops(tripId)]);
    setTrip(t ?? null);
    setStops(s);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  async function handleReorder(reordered: Stop[]) {
    setStops(reordered);
    if (!tripId) return;
    await reorderStops(tripId, reordered.map((s) => s.id));
    toast({ title: 'Itinerary updated', description: 'Stop order saved.', variant: 'success' });
  }

  async function handleAddStop(city: City, startDate: string, endDate: string) {
    if (!tripId) return;
    const stop = await addStop(tripId, { cityId: city.id, startDate, endDate });
    if (stop) {
      setStops((prev) => [...prev, stop]);
      toast({ title: 'Stop added', description: `${city.name} added to your itinerary.`, variant: 'success' });
    }
    setAddStopOpen(false);
  }

  async function handleConfirmDeleteStop() {
    if (!tripId || !deletingStopId) return;
    const stopToDelete = stops.find((s) => s.id === deletingStopId);
    try {
      await deleteStop(tripId, deletingStopId);
      setStops((prev) => prev.filter((s) => s.id !== deletingStopId));
      toast({
        title: 'Stop removed',
        description: stopToDelete ? `${stopToDelete.city.name} removed from trip.` : 'Stop deleted.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Could not delete stop.', variant: 'error' });
    } finally {
      setDeletingStopId(null);
    }
  }

  async function handleAddActivity(activity: Activity, stop: Stop) {
    if (!tripId) return;
    const updated = await addActivityToStop(tripId, stop.id, activity);
    if (updated) {
      setStops((prev) => prev.map((s) => (s.id === stop.id ? updated : s)));
      toast({ title: 'Activity added', description: `${activity.name} added to ${stop.city.name}.`, variant: 'success' });
    }
  }

  async function handleRemoveActivity(stopId: string, activityId: string) {
    if (!tripId) return;
    const stop = stops.find((s) => s.id === stopId);
    if (!stop) return;
    const act = stop.activities.find((a) => a.id === activityId);
    const updated = await removeActivityFromStop(tripId, stopId, activityId);
    if (updated) {
      setStops((prev) => prev.map((s) => (s.id === stopId ? updated : s)));
      toast({
        title: 'Activity removed',
        description: act ? `${act.name} removed from ${stop.city.name}.` : 'Activity removed.',
        variant: 'success',
      });
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-64 mb-6" />
        <LoadingSkeleton className="h-32 w-full mb-6" />
        <div className="space-y-4">
          <LoadingSkeleton className="h-40 w-full" />
          <LoadingSkeleton className="h-40 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!trip) {
    return (
      <PageContainer>
        <EmptyState
          title="Trip not found"
          description="This trip may have been deleted."
          action={<Button onClick={() => navigate('/trips')}>Back to My Trips</Button>}
        />
      </PageContainer>
    );
  }

  const days = daysBetween(trip.startDate, trip.endDate);
  const totalCost = trip.budget.total;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/trips')}
          className="flex items-center gap-1.5 font-sans text-sm text-ink/60 hover:text-teal focus-ring rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Back to trips
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${trip.id}`)}>
            View Itinerary
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddStopOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-1" aria-hidden /> Add Stop
          </Button>
        </div>
      </div>

      {/* Trip header */}
      <div className="boarding-pass overflow-hidden mb-6">
        <div className="relative h-40 sm:h-48">
          <img src={trip.coverPhotoUrl} alt={trip.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-midnight/30 to-transparent" />
          <div className="absolute bottom-3 left-5 right-5">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-parchment-50">{trip.name}</h1>
          </div>
        </div>
        <div className="p-5">
          <p className="font-sans text-sm text-ink/60 mb-4">{trip.description}</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-teal" aria-hidden />
              <span className="ticket-mono text-midnight">
                {formatDateShort(trip.startDate)} — {formatDateShort(trip.endDate)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-teal" aria-hidden />
              <span className="ticket-mono text-midnight">{stops.length} stops</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-teal" aria-hidden />
              <span className="ticket-mono text-midnight">{days} days</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Wallet className="w-4 h-4 text-teal" aria-hidden />
              <span className="ticket-mono text-midnight">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flight path */}
      {stops.length > 0 && (
        <div className="boarding-pass p-6 mb-6">
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4 text-center">Flight Path</h2>
          <FlightPathLine
            stops={stops.map((s) => ({ id: s.id, label: s.city.name, sublabel: formatDateShort(s.startDate) }))}
            variant="light"
          />
        </div>
      )}

      {/* Stops list with Delete Stop & Delete Activity actions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-semibold text-midnight">Itinerary Stops & Activities</h2>
        <Button onClick={() => setAddStopOpen(true)}>
          <PlusCircle className="w-4 h-4" aria-hidden /> Add Stop
        </Button>
      </div>

      {stops.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No stops added yet"
          description="Add your first city stop to build your itinerary."
          action={
            <Button onClick={() => setAddStopOpen(true)}>
              <PlusCircle className="w-4 h-4" aria-hidden /> Add your first stop
            </Button>
          }
        />
      ) : (
        <Reorder.Group axis="y" values={stops} onReorder={handleReorder} className="space-y-4">
          {stops.map((stop, i) => (
            <Reorder.Item key={stop.id} value={stop}>
              <StopCard
                stop={stop}
                index={i}
                draggable
                onRemove={() => setDeletingStopId(stop.id)}
                onAddActivity={() => setAddActivityForStop(stop)}
                onActivityRemove={(actId) => handleRemoveActivity(stop.id, actId)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Add Stop Dialog */}
      <AddStopDialog open={addStopOpen} onClose={() => setAddStopOpen(false)} onAdd={handleAddStop} />

      {/* Add Activity Dialog */}
      <AddActivityDialog
        stop={addActivityForStop}
        onClose={() => setAddActivityForStop(null)}
        onAdd={(activity) => {
          if (addActivityForStop) handleAddActivity(activity, addActivityForStop);
        }}
      />

      {/* Confirm Delete Stop Modal */}
      <ConfirmDialog
        open={!!deletingStopId}
        onClose={() => setDeletingStopId(null)}
        onConfirm={handleConfirmDeleteStop}
        title="Delete Stop"
        description="Are you sure you want to delete this stop and all its scheduled activities from your itinerary?"
        confirmText="Delete Stop"
        variant="danger"
      />
    </PageContainer>
  );
}

function AddStopDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (city: City, start: string, end: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<City | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelected(null);
      setStartDate('');
      setEndDate('');
      setError('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchCities(query).then((res) => {
      setResults(res);
      setSearching(false);
    });
  }, [query]);

  function handleAdd() {
    if (!selected) {
      setError('Please select a city.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date.');
      return;
    }
    onAdd(selected, startDate, endDate);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Stop</DialogTitle>
          <DialogDescription>Search for a city to add to your itinerary.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!selected ? (
            <div>
              <Label htmlFor="search-city">Search City</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <Input
                  id="search-city"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Paris, Tokyo, Mumbai…"
                  className="pl-10"
                />
              </div>
              {searching && <p className="font-sans text-xs text-ink/50 mt-2">Searching cities…</p>}
              {results.length > 0 && (
                <ul className="mt-2 border border-parchment-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-parchment-200 bg-parchment-50">
                  {results.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(c)}
                        className="w-full text-left px-3 py-2 hover:bg-parchment-200/60 transition-colors flex items-center justify-between"
                      >
                        <span className="font-sans text-sm font-medium text-midnight">{c.name}</span>
                        <span className="ticket-mono text-xs text-ink/50">{c.country}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-between">
              <div>
                <p className="font-serif text-sm font-semibold text-midnight">{selected.name}</p>
                <p className="ticket-mono text-xs text-ink/60">{selected.country}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Change
              </Button>
            </div>
          )}

          {selected && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="stop-start">Start Date</Label>
                <Input
                  id="stop-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="stop-end">End Date</Label>
                <Input
                  id="stop-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && <p className="font-sans text-xs text-coral">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selected} onClick={handleAdd}>
            Add Stop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddActivityDialog({
  stop,
  onClose,
  onAdd,
}: {
  stop: Stop | null;
  onClose: () => void;
  onAdd: (activity: Activity) => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stop) {
      setActivities([]);
      return;
    }
    setLoading(true);
    searchActivities(stop.cityId, '').then((res) => {
      setActivities(res);
      setLoading(false);
    });
  }, [stop]);

  if (!stop) return null;

  return (
    <Dialog open={!!stop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Activity to {stop.city.name}</DialogTitle>
          <DialogDescription>Select experiences to add to this stop.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {loading ? (
            <p className="font-sans text-sm text-ink/50 text-center py-4">Loading activities…</p>
          ) : activities.length === 0 ? (
            <EmptyState
              title="No activities available"
              description={`No activities listed for ${stop.city.name} yet.`}
            />
          ) : (
            activities.map((act) => {
              const added = stop.activities.some((a) => a.id === act.id);
              return (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  added={added}
                  onAdd={() => onAdd(act)}
                />
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
