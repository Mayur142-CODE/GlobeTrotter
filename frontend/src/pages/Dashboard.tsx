import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, ArrowRight, Wallet, MapPin, Calendar, TrendingUp } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { User } from '@/types/user';
import { getTrips } from '@/services/tripService';
import { getCurrentUser } from '@/services/authService';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TripCard } from '@/components/trips/TripCard';
import { FlightPathLine } from '@/components/itinerary/FlightPathLine';
import { TripCardSkeleton } from '@/components/shared/LoadingSkeleton';
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
        {/* Simplified continent outlines */}
        <path d="M120 140 Q160 100 220 110 Q280 120 300 160 Q310 200 270 210 Q230 220 180 200 Q140 180 120 140 Z" />
        <path d="M300 180 Q340 160 380 180 Q420 200 410 240 Q390 280 340 270 Q300 260 300 220 Z" />
        <path d="M420 120 Q480 100 540 130 Q580 160 560 200 Q520 220 460 190 Q420 160 420 120 Z" />
        <path d="M560 140 Q620 130 680 160 Q700 190 660 210 Q620 220 580 190 Q560 170 560 140 Z" />
        <path d="M580 240 Q620 230 640 260 Q630 290 600 280 Z" />
        {/* Latitude lines */}
        <line x1="0" y1="100" x2="800" y2="100" strokeDasharray="4 8" />
        <line x1="0" y1="200" x2="800" y2="200" strokeDasharray="4 8" />
        <line x1="0" y1="300" x2="800" y2="300" strokeDasharray="4 8" />
        {/* Longitude lines */}
        <line x1="200" y1="0" x2="200" y2="400" strokeDasharray="4 8" />
        <line x1="400" y1="0" x2="400" y2="400" strokeDasharray="4 8" />
        <line x1="600" y1="0" x2="600" y2="400" strokeDasharray="4 8" />
      </g>
      {/* Flight routes */}
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
  const [trips, setTrips] = useState<Trip[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrips(), getCurrentUser()]).then(([t, u]) => {
      setTrips(t);
      setUser(u);
      setLoading(false);
    });
  }, []);

  const upcomingTrip = trips.find((t) => t.status === 'upcoming');
  const activeTrip = trips.find((t) => t.status === 'active');
  const featuredTrip = upcomingTrip ?? activeTrip ?? trips[0];
  const recentTrips = trips.slice(0, 3);
  const totalBudget = trips.reduce((sum, t) => sum + t.budget.total, 0);

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
            {user ? `Where to next, ${user.name.split(' ')[0]}?` : 'Where to next?'}
          </h1>
          <p className="font-sans text-parchment-100/70 mt-3 max-w-lg">
            Your travel journal is open. Plan multi-city journeys, build day-by-day itineraries, and track every rupee along the way.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button variant="primary" size="lg" onClick={() => navigate('/trips/create')}>
              <PlusCircle className="w-5 h-5" aria-hidden /> Plan New Trip
            </Button>
            <Button variant="outline" size="lg" className="border-parchment-50/20 text-parchment-50 hover:bg-parchment-50/10" onClick={() => navigate('/trips')}>
              View My Trips
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Featured upcoming trip */}
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
              View itinerary <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
          <div className="boarding-pass p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="ticket-mono text-xs text-ink/40">TRIP {featuredTrip.id.replace(/\D/g, '').slice(-3).padStart(3, '0')}</span>
                  <Badge variant={featuredTrip.status === 'upcoming' ? 'teal' : 'gold'}>
                    {featuredTrip.status === 'upcoming' ? 'Upcoming' : 'In Progress'}
                  </Badge>
                </div>
                <h3 className="font-serif text-2xl font-semibold text-midnight mb-2">{featuredTrip.name}</h3>
                <p className="font-sans text-sm text-ink/60 mb-4 max-w-md">{featuredTrip.description}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-teal" aria-hidden />
                    <span className="ticket-mono text-midnight">{formatDateShort(featuredTrip.startDate)} — {formatDateShort(featuredTrip.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="w-4 h-4 text-teal" aria-hidden />
                    <span className="ticket-mono text-midnight">{featuredTrip.stops.length} stops · {daysBetween(featuredTrip.startDate, featuredTrip.endDate)} days</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Wallet className="w-4 h-4 text-teal" aria-hidden />
                    <span className="ticket-mono text-midnight">{formatCurrency(featuredTrip.budget.total)}</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 flex items-center justify-center bg-midnight/5 rounded-xl p-4">
                <FlightPathLine
                  stops={featuredTrip.stops.map((s) => ({
                    id: s.id,
                    label: s.city.name,
                    sublabel: formatDateShort(s.startDate),
                  }))}
                  variant="light"
                />
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: MapPin, label: 'Total Trips', value: String(trips.length) },
          { icon: MapPin, label: 'Cities Visited', value: String(new Set(trips.flatMap((t) => t.stops.map((s) => s.cityId))).size) },
          { icon: Wallet, label: 'Total Budget', value: formatCurrency(totalBudget) },
          { icon: TrendingUp, label: 'Avg Trip Cost', value: trips.length ? formatCurrency(Math.round(totalBudget / trips.length)) : '—' },
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

      {/* Recent trips */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-midnight">Recent Trips</h2>
          <button onClick={() => navigate('/trips')} className="flex items-center gap-1 font-sans text-sm font-semibold text-teal hover:gap-2 transition-all focus-ring rounded">
            View all <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TripCardSkeleton /><TripCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentTrips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Recommended destinations */}
      <section>
        <h2 className="font-serif text-xl font-semibold text-midnight mb-4">Recommended Destinations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Kyoto', country: 'Japan', img: 'https://images.pexels.com/photos/161251/kyoto-japan-temple-zen-161251.jpeg?auto=compress&cs=tinysrgb&w=400' },
            { name: 'Bali', country: 'Indonesia', img: 'https://images.pexels.com/photos/1802255/pexels-photo-1802255.jpeg?auto=compress&cs=tinysrgb&w=400' },
            { name: 'Prague', country: 'Czechia', img: 'https://images.pexels.com/photos/2225442/pexels-photo-2225442.jpeg?auto=compress&cs=tinysrgb&w=400' },
            { name: 'Dubai', country: 'UAE', img: 'https://images.pexels.com/photos/3787839/pexels-photo-3787839.jpeg?auto=compress&cs=tinysrgb&w=400' },
          ].map((dest, i) => (
            <motion.button
              key={dest.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate('/search/cities')}
              className="group relative rounded-xl overflow-hidden shadow-paper text-left focus-ring"
            >
              <img src={dest.img} alt={dest.name} loading="lazy" className="w-full h-32 object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="font-serif text-base font-semibold text-parchment-50">{dest.name}</p>
                <p className="ticket-mono text-xs text-parchment-100/70">{dest.country}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
