import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { Activity, ActivityCategory } from '@/types/activity';
import type { City } from '@/types/city';
import { searchActivities, type ActivitySearchFilters } from '@/services/activitySearchService';
import { mockCities } from '@/data/mockCities';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ActivityCard } from '@/components/itinerary/ActivityCard';
import { ActivityCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

const CATEGORIES: (ActivityCategory | 'All')[] = ['All', 'Sightseeing', 'Food & Drink', 'Adventure', 'Culture', 'Nature', 'Nightlife', 'Shopping', 'Relaxation'];

export default function ActivitySearch() {
  const [cityId, setCityId] = useState<string>(mockCities[0].id);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ActivityCategory | 'All'>('All');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<ActivitySearchFilters['sortBy']>('popularity');
  const [results, setResults] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      searchActivities(cityId, query, {
        category,
        maxPrice,
        sortBy,
      }).then((r) => {
        setResults(r);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [cityId, query, category, maxPrice, sortBy]);

  const selectedCity: City | undefined = mockCities.find((c) => c.id === cityId);

  return (
    <PageContainer>
      <PageHeader title="Find Activities" subtitle="Browse experiences for any destination" />

      {/* City selector + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={cityId} onChange={(e) => setCityId(e.target.value)} className="sm:w-56" aria-label="Select city">
          {mockCities.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search activities…" className="pl-10" aria-label="Search activities" />
        </div>
        <Button variant="outline" onClick={() => setFiltersOpen(!filtersOpen)} className="sm:w-auto">
          <SlidersHorizontal className="w-4 h-4" aria-hidden /> Filters
        </Button>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-parchment-100/60 border border-parchment-300/60"
        >
          <div>
            <Label htmlFor="act-category">Category</Label>
            <Select id="act-category" value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory | 'All')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="act-sort">Sort By</Label>
            <Select id="act-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as ActivitySearchFilters['sortBy'])}>
              <option value="popularity">Most Popular</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="duration">Duration</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="max-price">Max Price: ₹{maxPrice}</Label>
            <input
              id="max-price"
              type="range"
              min={500}
              max={7000}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-teal mt-2"
              aria-label="Maximum price filter"
            />
          </div>
        </motion.div>
      )}

      {selectedCity && (
        <p className="font-sans text-sm text-ink/50 mb-4">
          Showing activities in <span className="font-semibold text-midnight">{selectedCity.name}</span> — {loading ? '…' : `${results.length} found`}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <ActivityCardSkeleton key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No activities found"
          description="Try adjusting your search or filters."
          action={<Button variant="outline" onClick={() => { setQuery(''); setCategory('All'); setMaxPrice(7000); }}>Clear filters</Button>}
        />
      ) : (
        <div className="space-y-4">
          {results.map((act, i) => (
            <ActivityCard key={act.id} activity={act} index={i} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
