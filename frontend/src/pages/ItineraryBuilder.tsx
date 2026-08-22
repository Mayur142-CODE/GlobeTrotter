import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { PlusCircle, MapPin, Calendar, Wallet, ArrowLeft, Search, X, Clock } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import type { City } from '@/types/city';
import type { Activity } from '@/types/activity';
import { getTrip } from '@/services/tripService';
import { getStops, addStop, reorderStops, addActivityToStop, removeActivityFromStop } from '@/services/itineraryService';
import { searchCities } from '@/services/citySearchService';
import { searchActivities } from '@/services/activitySearchService';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { StopCard } from '@/components/itinerary/StopCard';
import { ActivityCard } from '@/components/itinerary/ActivityCard';
import { FlightPathLine } from '@/components/itinerary/FlightPathLine';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency, formatDateShort, daysBetween } from '@/lib/utils';

export default function ItineraryBuilder() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [addActivityForStop, setAddActivityForStop] = useState<Stop | null>(null);

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
    const updated = await removeActivityFromStop(tripId, stopId, activityId);
    if (updated) {
      setStops((prev) => prev.map((s) => (s.id === stopId ? updated : s)));
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-64 mb-6" />
        <LoadingSkeleton className="h-32 w-full mb-6" />
        <div className="space-y-4">
          <LoadingSkeleton className="h-40 w-full" /><LoadingSkeleton className="h-40 w-full" />
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
  const totalCost = trip.budget.total + stops.reduce((sum, s) => sum + s.activities.reduce((a, act) => a + act.price, 0), 0);

  return (
    <PageContainer>
      <button onClick={() => navigate('/trips')} className="flex items-center gap-1.5 font-sans text-sm text-ink/60 hover:text-teal mb-4 focus-ring rounded">
        <ArrowLeft className="w-4 h-4" aria-hidden /> Back to trips
      </button>

      {/* Trip header */}
      <div className="boarding-pass overflow-hidden mb-6">
        <div className="relative h-32">
          <img src={trip.coverPhotoUrl} alt={trip.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
          <div className="absolute bottom-3 left-5 right-5">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-parchment-50">{trip.name}</h1>
          </div>
        </div>
        <div className="p-5">
          <p className="font-sans text-sm text-ink/60 mb-4">{trip.description}</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-teal" aria-hidden />
              <span className="ticket-mono text-midnight">{formatDateShort(trip.startDate)} — {formatDateShort(trip.endDate)}</span>
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

      {/* Stops */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-semibold text-midnight">Stops</h2>
        <Button onClick={() => setAddStopOpen(true)}>
          <PlusCircle className="w-4 h-4" aria-hidden /> Add Stop
        </Button>
      </div>

      {stops.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No stops yet"
          description="Search for a city to add your first stop to this itinerary."
          action={<Button onClick={() => setAddStopOpen(true)}><PlusCircle className="w-4 h-4" aria-hidden /> Add your first stop</Button>}
        />
      ) : (
        <Reorder.Group axis="y" values={stops} onReorder={handleReorder} className="space-y-4">
          {stops.map((stop, i) => (
            <Reorder.Item key={stop.id} value={stop}>
              <StopCard
                stop={stop}
                index={i}
                draggable
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
    </PageContainer>
  );
}

function AddStopDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (city: City, start: string, end: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<City | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery(''); setSelected(null); setStartDate(''); setEndDate(''); setError(''); setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchCities(query).then((r) => { setResults(r); setSearching(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function handleConfirm() {
    if (!selected) { setError('Please select a city'); return; }
    if (!startDate || !endDate) { setError('Please select dates'); return; }
    if (new Date(endDate) < new Date(startDate)) { setError('End date must be after start date'); return; }
    onAdd(selected, startDate, endDate);
  }

  return (
    <Dialog open={open} onClose={onClose} className="max-w-lg" labelledBy="add-stop-title">
      <DialogHeader>
        <DialogTitle id="add-stop-title">Add a Stop</DialogTitle>
        <DialogDescription>Search for a city and select your dates.</DialogDescription>
      </DialogHeader>
      <DialogContent>
        {!selected ? (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cities…"
                className="pl-10"
                autoFocus
                aria-label="Search cities"
              />
            </div>
            {searching && <p className="font-sans text-sm text-ink/50 text-center py-4">Searching…</p>}
            <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-2">
              {results.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setSelected(city)}
                  className="w-full flex items-center gap-3 rounded-lg border border-parchment-300/60 p-2.5 hover:border-teal hover:bg-teal/5 transition-colors text-left focus-ring"
                >
                  <img src={city.imageUrl} alt={city.name} loading="lazy" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-semibold text-midnight">{city.name}</p>
                    <p className="font-sans text-xs text-ink/50">{city.country} · Cost index {city.costIndex}</p>
                  </div>
                </button>
              ))}
              {query && !searching && results.length === 0 && (
                <p className="font-sans text-sm text-ink/40 text-center py-4">No cities found for "{query}"</p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-teal/5 p-3">
              <img src={selected.imageUrl} alt={selected.name} className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-serif text-base font-semibold text-midnight">{selected.name}</p>
                <p className="font-sans text-sm text-ink/60">{selected.country}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-ink/40 hover:text-coral hover:bg-coral/5 focus-ring" aria-label="Change city">
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="stop-start">Arrival Date</Label>
                <Input id="stop-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="stop-end">Departure Date</Label>
                <Input id="stop-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
        )}
        {error && <p className="font-sans text-xs text-coral mt-3">{error}</p>}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        {selected && <Button onClick={handleConfirm}>Add to itinerary</Button>}
      </DialogFooter>
    </Dialog>
  );
}

function AddActivityDialog({ stop, onClose, onAdd }: { stop: Stop | null; onClose: () => void; onAdd: (a: Activity) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    if (!stop) return;
    setLoading(true);
    searchActivities(stop.cityId, query, { category: category as 'All' | undefined }).then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, [stop, query, category]);

  if (!stop) return null;
  const existingIds = new Set(stop.activities.map((a) => a.id));

  return (
    <Dialog open={!!stop} onClose={onClose} className="max-w-2xl" labelledBy="add-activity-title">
      <DialogHeader>
        <DialogTitle id="add-activity-title">Add Activity — {stop.city.name}</DialogTitle>
        <DialogDescription>Browse and add experiences to this stop.</DialogDescription>
      </DialogHeader>
      <DialogContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activities…" className="pl-10" aria-label="Search activities" />
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-44" aria-label="Filter by category">
            <option value="All">All Categories</option>
            <option value="Sightseeing">Sightseeing</option>
            <option value="Food & Drink">Food & Drink</option>
            <option value="Adventure">Adventure</option>
            <option value="Culture">Culture</option>
            <option value="Nature">Nature</option>
            <option value="Nightlife">Nightlife</option>
            <option value="Relaxation">Relaxation</option>
          </Select>
        </div>
        {loading ? (
          <div className="space-y-3">
            <LoadingSkeleton className="h-24 w-full" /><LoadingSkeleton className="h-24 w-full" />
          </div>
        ) : results.length === 0 ? (
          <p className="font-sans text-sm text-ink/40 text-center py-6">No activities found.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto scrollbar-thin space-y-3">
            {results.map((act, i) => (
              <ActivityCard
                key={act.id}
                activity={act}
                index={i}
                added={existingIds.has(act.id)}
                onAdd={() => onAdd(act)}
              />
            ))}
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Done</Button>
      </DialogFooter>
    </Dialog>
  );
}
