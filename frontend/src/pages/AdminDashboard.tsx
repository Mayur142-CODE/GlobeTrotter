import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Map, TrendingUp, Star, BarChart3 } from 'lucide-react';
import { getTrips } from '@/services/tripService';
import { mockCities } from '@/data/mockCities';
import { mockActivities } from '@/data/mockActivities';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalUsers] = useState(1248);
  const [topDestinations, setTopDestinations] = useState<{ name: string; count: number }[]>([]);
  const [popularActivities, setPopularActivities] = useState<{ name: string; popularity: number }[]>([]);

  useEffect(() => {
    getTrips().then((trips) => {
      setTotalTrips(trips.length);
      const cityCount: Record<string, number> = {};
      trips.forEach((t) => t.stops.forEach((s) => { cityCount[s.city.name] = (cityCount[s.city.name] ?? 0) + 1; }));
      const sorted = Object.entries(cityCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopDestinations(sorted);
      const popular = [...mockActivities].sort((a, b) => b.popularity - a.popularity).slice(0, 5).map((a) => ({ name: a.name, popularity: a.popularity }));
      setPopularActivities(popular);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <LoadingSkeleton key={i} className="h-24 w-full" />)}
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
          { icon: Users, label: 'Total Users', value: totalUsers.toLocaleString(), color: 'text-teal' },
          { icon: Map, label: 'Total Trips', value: String(totalTrips), color: 'text-midnight' },
          { icon: Map, label: 'Cities Available', value: String(mockCities.length), color: 'text-gold' },
          { icon: Star, label: 'Activities Listed', value: String(mockActivities.length), color: 'text-coral' },
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
            {tripCreationData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center justify-end">
                <span className="ticket-mono text-xs text-ink/50 mb-1">{d.count}</span>
                <motion.div
                  className="w-full rounded-t bg-teal"
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                />
                <span className="ticket-mono text-xs text-ink/50 mt-1">{d.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top destinations */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="boarding-pass p-5"
        >
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal" aria-hidden /> Top Destinations
          </h2>
          <ul className="space-y-3">
            {topDestinations.map((dest, i) => (
              <li key={dest.name} className="flex items-center justify-between">
                <span className="font-sans text-sm text-midnight">
                  <span className="ticket-mono text-xs text-ink/40 mr-2">{String(i + 1).padStart(2, '0')}</span>
                  {dest.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-midnight/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${(dest.count / topDestinations[0].count) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
                    />
                  </div>
                  <span className="ticket-mono text-xs text-ink/50 w-6 text-right">{dest.count}</span>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Popular activities */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="boarding-pass p-5 mb-5"
      >
        <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Popular Activities</h2>
        <ul className="space-y-2">
          {popularActivities.map((act, i) => (
            <li key={act.name} className="flex items-center justify-between rounded-lg bg-parchment-100/60 px-3 py-2">
              <span className="font-sans text-sm text-midnight">
                <span className="ticket-mono text-xs text-ink/40 mr-2">{String(i + 1).padStart(2, '0')}</span>
                {act.name}
              </span>
              <Badge variant="gold">{act.popularity}% popular</Badge>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="boarding-pass overflow-hidden"
      >
        <div className="p-5 border-b border-parchment-300/50">
          <h2 className="font-serif text-lg font-semibold text-midnight">Recent Users</h2>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead className="bg-midnight/5">
              <tr>
                <th className="text-left font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Trips</th>
                <th className="text-left font-sans text-xs font-semibold text-ink/60 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Aarav Mehta', email: 'aarav@example.com', trips: 4, joined: 'Mar 2024' },
                { name: 'Sofia Rossi', email: 'sofia@example.com', trips: 7, joined: 'Jan 2024' },
                { name: 'Yuki Tanaka', email: 'yuki@example.com', trips: 3, joined: 'Jun 2024' },
                { name: 'Emma Wilson', email: 'emma@example.com', trips: 12, joined: 'Aug 2023' },
                { name: 'Liam O\'Brien', email: 'liam@example.com', trips: 2, joined: 'Feb 2025' },
              ].map((u, i) => (
                <tr key={i} className="border-t border-parchment-300/40 hover:bg-parchment-100/40 transition-colors">
                  <td className="px-4 py-3 font-sans text-sm font-medium text-midnight">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{u.email}</td>
                  <td className="px-4 py-3 ticket-mono text-sm text-midnight hidden sm:table-cell">{u.trips}</td>
                  <td className="px-4 py-3 ticket-mono text-xs text-ink/50 hidden sm:table-cell">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PageContainer>
  );
}
