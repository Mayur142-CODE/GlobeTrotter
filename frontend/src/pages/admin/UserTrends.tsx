import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  Sparkles,
  PieChart,
  Layers,
  Calendar,
} from 'lucide-react';
import { getPlatformAnalytics, type PlatformAnalytics } from '@/services/adminService';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function UserTrends() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPlatformAnalytics();
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <LoadingSkeleton className="h-72 w-full" />
      </div>
    );
  }

  const maxMonthCount = Math.max(...analytics.monthlyTrends.map((d) => d.count), 1);
  const maxDestCount = Math.max(...analytics.topDestinations.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-midnight flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-teal" /> User Trends & Analytics
        </h1>
        <p className="font-sans text-xs sm:text-sm text-ink/60 mt-1">
          Platform-wide metrics, trip volume trends, and user engagement derived directly from PostgreSQL database records
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: 'Total Registered Travelers',
            value: String(analytics.totalUsers),
            subtext: 'Active platform accounts',
            color: 'text-teal',
          },
          {
            icon: TrendingUp,
            label: 'Total Trips Created',
            value: String(analytics.totalTrips),
            subtext: `${analytics.publicTrips} public, ${analytics.privateTrips} private`,
            color: 'text-midnight',
          },
          {
            icon: MapPin,
            label: 'Total Stops Planned',
            value: String(analytics.totalStopsPlanned),
            subtext: `Avg ${analytics.avgStopsPerTrip} stops / trip`,
            color: 'text-gold',
          },
          {
            icon: Sparkles,
            label: 'Activities Scheduled',
            value: String(analytics.totalActivitiesScheduled),
            subtext: `Avg ${analytics.avgActivitiesPerTrip} acts / trip`,
            color: 'text-coral',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="boarding-pass p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-midnight/5 flex items-center justify-center">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="ticket-mono text-[10px] text-ink/40">LIVE DB</span>
            </div>
            <div>
              <p className="ticket-mono text-2xl font-bold text-midnight">{stat.value}</p>
              <p className="font-sans text-xs font-semibold text-midnight mt-0.5">{stat.label}</p>
              <p className="font-sans text-[11px] text-ink/50 mt-0.5">{stat.subtext}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Creation Over Time (6 Months) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="boarding-pass p-5 flex flex-col justify-between"
        >
          <div className="mb-4">
            <h2 className="font-serif text-lg font-bold text-midnight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal" /> Trip Creation Trends (Past 6 Months)
            </h2>
            <p className="font-sans text-xs text-ink/50">Aggregated from trips.created_at timestamps in database</p>
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-6 pb-2 border-b border-parchment-300/60">
            {analytics.monthlyTrends.map((d) => {
              const heightPercent = maxMonthCount > 0 ? Math.max((d.count / maxMonthCount) * 100, 6) : 6;
              return (
                <div key={`${d.month}-${d.year}`} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="w-full max-w-[36px] bg-teal/15 hover:bg-teal transition-all rounded-t-md relative group flex items-end justify-center"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <span className="absolute -top-6 text-[10px] ticket-mono font-bold text-midnight opacity-0 group-hover:opacity-100 transition-opacity bg-parchment-200/90 px-1 rounded shadow-sm">
                      {d.count}
                    </span>
                  </div>
                  <span className="ticket-mono text-xs font-medium text-midnight mt-2">{d.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-ink/60">
            <span>Total 6-month volume: <strong>{analytics.totalTrips} trips</strong></span>
            <span className="ticket-mono text-[11px] text-teal font-semibold">PostgreSQL Timestamps</span>
          </div>
        </motion.div>

        {/* Top Destination Stops Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="boarding-pass p-5 flex flex-col justify-between"
        >
          <div className="mb-4">
            <h2 className="font-serif text-lg font-bold text-midnight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" /> Most Visited Destinations
            </h2>
            <p className="font-sans text-xs text-ink/50">Calculated from user trip stops</p>
          </div>

          {analytics.topDestinations.length === 0 ? (
            <p className="font-sans text-xs text-ink/50 italic py-10 text-center">
              No trip stop destination records found in Supabase.
            </p>
          ) : (
            <div className="space-y-3 py-2">
              {analytics.topDestinations.map((dest, i) => {
                const widthPercent = Math.max((dest.count / maxDestCount) * 100, 10);
                return (
                  <div key={dest.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-midnight flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-midnight/10 text-midnight text-[10px] flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        {dest.name}
                      </span>
                      <span className="ticket-mono font-semibold text-teal">{dest.count} stops</span>
                    </div>
                    <div className="h-2 w-full bg-parchment-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal to-teal-700 rounded-full"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-dashed border-parchment-300 text-xs text-ink/60 flex justify-between">
            <span>Available Cities in Catalog: <strong>{analytics.totalCitiesAvailable}</strong></span>
            <span className="ticket-mono text-teal font-semibold">Real-Time Aggregation</span>
          </div>
        </motion.div>
      </div>

      {/* Engagement & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Categories Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="boarding-pass p-5"
        >
          <h2 className="font-serif text-lg font-bold text-midnight mb-1 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-coral" /> Activity Category Demand
          </h2>
          <p className="font-sans text-xs text-ink/50 mb-4">Distribution of activity categories scheduled by users</p>

          {analytics.categoryBreakdown.length === 0 ? (
            <p className="font-sans text-xs text-ink/50 italic py-6 text-center">
              No activity bookings recorded in trips yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {analytics.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between p-2.5 rounded-lg bg-parchment-100/60 border border-parchment-300/40">
                  <span className="font-sans text-xs font-semibold text-midnight">{cat.category}</span>
                  <Badge variant="teal" className="ticket-mono text-xs">
                    {cat.count} {cat.count === 1 ? 'selection' : 'selections'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* User Engagement Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="boarding-pass p-5 flex flex-col justify-between"
        >
          <div>
            <h2 className="font-serif text-lg font-bold text-midnight mb-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-midnight" /> Platform Engagement Summary
            </h2>
            <p className="font-sans text-xs text-ink/50 mb-4">Relational itinerary depth and activity density</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-midnight">Average Stops Per Trip</p>
                  <p className="text-ink/60 text-[11px]">Multi-city routing depth</p>
                </div>
                <span className="ticket-mono text-lg font-bold text-teal">{analytics.avgStopsPerTrip} stops</span>
              </div>

              <div className="p-3 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-midnight">Average Activities Per Trip</p>
                  <p className="text-ink/60 text-[11px]">Experience booking density</p>
                </div>
                <span className="ticket-mono text-lg font-bold text-midnight">{analytics.avgActivitiesPerTrip} activities</span>
              </div>

              <div className="p-3 rounded-lg bg-parchment-100/80 border border-parchment-300 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-midnight">Public / Private Trip Ratio</p>
                  <p className="text-ink/60 text-[11px]">Shareable community itineraries</p>
                </div>
                <span className="ticket-mono text-sm font-semibold text-midnight">
                  {analytics.publicTrips} Public / {analytics.privateTrips} Private
                </span>
              </div>
            </div>
          </div>

          <p className="ticket-mono text-[10px] text-ink/40 text-center mt-4">
            GlobeTrotter Analytics Engine · Connected to Live PostgreSQL Database
          </p>
        </motion.div>
      </div>
    </div>
  );
}
