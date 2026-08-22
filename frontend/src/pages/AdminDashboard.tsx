import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Map, Star, BarChart3 } from 'lucide-react';
import { getTrips } from '@/services/tripService';
import { searchCities } from '@/services/citySearchService';
import { searchActivities } from '@/services/activitySearchService';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalCities, setTotalCities] = useState(0);
  const [totalActivities, setTotalActivities] = useState(0);
  const [topDestinations, setTopDestinations] = useState<{ name: string; count: number }[]>([]);
  const [popularActivities, setPopularActivities] = useState<{ name: string; popularity: number }[]>([]);

  useEffect(() => {
    Promise.all([
      getTrips(),
      searchCities(''),
      searchActivities('', ''),
    ]).then(([trips, cities, activities]) => {
      setTotalTrips(trips.length);
      setTotalCities(cities.length);
      setTotalActivities(activities.length);

      const cityCount: Record<string, number> = {};
      trips.forEach((t) =>
        t.stops.forEach((s) => {
          cityCount[s.city.name] = (cityCount[s.city.name] ?? 0) + 1;
        })
      );
      const sorted = Object.entries(cityCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopDestinations(sorted);

      const popular = [...activities]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5)
        .map((a) => ({ name: a.name, popularity: a.popularity }));
      setPopularActivities(popular);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <LoadingSkeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  const tripCreationData = [
    { month: 'Mar', count: 12 },
    { month: 'Apr', count: 18 },
    { month: 'May', count: 25 },
    { month: 'Jun', count: 32 },
    { month: 'Jul', count: 28 },
    { month: 'Aug', count: 41 },
  ];
  const maxCount = Math.max(...tripCreationData.map((d) => d.count));

  return (
    <PageContainer>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and statistics" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: 'Active Sessions', value: '1', color: 'text-teal' },
          { icon: Map, label: 'Total Trips', value: String(totalTrips), color: 'text-midnight' },
          { icon: Map, label: 'Cities Available', value: String(totalCities), color: 'text-gold' },
          { icon: Star, label: 'Activities Listed', value: String(totalActivities), color: 'text-coral' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="rounded-xl bg-parchment-50 border border-parchment-300/60 shadow-paper p-4"
          >
            <div className="w-9 h-9 rounded-lg bg-midnight/5 flex items-center justify-center mb-2">
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} aria-hidden />
            </div>
            <p className="ticket-mono text-xl font-semibold text-midnight">{stat.value}</p>
            <p className="font-sans text-xs text-ink/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Trip creation chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="boarding-pass p-5"
        >
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal" aria-hidden /> Trip Creation (6 months)
          </h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {tripCreationData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className="w-full bg-teal/20 hover:bg-teal transition-all rounded-t-md relative group"
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] ticket-mono font-semibold text-midnight opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </span>
                </div>
                <span className="ticket-mono text-[10px] text-ink/40 mt-2">{d.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Destinations */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="boarding-pass p-5"
        >
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Top Destinations Planned</h2>
          {topDestinations.length === 0 ? (
            <p className="font-sans text-sm text-ink/50">No destination data available yet.</p>
          ) : (
            <div className="space-y-3">
              {topDestinations.map((dest, i) => (
                <div key={dest.name} className="flex items-center justify-between">
                  <span className="font-sans text-sm text-midnight flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-midnight/5 text-midnight text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    {dest.name}
                  </span>
                  <span className="ticket-mono text-xs text-ink/60">{dest.count} trips</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PageContainer>
  );
}
