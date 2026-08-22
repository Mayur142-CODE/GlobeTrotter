import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Search,
  ArrowUpDown,
  Filter,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { getAdminPopularCities, type PopularCityItem } from '@/services/adminService';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

export default function PopularCities() {
  const [cities, setCities] = useState<PopularCityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'most_planned' | 'least_planned' | 'alphabetical'>('most_planned');

  useEffect(() => {
    loadCities();
  }, [search, regionFilter, sortBy]);

  const loadCities = async () => {
    setLoading(true);
    try {
      const data = await getAdminPopularCities(search, regionFilter, sortBy);
      setCities(data);
    } finally {
      setLoading(false);
    }
  };

  const totalPlannedStops = cities.reduce((sum, c) => sum + c.tripCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-midnight flex items-center gap-2.5">
          <MapPin className="w-7 h-7 text-teal" /> Popular Cities
        </h1>
        <p className="font-sans text-xs sm:text-sm text-ink/60 mt-1">
          City popularity ranked dynamically from actual traveler trip stops & itinerary bookings ({totalPlannedStops} total stops planned across platform)
        </p>
      </div>

      {/* Controls Bar */}
      <div className="boarding-pass p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city, country, region…"
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink/50 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Region:
            </span>
            <Select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="text-xs w-32"
            >
              <option value="all">All Regions</option>
              <option value="Asia">Asia</option>
              <option value="Europe">Europe</option>
              <option value="Americas">Americas</option>
              <option value="Africa">Africa</option>
              <option value="Oceania">Oceania</option>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink/50 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs w-36"
            >
              <option value="most_planned">Most Planned</option>
              <option value="least_planned">Least Planned</option>
              <option value="alphabetical">Alphabetical</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Popular Cities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : cities.length === 0 ? (
        <div className="boarding-pass p-10 text-center">
          <MapPin className="w-12 h-12 text-ink/30 mx-auto mb-3" />
          <h3 className="font-serif text-base font-semibold text-midnight">No Destinations Found</h3>
          <p className="font-sans text-xs text-ink/50 mt-1">Try adjusting your search or region filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city, idx) => (
            <motion.div
              key={city.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.03 }}
              className="boarding-pass overflow-hidden group hover:shadow-paper-lg transition-all flex flex-col justify-between"
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={city.imageUrl}
                  alt={city.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/30 to-transparent" />

                {/* Rank badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-midnight/80 text-parchment-50 font-serif font-bold text-xs shadow-md border border-parchment-50/20">
                    #{idx + 1}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <Badge variant="teal" className="text-[10px] shadow">
                    {city.region}
                  </Badge>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3">
                  <h3 className="font-serif text-lg font-bold text-parchment-50 leading-tight">
                    {city.name}
                  </h3>
                  <p className="ticket-mono text-xs text-parchment-200/80 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-teal" /> {city.country}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-parchment-50/50 flex items-center justify-between border-t border-parchment-300/40 text-xs">
                <div>
                  <span className="ticket-mono text-[10px] text-ink/40 uppercase block">Times Planned</span>
                  <span className="font-bold text-midnight text-sm flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-teal" />
                    {city.tripCount} {city.tripCount === 1 ? 'trip' : 'trips'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="ticket-mono text-[10px] text-ink/40 uppercase block">Cost Index</span>
                  <span className="font-medium text-ink/70">{city.costIndex}/100</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
