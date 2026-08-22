import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  MapPin,
  Sparkles,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Plane,
  Calendar,
} from 'lucide-react';
import { getPlatformAnalytics, type PlatformAnalytics } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformAnalytics().then((res) => {
      setAnalytics(res);
      setLoading(false);
    });
  }, []);

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  const maxMonthCount = Math.max(...analytics.monthlyTrends.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="boarding-pass p-6 bg-gradient-to-r from-midnight via-midnight-800 to-midnight text-parchment-50 relative overflow-hidden"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal/20 border border-teal/40 text-teal text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Hackathon Admin Console
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            GlobeTrotter Platform Management
          </h1>
          <p className="font-sans text-xs sm:text-sm text-parchment-200/80 mt-1">
            Real-time platform oversight, traveler accounts, destination popularity, and itinerary analytics powered by Supabase.
          </p>
        </div>

        {/* Subtle Background Globe decoration */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <Plane className="w-48 h-48 text-parchment-50" />
        </div>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: 'Total Registered Users',
            value: String(analytics.totalUsers),
            to: '/admin/users',
            color: 'text-teal',
          },
          {
            icon: TrendingUp,
            label: 'Trips Created',
            value: String(analytics.totalTrips),
            to: '/admin/analytics',
            color: 'text-midnight',
          },
          {
            icon: MapPin,
            label: 'Popular Cities Planned',
            value: String(analytics.totalStopsPlanned),
            to: '/admin/cities',
            color: 'text-gold',
          },
          {
            icon: Sparkles,
            label: 'Activities Booked',
            value: String(analytics.totalActivitiesScheduled),
            to: '/admin/activities',
            color: 'text-coral',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            onClick={() => navigate(stat.to)}
            className="boarding-pass p-4 hover:border-teal/50 hover:shadow-paper-lg transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-midnight/5 flex items-center justify-center">
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-ink/30 group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <p className="ticket-mono text-2xl font-bold text-midnight">{stat.value}</p>
              <p className="font-sans text-xs font-semibold text-midnight mt-0.5">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Four Main Section Navigation Cards */}
      <div>
        <h2 className="font-serif text-lg font-bold text-midnight mb-3">Admin Management Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: '1. Manage Users',
              desc: 'Inspect registered travelers, profile details, and user-created travel itineraries in Supabase.',
              icon: Users,
              to: '/admin/users',
              badge: `${analytics.totalUsers} Users`,
              color: 'text-teal',
            },
            {
              title: '2. Popular Cities',
              desc: 'View cities ranked dynamically by real traveler trip stops and multi-city route plans.',
              icon: MapPin,
              to: '/admin/cities',
              badge: `${analytics.totalStopsPlanned} Stops`,
              color: 'text-gold',
            },
            {
              title: '3. Popular Activities',
              desc: 'Review catalog experiences ranked by actual traveler itinerary schedule selections.',
              icon: Sparkles,
              to: '/admin/activities',
              badge: `${analytics.totalActivitiesScheduled} Bookings`,
              color: 'text-coral',
            },
            {
              title: '4. User Trends & Analytics',
              desc: 'Platform-level analytics, 6-month trip creation volume trends, and user engagement metrics.',
              icon: BarChart3,
              to: '/admin/analytics',
              badge: 'Real-Time Data',
              color: 'text-midnight',
            },
          ].map((sec, i) => (
            <motion.div
              key={sec.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(sec.to)}
              className="boarding-pass p-5 hover:border-teal/60 hover:shadow-paper-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-midnight/5 flex items-center justify-center">
                    <sec.icon className={`w-5 h-5 ${sec.color}`} />
                  </div>
                  <Badge variant="teal" className="ticket-mono text-[10px]">
                    {sec.badge}
                  </Badge>
                </div>
                <h3 className="font-serif text-base font-bold text-midnight group-hover:text-teal transition-colors">
                  {sec.title}
                </h3>
                <p className="font-sans text-xs text-ink/60 mt-1 leading-relaxed">{sec.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-dashed border-parchment-300 flex items-center justify-between text-xs text-teal font-semibold">
                <span>Access Module</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mini Trend Preview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="boarding-pass p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-base font-bold text-midnight flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-teal" /> Trip Volume Trends (Last 6 Months)
            </h3>
            <p className="font-sans text-xs text-ink/50">Derived from real trips in PostgreSQL database</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')}>
            Full Analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        <div className="flex items-end justify-between gap-3 h-36 pt-4 pb-2 border-b border-parchment-300/60">
          {analytics.monthlyTrends.map((d) => {
            const heightPercent = maxMonthCount > 0 ? Math.max((d.count / maxMonthCount) * 100, 8) : 8;
            return (
              <div key={`${d.month}-${d.year}`} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full max-w-[32px] bg-teal/20 hover:bg-teal transition-all rounded-t-md relative group flex items-end justify-center"
                  style={{ height: `${heightPercent}%` }}
                >
                  <span className="absolute -top-5 text-[10px] ticket-mono font-bold text-midnight opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.count}
                  </span>
                </div>
                <span className="ticket-mono text-[11px] text-midnight mt-1.5">{d.month}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
