import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowRight, Wallet, MapPin, Calendar, TrendingUp, Compass, Star, Sparkles } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { City } from '@/types/city';
import { getTrips } from '@/services/tripService';
import { searchCities } from '@/services/citySearchService';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TripCard } from '@/components/trips/TripCard';
import { FlightPathLine } from '@/components/itinerary/FlightPathLine';
import { TripCardSkeleton, CityCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { formatCurrency, formatDateShort, daysBetween } from '@/lib/utils';

function WorldMapBackdrop() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
      viewBox="0 0 800 400"
      fill="none"
      aria-hidden
    >
      <g stroke="#16233A" strokeWidth="0.8" fill="none">
        <path d="M120 140 Q160 100 220 110 Q280 120 300 160 Q310 200 270 210 Q230 220 180 200 Q140 180 120 140 Z" />
        <path d="M300 180 Q340 160 380 180 Q420 200 410 240 Q390 280 340 270 Q300 260 300 220 Z" />
        <path d="M420 120 Q480 100 540 130 Q580 160 560 200 Q520 220 460 190 Q420 160 420 120 Z" />
        <path d="M560 140 Q620 130 680 160 Q700 190 660 210 Q620 220 580 190 Q560 170 560 140 Z" />
        <path d="M580 240 Q620 230 640 260 Q630 290 600 280 Z" />
        <line x1="0" y1="100" x2="800" y2="100" strokeDasharray="4 8" />
        <line x1="0" y1="200" x2="800" y2="200" strokeDasharray="4 8" />
        <line x1="0" y1="300" x2="800" y2="300" strokeDasharray="4 8" />
        <line x1="200" y1="0" x2="200" y2="400" strokeDasharray="4 8" />
        <line x1="400" y1="0" x2="400" y2="400" strokeDasharray="4 8" />
        <line x1="600" y1="0" x2="600" y2="400" strokeDasharray="4 8" />
      </g>
      <g stroke="#1F8A83" strokeWidth="1.2" strokeDasharray="3 4" fill="none" opacity="0.5">
        <path d="M180 160 Q300 80 420 140" />
        <path d="M420 140 Q500 200 580 160" />
      </g>
      <g fill="#D8A93E">
        <circle cx="180" cy="160" r="3" />
        <circle cx="420" cy="140" r="3" />
        <circle cx="580" cy="160" r="3" />
      </g>
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [popularCities, setPopularCities] = useState<City[]>([]);
  const [recommendedCities, setRecommendedCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTrips(),
      searchCities('', { sortBy: 'popularity' }),
    ]).then(([t, allCities]) => {
      setTrips(t);
      setPopularCities(allCities.slice(0, 4));
      // Curate recommendations based on high rating / cost balance
      setRecommendedCities(allCities.slice(4, 8));
      setLoading(false);
    });
  }, []);

  const upcomingTrip = trips.find((t) => t.status === 'upcoming');
  const activeTrip = trips.find((t) => t.status === 'active');
  const featuredTrip = upcomingTrip ?? activeTrip ?? trips[0];
  const recentTrips = trips.slice(0, 3);
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget?.total || 0), 0);
  const citiesVisitedCount = new Set(trips.flatMap((t) => (t.stops || []).map((s) => s.cityId))).size;

  const travelerName = user?.firstName || user?.name?.split(' ')[0] || 'Traveler';

  return (
    <PageContainer>
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-midnight text-parchment-50 p-6 sm:p-10 mb-8 shadow-paper-lg"
      >
        <WorldMapBackdrop />
        <div className="relative z-10 max-w-2xl">
          <p className="ticket-mono text-xs uppercase tracking-widest text-gold mb-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold leading-tight text-balance">
            Where to next, {travelerName}?
          </h1>
          <p className="font-sans text-parchment-100/70 mt-3 max-w-lg">
            Your travel journal is ready. Plan multi-city journeys, organize day-by-day itineraries, and track every rupee along the way.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button variant="primary" size="lg" onClick={() => navigate('/trips/create')}>
              <PlusCircle className="w-5 h-5 mr-1" aria-hidden /> Plan New Trip
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-parchment-50/20 text-parchment-50 hover:bg-parchment-50/10"
              onClick={() => navigate('/trips')}
            >
              View My Trips
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Featured upcoming / active trip */}
      {featuredTrip && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-semibold text-midnight">Next Departure</h2>
            <button
              onClick={() => navigate(`/itinerary/${featuredTrip.id}`)}
              className="flex items-center gap-1 font-sans text-sm font-semibold text-teal hover:gap-2 transition-all focus-ring rounded"
            >
              Open Itinerary Builder <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
          <div className="boarding-pass p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="ticket-mono text-xs text-ink/40">
                    TRIP #{featuredTrip.id.replace(/\D/g, '').slice(-4).padStart(4, '0')}
                  </span>
                  <Badge variant={featuredTrip.status === 'upcoming' ? 'teal' : 'gold'}>
                    {featuredTrip.status === 'upcoming' ? 'Upcoming' : featuredTrip.status === 'active' ? 'In Progress' : 'Completed'}
                  </Badge>
                </div>
                <h3 className="font-serif text-2xl font-semibold text-midnight mb-2">{featuredTrip.name}</h3>
                <p className="font-sans text-sm text-ink/60 mb-4 max-w-md">{featuredTrip.description}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-teal" aria-hidden />
                    <span className="ticket-mono text-midnight">
                      {formatDateShort(featuredTrip.startDate)} — {formatDateShort(featuredTrip.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 text-teal" aria-hidden />
                    <span className="ticket-mono text-midnight">
                      {featuredTrip.stops.length} stops · {daysBetween(featuredTrip.startDate, featuredTrip.endDate)} days
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Wallet className="w-4 h-4 text-teal" aria-hidden />
                    <span className="ticket-mono text-midnight">{formatCurrency(featuredTrip.budget.total)}</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 flex items-center justify-center bg-midnight/5 rounded-xl p-4">
                {featuredTrip.stops.length > 0 ? (
                  <FlightPathLine
                    stops={featuredTrip.stops.map((s) => ({
                      id: s.id,
                      label: s.city.name,
                      sublabel: formatDateShort(s.startDate),
                    }))}
                    variant="light"
                  />
                ) : (
                  <div className="text-center py-6">
                    <p className="font-sans text-sm text-ink/50 mb-2">No stops added to this trip yet.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/itinerary/${featuredTrip.id}`)}>
                      <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Stops
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Real Stats & Budget Highlights */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: MapPin, label: 'Total Trips Planned', value: String(trips.length) },
          { icon: Compass, label: 'Cities in Itineraries', value: String(citiesVisitedCount) },
          { icon: Wallet, label: 'Total Planned Budget', value: formatCurrency(totalBudget) },
          { icon: TrendingUp, label: 'Avg Trip Budget', value: trips.length ? formatCurrency(Math.round(totalBudget / trips.length)) : '₹0' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
            className="rounded-xl bg-parchment-50 border border-parchment-300/60 shadow-paper p-4"
          >
            <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center mb-2">
              <stat.icon className="w-4.5 h-4.5 text-teal" aria-hidden />
            </div>
            <p className="ticket-mono text-xl font-semibold text-midnight">{stat.value}</p>
            <p className="font-sans text-xs text-ink/50">{stat.label}</p>
          </motion.div>
        ))}
      </section>

      {/* Recent trips or Empty State */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-midnight">Recent Journeys</h2>
          {trips.length > 0 && (
            <button
              onClick={() => navigate('/trips')}
              className="flex items-center gap-1 font-sans text-sm font-semibold text-teal hover:gap-2 transition-all focus-ring rounded"
            >
              View all ({trips.length}) <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TripCardSkeleton />
            <TripCardSkeleton />
          </div>
        ) : trips.length === 0 ? (
          <div className="boarding-pass p-8 text-center bg-parchment-50/60 border-dashed">
            <div className="w-12 h-12 rounded-full bg-teal/10 text-teal flex items-center justify-center mx-auto mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-midnight mb-1">You haven't planned a trip yet</h3>
            <p className="font-sans text-sm text-ink/60 max-w-md mx-auto mb-4">
              Start building your multi-city itinerary, search destinations, organize day-by-day schedules, and track your travel budget.
            </p>
            <Button variant="primary" onClick={() => navigate('/trips/create')}>
              <PlusCircle className="w-4 h-4 mr-1.5" /> Plan Your First Journey
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentTrips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Cities & Recommended Destinations (Live Supabase Data) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-midnight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" /> Popular Destinations
            </h2>
            <p className="font-sans text-xs text-ink/50">Top-rated cities from our live global catalog</p>
          </div>
          <button
            onClick={() => navigate('/search/cities')}
            className="flex items-center gap-1 font-sans text-sm font-semibold text-teal hover:gap-2 transition-all focus-ring rounded"
          >
            Explore all <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CityCardSkeleton />
            <CityCardSkeleton />
            <CityCardSkeleton />
            <CityCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularCities.map((city, i) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => navigate('/search/cities')}
                className="boarding-pass overflow-hidden group cursor-pointer hover:shadow-paper-lg transition-all"
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={city.imageUrl}
                    alt={city.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
                  <div className="absolute top-2 right-2">
                    <Badge variant="teal" className="text-[10px]">
                      {city.region}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-3 right-3">
                    <h4 className="font-serif text-base font-semibold text-parchment-50">{city.name}</h4>
                    <p className="ticket-mono text-[10px] text-parchment-100/70">{city.country}</p>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between text-xs border-t border-dashed border-parchment-300">
                  <span className="font-sans text-ink/60">Cost Index: {city.costIndex}/100</span>
                  <span className="flex items-center gap-1 font-semibold text-gold">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" /> {city.popularity}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
