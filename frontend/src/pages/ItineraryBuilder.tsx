import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, Reorder } from 'framer-motion';
import {
  PlusCircle,
  MapPin,
  Calendar,
  Wallet,
  ArrowLeft,
  Search,
  Clock,
  Share2,
  Eye,
  Check,
  Copy,
  Info,
  Lock,
  Pencil,
} from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import type { City } from '@/types/city';
import type { Activity } from '@/types/activity';
import { getTrip, toggleTripPublic } from '@/services/tripService';
import {
  getStops,
  addStop,
  updateStop,
  deleteStop,
  reorderStops,
  addActivityToStop,
  removeActivityFromStop,
} from '@/services/itineraryService';
import { searchCities } from '@/services/citySearchService';
import { searchActivities } from '@/services/activitySearchService';
import { getNextStopArrival, validateNewStopDates, diffDays } from '@/lib/dateSequence';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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

  // Dialog states
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
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
      const updatedStops = await reorderStops(tripId, reordered.map((s) => s.id));
      setStops(updatedStops);
      toast({
        title: 'Timeline re-sequenced',
        description: 'Stop orders and dates automatically updated.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Reorder error',
        description: err?.message || 'Could not re-sequence timeline.',
        variant: 'error',
      });
      loadTrip();
    }
  }

  async function handleAddStop(city: City, startDate: string, endDate: string): Promise<boolean> {
    if (!tripId) return false;
    try {
      const newStop = await addStop(tripId, { cityId: city.id, startDate, endDate });
      if (newStop) {
        setStops((prev) => [...prev, newStop]);
      }
      setAddStopOpen(false);
      toast({
        title: 'Stop added',
        description: `${city.name} added to your itinerary.`,
        variant: 'success',
      });
      await loadTrip();
      return true;
    } catch (err: any) {
      toast({
        title: 'Error adding stop',
        description: err?.message || 'Could not add stop.',
        variant: 'error',
      });
      return false;
    }
  }

  async function handleSaveEditedStop(stopId: string, endDate: string, notes?: string): Promise<boolean> {
    if (!tripId) return false;
    try {
      const updatedStops = await updateStop(tripId, stopId, { endDate, notes });
      setStops(updatedStops);
      setEditingStop(null);
      toast({
        title: 'Stop updated',
        description: 'Departure date adjusted and following stops re-sequenced.',
        variant: 'success',
      });
      await loadTrip();
      return true;
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.message || 'Could not update stop timeline.',
        variant: 'error',
      });
      return false;
    }
  }

  async function handleConfirmDeleteStop() {
    if (!tripId || !deletingStopId) return;
    const stopToDelete = stops.find((s) => s.id === deletingStopId);
    try {
      await deleteStop(tripId, deletingStopId);
      toast({
        title: 'Stop removed',
        description: stopToDelete ? `${stopToDelete.city.name} removed. Timeline re-sequenced.` : 'Stop deleted.',
        variant: 'success',
      });
      await loadTrip();
    } catch (err: any) {
      toast({
        title: 'Delete failed',
        description: err?.message || 'Could not delete stop.',
        variant: 'error',
      });
    } finally {
      setDeletingStopId(null);
    }
  }

  async function handleAddActivity(activity: Activity, stop: Stop): Promise<boolean> {
    if (!tripId) return false;
    try {
      const updated = await addActivityToStop(tripId, stop.id, activity, {
        scheduledDate: stop.startDate,
        customCost: activity.price,
      });
      if (updated) {
        setStops((prev) => prev.map((s) => (s.id === stop.id ? updated : s)));
        toast({ title: 'Activity added', description: `${activity.name} added to ${stop.city.name}.`, variant: 'success' });
        return true;
      }
      return false;
    } catch (err: any) {
      toast({ title: 'Error adding activity', description: err?.message || 'Could not add activity.', variant: 'error' });
      return false;
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
          description="The itinerary you are looking for does not exist or has been removed."
          action={<Button onClick={() => navigate('/trips')}>Back to Trips</Button>}
        />
      </PageContainer>
    );
  }

  const totalActivities = stops.reduce((sum, s) => sum + (s.activities?.length || 0), 0);
  const totalCost = stops.reduce(
    (sum, s) => sum + (s.activities || []).reduce((aSum, a) => aSum + (a.price || 0), 0),
    0
  );
  const tripDays = Math.max(1, daysBetween(trip.startDate, trip.endDate));

  return (
    <PageContainer>
      {/* Top Header & Quick Actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/trips')}
            className="font-sans text-xs text-ink/60 hover:text-teal flex items-center gap-1.5 mb-2 focus-ring rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Trips
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-midnight">{trip.name}</h1>
            <Badge variant={trip.status === 'upcoming' ? 'teal' : 'gold'}>{trip.status}</Badge>
          </div>
          <p className="font-sans text-xs text-ink/60 mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-teal" />
            <span className="ticket-mono">{formatDateShort(trip.startDate)} — {formatDateShort(trip.endDate)}</span>
            <span>({tripDays} days)</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${trip.id}/view`)}>
            <Eye className="w-4 h-4 mr-1.5" /> Preview View
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${trip.id}/budget`)}>
            <Wallet className="w-4 h-4 mr-1.5" /> Budget ({formatCurrency(totalCost)})
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${trip.id}/calendar`)}>
            <Calendar className="w-4 h-4 mr-1.5" /> Calendar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddStopOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" /> Add Stop
          </Button>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="boarding-pass p-3 text-center">
          <p className="ticket-mono text-[10px] text-ink/50 uppercase">Destinations</p>
          <p className="font-serif text-xl font-bold text-midnight mt-0.5">{stops.length} Cities</p>
        </div>
        <div className="boarding-pass p-3 text-center">
          <p className="ticket-mono text-[10px] text-ink/50 uppercase">Activities</p>
          <p className="font-serif text-xl font-bold text-midnight mt-0.5">{totalActivities} Experiences</p>
        </div>
        <div className="boarding-pass p-3 text-center">
          <p className="ticket-mono text-[10px] text-ink/50 uppercase">Est. Expenses</p>
          <p className="font-serif text-xl font-bold text-teal mt-0.5">{formatCurrency(totalCost)}</p>
        </div>
        <div className="boarding-pass p-3 text-center">
          <p className="ticket-mono text-[10px] text-ink/50 uppercase">Budget Ceiling</p>
          <p className="font-serif text-xl font-bold text-midnight mt-0.5">
            {trip.budget?.total ? formatCurrency(trip.budget.total) : 'None'}
          </p>
        </div>
      </div>

      {/* Flight Path Summary */}
      {stops.length > 1 && (
        <div className="mb-8 boarding-pass p-4">
          <h2 className="font-serif text-sm font-semibold text-midnight mb-3">Multi-City Routing Timeline</h2>
          <FlightPathLine
            stops={stops.map((s) => ({
              id: s.id,
              label: s.city.name,
              sublabel: `${formatDateShort(s.startDate)} — ${formatDateShort(s.endDate)}`,
            }))}
          />
        </div>
      )}

      {/* Sequential Stops Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-midnight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal" /> Multi-City Itinerary Timeline
          </h2>
          <span className="font-sans text-xs text-ink/50">Drag stops to re-sequence timeline</span>
        </div>

        {stops.length === 0 ? (
          <div className="boarding-pass p-12 text-center border-dashed">
            <MapPin className="w-12 h-12 text-teal/40 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-midnight">No Stops Added Yet</h3>
            <p className="font-sans text-xs text-ink/60 max-w-sm mx-auto mt-1 mb-4">
              Add your first city stop. Stops are automatically calculated sequentially from your trip dates.
            </p>
            <Button variant="primary" onClick={() => setAddStopOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-1.5" /> Add First Stop
            </Button>
          </div>
        ) : (
          <Reorder.Group axis="y" values={stops} onReorder={handleReorder} className="space-y-6">
            {stops.map((stop, index) => (
              <Reorder.Item key={stop.id} value={stop} className="cursor-grab active:cursor-grabbing">
                <StopCard
                  stop={stop}
                  index={index}
                  onAddActivity={() => setAddActivityForStop(stop)}
                  onEdit={() => setEditingStop(stop)}
                  onRemove={() => setDeletingStopId(stop.id)}
                  onActivityRemove={(actId: string) => handleRemoveActivity(stop.id, actId)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Add Stop Dialog */}
      <AddStopDialog
        open={addStopOpen}
        tripStart={trip.startDate}
        tripEnd={trip.endDate}
        existingStops={stops}
        onClose={() => setAddStopOpen(false)}
        onAdd={handleAddStop}
      />

      {/* Edit Stop Dialog */}
      {editingStop && (
        <EditStopDialog
          stop={editingStop}
          tripStart={trip.startDate}
          tripEnd={trip.endDate}
          stops={stops}
          onClose={() => setEditingStop(null)}
          onSave={handleSaveEditedStop}
        />
      )}

      {/* Add Activity Dialog */}
      <AddActivityDialog
        stop={addActivityForStop}
        onClose={() => setAddActivityForStop(null)}
        onAdd={(activity) => {
          if (!addActivityForStop) return Promise.resolve(false);
          return handleAddActivity(activity, addActivityForStop);
        }}
      />

      {/* Share Trip Modal */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Trip Itinerary</DialogTitle>
          <DialogDescription>
            Share your travel itinerary with friends, family, or fellow travelers.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-3 space-y-4">
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
      </Dialog>

      {/* Confirm Delete Stop Modal */}
      <ConfirmDialog
        open={!!deletingStopId}
        onClose={() => setDeletingStopId(null)}
        onConfirm={handleConfirmDeleteStop}
        title="Delete Stop?"
        description="Are you sure you want to delete this stop and all its scheduled activities from your itinerary? Following stops will automatically re-sequence."
        confirmLabel="Delete Stop"
      />
    </PageContainer>
  );
}

/**
 * Add Stop Dialog enforcing strictly sequential timeline logic
 */
function AddStopDialog({
  open,
  tripStart,
  tripEnd,
  existingStops,
  onClose,
  onAdd,
}: {
  open: boolean;
  tripStart: string;
  tripEnd: string;
  existingStops: Stop[];
  onClose: () => void;
  onAdd: (city: City, start: string, end: string) => Promise<boolean> | void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<City | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Locked arrival date calculated automatically
  const arrivalDate = getNextStopArrival(tripStart, existingStops);
  const [departureDate, setDepartureDate] = useState(arrivalDate);
  const [error, setError] = useState('');

  const isFirstStop = existingStops.length === 0;
  const previousStop = existingStops.length > 0 ? existingStops[existingStops.length - 1] : null;

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelected(null);
      setError('');
      setResults([]);
      setSubmitting(false);
    } else {
      const nextArr = getNextStopArrival(tripStart, existingStops);
      setDepartureDate(nextArr);
      setError('');
    }
  }, [open, tripStart, tripEnd, existingStops]);

  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      searchCities('', { sortBy: 'popularity' }).then(setResults);
      return;
    }
    setSearching(true);
    searchCities(query).then((res) => {
      setResults(res);
      setSearching(false);
    });
  }, [query, open]);

  async function handleAdd() {
    if (!selected) {
      setError('Please select a destination city.');
      return;
    }

    const validation = validateNewStopDates(
      tripStart,
      tripEnd,
      existingStops,
      arrivalDate,
      departureDate
    );

    if (!validation.valid) {
      setError(validation.error || 'Invalid dates.');
      return;
    }

    setSubmitting(true);
    try {
      await onAdd(selected, arrivalDate, departureDate);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not add stop.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-md">
      <DialogHeader>
        <DialogTitle>Add a Stop</DialogTitle>
        <DialogDescription>
          {isFirstStop
            ? `First stop begins on trip start (${formatDateShort(tripStart)}).`
            : `Stop continues sequentially from ${previousStop?.city.name} (${formatDateShort(arrivalDate)}).`}
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 py-2 space-y-4">
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
              <ul className="mt-2 border border-parchment-300 rounded-lg max-h-44 overflow-y-auto divide-y divide-parchment-200 bg-parchment-50">
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
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Label htmlFor="stop-start">Arrival Date</Label>
                  <Lock className="w-3 h-3 text-ink/40" />
                </div>
                <Input
                  id="stop-start"
                  type="date"
                  value={arrivalDate}
                  disabled
                  readOnly
                  className="bg-parchment-200/60 text-ink/80 font-mono text-xs cursor-not-allowed"
                />
                <p className="text-[10px] text-ink/50 mt-1">
                  {isFirstStop
                    ? 'Trip Start Date'
                    : `From previous stop departure`}
                </p>
              </div>
              <div>
                <Label htmlFor="stop-end" className="mb-1 block">Departure Date</Label>
                <Input
                  id="stop-end"
                  type="date"
                  value={departureDate}
                  min={arrivalDate}
                  max={tripEnd}
                  onChange={(e) => {
                    setDepartureDate(e.target.value);
                    setError('');
                  }}
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-ink/50 mt-1">
                  Max: {formatDateShort(tripEnd)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-parchment-100/70 p-2.5 border border-parchment-300/60 flex items-start gap-2 text-xs text-ink/70">
              <Info className="w-4 h-4 text-teal shrink-0 mt-0.5" />
              <span>
                Stay length:{' '}
                <strong>{Math.max(1, diffDays(arrivalDate, departureDate))} day(s)</strong> (
                {formatDateShort(arrivalDate)} to {formatDateShort(departureDate)}).
              </span>
            </div>
          </div>
        )}

        {error && <p className="font-sans text-xs text-coral font-medium">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button disabled={!selected || submitting} onClick={handleAdd}>
          {submitting ? 'Adding Stop…' : 'Add Stop'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

/**
 * Edit Stop Dialog allowing departure date adjustments with continuous timeline updates
 */
function EditStopDialog({
  stop,
  tripStart,
  tripEnd,
  stops,
  onClose,
  onSave,
}: {
  stop: Stop;
  tripStart: string;
  tripEnd: string;
  stops: Stop[];
  onClose: () => void;
  onSave: (stopId: string, endDate: string, notes?: string) => Promise<boolean> | void;
}) {
  const [departureDate, setDepartureDate] = useState(stop.endDate);
  const [notes, setNotes] = useState(stop.notes || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const stopIndex = stops.findIndex((s) => s.id === stop.id);
  const isFirstStop = stopIndex === 0;

  async function handleSave() {
    if (!departureDate) {
      setError('Please select a departure date.');
      return;
    }
    if (departureDate < stop.startDate) {
      setError(`Departure date cannot be before arrival date (${formatDateShort(stop.startDate)}).`);
      return;
    }
    if (departureDate > tripEnd) {
      setError(`Departure date cannot be after trip end date (${formatDateShort(tripEnd)}).`);
      return;
    }

    setSaving(true);
    try {
      await onSave(stop.id, departureDate, notes);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!stop} onClose={onClose} className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Stop: {stop.city.name}</DialogTitle>
        <DialogDescription>
          Modify departure date. Following stops will automatically re-sequence to maintain a continuous timeline.
        </DialogDescription>
      </DialogHeader>

      <div className="px-6 py-2 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Label htmlFor="edit-stop-start">Arrival Date</Label>
              <Lock className="w-3 h-3 text-ink/40" />
            </div>
            <Input
              id="edit-stop-start"
              type="date"
              value={stop.startDate}
              disabled
              readOnly
              className="bg-parchment-200/60 text-ink/80 font-mono text-xs cursor-not-allowed"
            />
            <p className="text-[10px] text-ink/50 mt-1">
              {isFirstStop ? 'Trip Start Date' : 'From previous stop'}
            </p>
          </div>
          <div>
            <Label htmlFor="edit-stop-end" className="mb-1 block">Departure Date</Label>
            <Input
              id="edit-stop-end"
              type="date"
              value={departureDate}
              min={stop.startDate}
              max={tripEnd}
              onChange={(e) => {
                setDepartureDate(e.target.value);
                setError('');
              }}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-ink/50 mt-1">Max: {formatDateShort(tripEnd)}</p>
          </div>
        </div>

        <div>
          <Label htmlFor="edit-stop-notes">Stop Notes / Accommodation</Label>
          <Textarea
            id="edit-stop-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Hotel reservation, neighborhoods to explore…"
            rows={3}
            className="mt-1"
          />
        </div>

        {error && <p className="font-sans text-xs text-coral font-medium">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

/**
 * Add Activity Dialog with immediate database insert, loading state, duplicate prevention, and auto-close
 */
function AddActivityDialog({
  stop,
  onClose,
  onAdd,
}: {
  stop: Stop | null;
  onClose: () => void;
  onAdd: (activity: Activity) => Promise<boolean>;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingActivityId, setAddingActivityId] = useState<string | null>(null);

  useEffect(() => {
    if (!stop) {
      setActivities([]);
      setAddingActivityId(null);
      return;
    }
    setLoading(true);
    searchActivities(stop.cityId, '').then((res) => {
      setActivities(res);
      setLoading(false);
    });
  }, [stop]);

  if (!stop) return null;

  const handleAddClick = async (act: Activity) => {
    if (addingActivityId) return;
    setAddingActivityId(act.id);
    try {
      const success = await onAdd(act);
      if (success) {
        onClose();
      }
    } finally {
      setAddingActivityId(null);
    }
  };

  return (
    <Dialog open={!!stop} onClose={onClose} className="max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
      <DialogHeader>
        <DialogTitle>Add Experience to {stop.city.name}</DialogTitle>
        <DialogDescription>Choose curated activities from Supabase catalog for {stop.city.name}.</DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3">
        {loading ? (
          <p className="font-sans text-sm text-ink/50 text-center py-8">Loading activities from catalog…</p>
        ) : activities.length === 0 ? (
          <EmptyState
            title="No activities found"
            description={`No catalog activities for ${stop.city.name} yet.`}
          />
        ) : (
          activities.map((act) => {
            const added = (stop.activities || []).some((a) => a.id === act.id || a.name === act.name);
            return (
              <ActivityCard
                key={act.id}
                activity={act}
                added={added}
                loading={addingActivityId === act.id}
                onAdd={() => handleAddClick(act)}
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
    </Dialog>
  );
}
