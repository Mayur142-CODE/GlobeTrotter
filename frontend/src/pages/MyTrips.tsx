import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Search, Eye, Pencil, Trash2, Calendar, MapPin, Wallet, Compass } from 'lucide-react';
import type { Trip } from '@/types/trip';
import { getTrips, deleteTrip } from '@/services/tripService';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TripCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateShort, daysBetween } from '@/lib/utils';

type FilterStatus = 'all' | 'upcoming' | 'active' | 'completed' | 'draft';

export default function MyTrips() {
  const navigate = useNavigate();
  const toast = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const t = await getTrips();
      setTrips(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const filtered = trips.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.stops.some((s) => s.city.name.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTrip(deleteTarget.id);
      setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast({ title: 'Trip deleted', description: `"${deleteTarget.name}" has been removed.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Could not delete trip.', variant: 'error' });
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Trips"
        subtitle="Your collection of planned and past journeys"
        action={
          <Button onClick={() => navigate('/trips/create')}>
            <PlusCircle className="w-4 h-4 mr-1.5" aria-hidden /> Plan New Trip
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by trip name or destination city…"
            className="pl-10"
            aria-label="Search trips"
          />
        </div>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterStatus)}
          className="sm:w-48"
          aria-label="Filter trips by status"
        >
          <option value="all">All Trips ({trips.length})</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">In Progress</option>
          <option value="completed">Completed</option>
          <option value="draft">Drafts</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <TripCardSkeleton />
          <TripCardSkeleton />
          <TripCardSkeleton />
        </div>
      ) : trips.length === 0 ? (
        <div className="boarding-pass p-10 text-center bg-parchment-50 border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto mb-4">
            <Compass className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-midnight mb-2">No trips created yet</h2>
          <p className="font-sans text-sm text-ink/60 max-w-md mx-auto mb-6">
            Begin planning your dream multi-city itinerary. Add cities, explore activities, schedule stops, and track your budget.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/trips/create')}>
            <PlusCircle className="w-5 h-5 mr-1.5" /> Plan Your First Trip
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="boarding-pass p-8 text-center bg-parchment-50">
          <p className="font-sans text-sm text-ink/60 mb-4">No trips match your search filters.</p>
          <Button variant="outline" onClick={() => { setSearch(''); setFilter('all'); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((trip, i) => {
            const days = Math.max(1, daysBetween(trip.startDate, trip.endDate));
            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
                className="boarding-pass overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={trip.coverPhotoUrl}
                      alt={trip.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/40 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={
                          trip.status === 'upcoming' ? 'teal' : trip.status === 'active' ? 'gold' : 'secondary'
                        }
                      >
                        {trip.status === 'upcoming' ? 'Upcoming' : trip.status === 'active' ? 'In Progress' : 'Completed'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2.5 left-4 right-4">
                      <h3 className="font-serif text-lg font-semibold text-parchment-50 leading-tight line-clamp-1">
                        {trip.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="font-sans text-xs text-ink/60 line-clamp-2">{trip.description || 'No description provided.'}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-dashed border-parchment-300 pt-2.5">
                      <div className="flex items-center gap-1.5 text-ink/70">
                        <Calendar className="w-3.5 h-3.5 text-teal" />
                        <span className="ticket-mono">{formatDateShort(trip.startDate)} — {formatDateShort(trip.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-ink/70">
                        <MapPin className="w-3.5 h-3.5 text-teal" />
                        <span>{trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'} ({days}d)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-ink/70 col-span-2">
                        <Wallet className="w-3.5 h-3.5 text-teal" />
                        <span className="ticket-mono font-semibold text-midnight">Est. Cost: {formatCurrency(trip.budget.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-dashed border-parchment-300 mt-2 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${trip.id}/view`)}>
                      <Eye className="w-3.5 h-3.5 mr-1" aria-hidden /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${trip.id}`)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" aria-hidden /> Edit
                    </Button>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(trip)}
                    className="p-2 rounded-lg text-ink/40 hover:text-coral hover:bg-coral/10 transition-colors focus-ring"
                    aria-label={`Delete ${trip.name}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this trip?"
        description={`"${deleteTarget?.name}" and all its associated stops, scheduled activities, and expenses will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete trip"
      />
    </PageContainer>
  );
}
