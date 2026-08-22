import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Star, TrendingUp } from 'lucide-react';
import type { City, Region } from '@/types/city';
import { searchCities, type CitySearchFilters } from '@/services/citySearchService';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CityCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const REGIONS: (Region | 'All')[] = ['All', 'Europe', 'Asia', 'Middle East', 'Southeast Asia', 'North America'];

export default function CitySearch() {
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [sortBy, setSortBy] = useState<CitySearchFilters['sortBy']>('popularity');
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      searchCities(query, { region, sortBy }).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query, region, sortBy]);

  return (
    <PageContainer>
      <PageHeader title="Explore Cities" subtitle="Discover destinations for your next journey" />

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city or country…"
            className="pl-10"
            aria-label="Search cities"
          />
        </div>
        <Select value={region} onChange={(e) => setRegion(e.target.value as Region | 'All')} className="sm:w-48" aria-label="Filter by region">
          {REGIONS.map((r) => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as CitySearchFilters['sortBy'])} className="sm:w-44" aria-label="Sort cities">
          <option value="popularity">Most Popular</option>
          <option value="costLow">Cost: Low to High</option>
          <option value="costHigh">Cost: High to Low</option>
          <option value="name">Name (A-Z)</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <CityCardSkeleton key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No cities found"
          description="Try a different search term or region filter."
          action={<Button variant="outline" onClick={() => { setQuery(''); setRegion('All'); }}>Clear filters</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((city, i) => (
            <motion.div
              key={city.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
              whileHover={{ y: -4 }}
              className="rounded-xl overflow-hidden border border-parchment-300/60 shadow-paper bg-parchment-50"
            >
              <div className="relative h-40 overflow-hidden">
                <img src={city.imageUrl} alt={city.name} loading="lazy" className="w-full h-full object-cover" />
                {city.popularity >= 90 && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="gold"><Star className="w-3 h-3" aria-hidden /> Popular</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-midnight">{city.name}</h3>
                    <p className="font-sans text-sm text-ink/50">{city.country}</p>
                  </div>
                  <Badge variant="outline">{city.region}</Badge>
                </div>
                <p className="font-sans text-sm text-ink/60 line-clamp-2 mb-3">{city.description}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Cost Index</p>
                      <p className="ticket-mono text-sm font-semibold text-midnight">{city.costIndex}/100</p>
                    </div>
                    <div>
                      <p className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40">Popularity</p>
                      <p className="ticket-mono text-sm font-semibold text-midnight flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-teal" aria-hidden />{city.popularity}%
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full mt-3"
                  onClick={() => {
                    toast({ title: 'City selected', description: `${city.name} is ready to add to a trip.`, variant: 'success' });
                    navigate('/trips/create');
                  }}
                >
                  <Plus className="w-4 h-4" aria-hidden /> Add to Trip
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
