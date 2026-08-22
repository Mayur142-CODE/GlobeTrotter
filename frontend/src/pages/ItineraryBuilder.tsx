import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, Reorder } from 'framer-motion';
import { PlusCircle, MapPin, Calendar, Wallet, ArrowLeft, Search, Clock, Share2, Eye, Check, Copy } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import type { City } from '@/types/city';
import type { Activity } from '@/types/activity';
import { getTrip, toggleTripPublic } from '@/services/tripService';
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
  const [shareOpen, setShareOpen] = useState(false);
  const [addActivityForStop, setAddActivityForStop] = useState<Stop | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Stop delete confirm state
  const [deletingStopId, setDeletingStopId] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const [t, s] = await Promise.all([getTrip(tripId), getStops(tripId)]);
      setTrip(t ?? null);
      setStops(s);
    } catch (err: any) {
      console.warn('[GlobeTrotter] loadTrip error:', err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  async function handleReorder(reordered: Stop[]) {
    setStops(reordered);
    if (!tripId) return;
    try {
      await reorderStops(tripId, reordered.map((s) => s.id));
      toast({ title: 'Itinerary updated', description: 'Stop order saved.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Reorder error', description: err?.message || 'Could not save new stop order.', variant: 'error' });
    }
  }

  async function handleAddStop(city: City, startDate: string, endDate: string) {
    if (!tripId) return;
    try {
      const stop = await addStop(tripId, { cityId: city.id, startDate, endDate });
      if (stop) {
        setStops((prev) => [...prev, stop]);
        toast({ title: 'Stop added', description: `${city.name} added to your itinerary.`, variant: 'success' });
      }
      setAddStopOpen(false);
    } catch (err: any) {
      toast({ title: 'Failed to add stop', description: err?.message || 'Error creating stop.', variant: 'error' });
    }
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
    try {
      const updated = await addActivityToStop(tripId, stop.id, activity, {
        scheduledDate: stop.startDate,
        customCost: activity.price,
      });
      if (updated) {
        setStops((prev) => prev.map((s) => (s.id === stop.id ? updated : s)));
        toast({ title: 'Activity added', description: `${activity.name} added to ${stop.city.name}.`, variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Error adding activity', description: err?.message || 'Could not add activity.', variant: 'error' });
    }
  }

  async function handleRemoveActivity(stopId: string, activityId: string) {
    if (!tripId) return;
    const stop = stops.find((s) => s.id === stopId);
    if (!stop) return;
    const act = stop.activities.find((a) => a.id === activityId);
    try {
      const updated = await removeActivityFromStop(tripId, stopId, activityId);
      if (updated) {
        setStops((prev) => prev.map((s) => (s.id === stopId ? updated : s)));
        toast({
          title: 'Activity removed',
          description: act ? `${act.name} removed from ${stop.city.name}.` : 'Activity removed.',
          variant: 'success',
        });
      }
    } catch (err: any) {
      toast({ title: 'Error removing activity', description: err?.message || 'Could not remove activity.', variant: 'error' });
    }
  }

  async function handleTogglePublic(isPublic: boolean) {
    if (!tripId) return;
    try {
      const updated = await toggleTripPublic(tripId, isPublic);
      if (updated) {
        setTrip(updated);
        toast({
          title: isPublic ? 'Trip is now public' : 'Trip is now private',
          description: isPublic ? 'Anyone with your link can view this itinerary.' : 'Only you can view this trip.',
          variant: 'success',
        });
      }
    } catch (err: any) {
      toast({ title: 'Sharing update failed', description: err?.message, variant: 'error' });
    }
  }

  const shareUrl = `${window.location.origin}/shared/${tripId}`;

  function handleCopyShareLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast({ title: 'Link copied!', description: 'Public share link copied to clipboard.', variant: 'success' });
      setTimeout(() => setCopiedLink(false), 3000);
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
          description="This trip could not be loaded or may have been deleted."
          action={<Button onClick={() => navigate('/trips')}>Back to My Trips</Button>}
        />
      </PageContainer>
    );
  }

  const days = Math.max(1, daysBetween(trip.startDate, trip.endDate));
  const totalCost = trip.budget.total;

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <button
          onClick={() => navigate('/trips')}
          className="flex items-center gap-1.5 font-sans text-sm text-ink/60 hover:text-teal focus-ring rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden /> Back to trips
        </button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${trip.id}/view`)}>
            <Eye className="w-4 h-4 mr-1.5" /> View Mode
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${trip.id}/budget`)}>
            <Wallet className="w-4 h-4 mr-1.5" /> Budget
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${trip.id}/calendar`)}>
            <Calendar className="w-4 h-4 mr-1.5" /> Calendar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddStopOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" aria-hidden /> Add Stop
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
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4 text-center">Flight Path & Stop Sequence</h2>
          <FlightPathLine
            stops={stops.map((s) => ({ id: s.id, label: s.city.name, sublabel: formatDateShort(s.startDate) }))}
            variant="light"
          />
        </div>
      )}

      {/* Stops list with Delete Stop & Delete Activity actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-midnight">Itinerary Stops & Scheduled Activities</h2>
          <p className="font-sans text-xs text-ink/50">Drag stops to reorder your itinerary</p>
        </div>
        <Button onClick={() => setAddStopOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" aria-hidden /> Add Stop
        </Button>
      </div>

      {stops.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No stops added yet"
          description="Add your first city stop to build your itinerary."
          action={
            <Button onClick={() => setAddStopOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-1.5" aria-hidden /> Add your first stop
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
      <AddStopDialog
        open={addStopOpen}
        tripStart={trip.startDate}
        tripEnd={trip.endDate}
        onClose={() => setAddStopOpen(false)}
        onAdd={handleAddStop}
      />

      {/* Add Activity Dialog */}
      <AddActivityDialog
        stop={addActivityForStop}
        onClose={() => setAddActivityForStop(null)}
        onAdd={(activity) => {
          if (addActivityForStop) handleAddActivity(activity, addActivityForStop);
        }}
      />

      {/* Share Trip Modal */}
      <Dialog open={shareOpen} onOpenChange={(o) => !o && setShareOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Trip Itinerary</DialogTitle>
            <DialogDescription>
              Share your travel itinerary with friends, family, or fellow travelers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-parchment-100/60 border border-parchment-300">
              <div>
                <p className="font-sans text-sm font-semibold text-midnight">Public Visibility</p>
                <p className="font-sans text-xs text-ink/60">Allow anyone with the link to view this itinerary</p>
              </div>
              <input
                type="checkbox"
                checked={trip.status === 'completed' || !!(trip as any).is_public}
                onChange={(e) => handleTogglePublic(e.target.checked)}
                className="w-5 h-5 accent-teal rounded cursor-pointer"
              />
            </div>

            <div>
              <Label htmlFor="share-link-input">Public Itinerary URL</Label>
              <div className="flex gap-2 mt-1.5">
                <Input id="share-link-input" value={shareUrl} readOnly className="ticket-mono text-xs bg-parchment-200/40 text-ink/70" />
                <Button variant="primary" size="sm" onClick={handleCopyShareLink}>
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Stop Modal */}
      <ConfirmDialog
        open={!!deletingStopId}
        onClose={() => setDeletingStopId(null)}
        onConfirm={handleConfirmDeleteStop}
        title="Delete Stop?"
        description="Are you sure you want to delete this stop and all its scheduled activities from your itinerary? This action cannot be undone."
        confirmLabel="Delete Stop"
      />
    </PageContainer>
  );
}

function AddStopDialog({
  open,
  tripStart,
  tripEnd,
  onClose,
  onAdd,
}: {
  open: boolean;
  tripStart: string;
  tripEnd: string;
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
      setStartDate(tripStart);
      setEndDate(tripEnd);
      setError('');
      setResults([]);
    } else {
      setStartDate(tripStart);
      setEndDate(tripEnd);
    }
  }, [open, tripStart, tripEnd]);

  useEffect(() => {
    if (!query.trim()) {
      searchCities('', { sortBy: 'popularity' }).then(setResults);
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
      setError('Please select a destination city.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select arrival and departure dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('Departure date cannot be before arrival date.');
      return;
    }
    if (new Date(startDate) < new Date(tripStart) || new Date(endDate) > new Date(tripEnd)) {
      setError(`Stop dates must be within trip range (${formatDateShort(tripStart)} — ${formatDateShort(tripEnd)}).`);
      return;
    }
    onAdd(selected, startDate, endDate);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Stop</DialogTitle>
          <DialogDescription>Search from the live database of destination cities.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!selected ? (
            <div>
              <Label htmlFor="search-city">Search City / Destination</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <Input
                  id="search-city"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Paris, Tokyo, Mumbai, Kyoto…"
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
                        <div>
                          <span className="font-sans text-sm font-medium text-midnight">{c.name}</span>
                          <span className="font-sans text-xs text-ink/50 block">{c.country}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{c.region}</Badge>
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
                Change City
              </Button>
            </div>
          )}

          {selected && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="stop-start">Arrival Date</Label>
                <Input
                  id="stop-start"
                  type="date"
                  value={startDate}
                  min={tripStart}
                  max={tripEnd}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="stop-end">Departure Date</Label>
                <Input
                  id="stop-end"
                  type="date"
                  value={endDate}
                  min={startDate || tripStart}
                  max={tripEnd}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && <p className="font-sans text-xs text-coral font-medium">{error}</p>}
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
          <DialogTitle>Add Experience to {stop.city.name}</DialogTitle>
          <DialogDescription>Choose curated activities from Supabase catalog for {stop.city.name}.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {loading ? (
            <p className="font-sans text-sm text-ink/50 text-center py-6">Loading activities from catalog…</p>
          ) : activities.length === 0 ? (
            <EmptyState
              title="No activities found"
              description={`No catalog activities for ${stop.city.name} yet.`}
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
