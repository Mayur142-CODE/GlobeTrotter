import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Wallet, Share2, Clock } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import { getTrip } from '@/services/tripService';
import { getStops } from '@/services/itineraryService';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FlightPathLine } from '@/components/itinerary/FlightPathLine';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateShort, formatDate, daysBetween } from '@/lib/utils';

export default function ItineraryView() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    Promise.all([getTrip(tripId), getStops(tripId)]).then(([t, s]) => {
      setTrip(t ?? null);
      setStops(s);
      setLoading(false);
    });
  }, [tripId]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <LoadingSkeleton className="h-40 w-full mb-6" />
        <div className="space-y-4"><LoadingSkeleton className="h-24 w-full" /><LoadingSkeleton className="h-24 w-full" /></div>
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
  const totalActivityCost = stops.reduce((sum, s) => sum + s.activities.reduce((a, act) => a + act.price, 0), 0);
  const totalCost = trip.budget.total + totalActivityCost;

  // Build day-by-day timeline
  const dayEntries: { date: string; stop: Stop | undefined }[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(trip.startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    const stop = stops.find((s) => dateStr >= s.startDate && dateStr <= s.endDate);
    dayEntries.push({ date: dateStr, stop });
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/trips')} className="flex items-center gap-1.5 font-sans text-sm text-ink/60 hover:text-teal focus-ring rounded">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Back to trips
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${trip.id}`)}>
            Edit itinerary
          </Button>
          <Button variant="outline" size="sm" onClick={() => { toast({ title: 'Share link copied', description: 'The share link is in your clipboard.', variant: 'success' }); navigator.clipboard?.writeText(window.location.origin + `/shared/${trip.id}`); }}>
            <Share2 className="w-4 h-4" aria-hidden /> Share
          </Button>
        </div>
      </div>

      {/* Trip header */}
      <div className="boarding-pass overflow-hidden mb-6">
        <div className="relative h-36">
          <img src={trip.coverPhotoUrl} alt={trip.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
          <div className="absolute bottom-3 left-5 right-5">
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-parchment-50">{trip.name}</h1>
            <p className="font-sans text-sm text-parchment-100/80 mt-1">{trip.description}</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Dates</p>
            <p className="ticket-mono text-sm text-midnight font-medium">{formatDateShort(trip.startDate)} — {formatDateShort(trip.endDate)}</p>
          </div>
          <div>
            <p className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Stops</p>
            <p className="ticket-mono text-sm text-midnight font-medium">{stops.length}</p>
          </div>
          <div>
            <p className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Days</p>
            <p className="ticket-mono text-sm text-midnight font-medium">{days}</p>
          </div>
          <div>
            <p className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Total Cost</p>
            <p className="ticket-mono text-sm text-midnight font-medium">{formatCurrency(totalCost)}</p>
          </div>
        </div>
      </div>

      {/* Flight path */}
      {stops.length > 0 && (
        <div className="boarding-pass p-6 mb-6">
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4 text-center">Route</h2>
          <FlightPathLine stops={stops.map((s) => ({ id: s.id, label: s.city.name, sublabel: formatDateShort(s.startDate) }))} variant="light" />
        </div>
      )}

      {/* View mode toggle: timeline / calendar / cities */}
      <Tabs defaultValue="timeline">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <TabsList>
            <TabsTrigger value="timeline">Day by Day</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="cities">By City</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={() => navigate(`/trip/${trip.id}/calendar`)}>
            <Calendar className="w-4 h-4" aria-hidden /> Full calendar
          </Button>
        </div>

        <TabsContent value="timeline">
          <div className="space-y-3">
            {dayEntries.map((entry, i) => (
              <motion.div
                key={entry.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                className="boarding-pass p-4 flex items-start gap-4"
              >
                <div className="shrink-0 text-center w-16">
                  <p className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Day</p>
                  <p className="font-serif text-2xl font-semibold text-midnight">{String(i + 1).padStart(2, '0')}</p>
                  <p className="ticket-mono text-xs text-ink/50">{formatDateShort(entry.date)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  {entry.stop ? (
                    <>
                      <p className="font-serif text-base font-semibold text-midnight flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-teal" aria-hidden /> {entry.stop.city.name}
                      </p>
                      {entry.stop.activities.length > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {entry.stop.activities.map((act) => (
                            <li key={act.id} className="flex items-center justify-between gap-2 text-sm">
                              <span className="font-sans text-ink/70">{act.name}</span>
                              <span className="ticket-mono text-xs text-ink/50 flex items-center gap-2">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden />{act.durationHours}h</span>
                                {formatCurrency(act.price)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-sans text-sm text-ink/40 italic mt-1">Free day — no activities planned.</p>
                      )}
                    </>
                  ) : (
                    <p className="font-sans text-sm text-ink/40 italic">Travel day — no city scheduled.</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {dayEntries.map((entry, i) => (
              <motion.div
                key={entry.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className={`boarding-pass p-3 ${!entry.stop ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="ticket-mono text-xs text-ink/40">DAY {String(i + 1).padStart(2, '0')}</span>
                  <span className="ticket-mono text-xs text-ink/50">{formatDateShort(entry.date)}</span>
                </div>
                {entry.stop ? (
                  <>
                    <p className="font-serif text-sm font-semibold text-midnight flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-teal" aria-hidden /> {entry.stop.city.name}
                    </p>
                    {entry.stop.activities.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {entry.stop.activities.map((act) => (
                          <li key={act.id} className="text-xs font-sans text-ink/60 flex items-center justify-between gap-1">
                            <span className="truncate">{act.name}</span>
                            <span className="ticket-mono text-ink/50 shrink-0">{formatCurrency(act.price)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-sans text-xs text-ink/40 italic mt-1">Free day</p>
                    )}
                  </>
                ) : (
                  <p className="font-sans text-xs text-ink/40 italic mt-1">Travel day</p>
                )}
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cities">
          <div className="space-y-4">
            {stops.map((stop, i) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
                className="boarding-pass p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-semibold text-midnight flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal" aria-hidden /> {stop.city.name}, {stop.city.country}
                  </h3>
                  <Badge variant="gold">{formatDateShort(stop.startDate)} — {formatDateShort(stop.endDate)}</Badge>
                </div>
                {stop.activities.length > 0 ? (
                  <ul className="space-y-2">
                    {stop.activities.map((act) => (
                      <li key={act.id} className="flex items-center justify-between gap-2 rounded-lg bg-parchment-100/60 px-3 py-2">
                        <span className="font-sans text-sm text-ink/70">{act.name}</span>
                        <span className="ticket-mono text-xs text-ink/50">{formatCurrency(act.price)} · {act.durationHours}h</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-sans text-sm text-ink/40 italic">No activities planned.</p>
                )}
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
