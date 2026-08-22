import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import type { Trip } from '@/types/trip';
import { getTrips, deleteTrip } from '@/services/tripService';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TripList } from '@/components/trips/TripList';
import { TripCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

type FilterStatus = 'all' | 'upcoming' | 'active' | 'completed' | 'draft';

export default function MyTrips() {
  const navigate = useNavigate();
  const toast = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);

  useEffect(() => {
    getTrips().then((t) => {
      setTrips(t);
      setLoading(false);
    });
  }, []);

  const filtered = trips.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.stops.some((s) => s.city.name.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteTrip(deleteTarget.id);
    setTrips((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    toast({ title: 'Trip deleted', description: `"${deleteTarget.name}" has been removed.`, variant: 'success' });
    setDeleteTarget(null);
  }

  return (
    <PageContainer>
      <PageHeader
        title="My Trips"
        subtitle="Your collection of planned and past journeys"
        action={
          <Button onClick={() => navigate('/trips/create')}>
            <PlusCircle className="w-4 h-4" aria-hidden /> Plan New Trip
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
            placeholder="Search by trip name or city…"
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
          <option value="all">All Trips</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">In Progress</option>
          <option value="completed">Completed</option>
          <option value="draft">Drafts</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <TripCardSkeleton /><TripCardSkeleton /><TripCardSkeleton /><TripCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <TripList trips={[]} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((trip, i) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
              className="boarding-pass overflow-hidden"
            >
              <div className="relative h-32 overflow-hidden">
                <img src={trip.coverPhotoUrl} alt={trip.name} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 to-transparent" />
                <div className="absolute bottom-2 left-4 right-4">
                  <h3 className="font-serif text-lg font-semibold text-parchment-50">{trip.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="font-sans text-sm text-ink/60 line-clamp-2 mb-3">{trip.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${trip.id}/view`)}>
                      <Eye className="w-4 h-4" aria-hidden /> View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${trip.id}`)}>
                      <Pencil className="w-4 h-4" aria-hidden /> Edit
                    </Button>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(trip)}
                    className="p-2 rounded-lg text-ink/30 hover:text-coral hover:bg-coral/5 transition-colors focus-ring"
                    aria-label={`Delete ${trip.name}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this trip?"
        description={`"${deleteTarget?.name}" and all its stops and activities will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete trip"
      />
    </PageContainer>
  );
}
