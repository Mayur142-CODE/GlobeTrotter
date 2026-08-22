import { useNavigate } from 'react-router-dom';
import type { Trip } from '@/types/trip';
import { TripCard } from './TripCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';

export function TripList({ trips }: { trips: Trip[] }) {
  const navigate = useNavigate();
  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Map}
        title="No trips yet"
        description="Your travel journal is waiting. Start planning your first multi-city adventure."
        action={
          <Button onClick={() => navigate('/trips/create')}>
            Plan your first trip
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {trips.map((trip, i) => (
        <TripCard key={trip.id} trip={trip} index={i} />
      ))}
    </div>
  );
}
