import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Star, TrendingUp, Edit2, Trash2, Loader2, Sparkles } from 'lucide-react';
import type { City, Region } from '@/types/city';
import {
  searchCities,
  createCity,
  updateCity,
  deleteCity,
  type CitySearchFilters,
} from '@/services/citySearchService';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CityCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

const REGIONS: Region[] = ['Europe', 'Asia', 'Middle East', 'Southeast Asia', 'North America'];

export default function CitySearch() {
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [sortBy, setSortBy] = useState<CitySearchFilters['sortBy']>('popularity');
  const [results, setResults] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Dialog states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formRegion, setFormRegion] = useState<Region>('Asia');
  const [formDescription, setFormDescription] = useState('');
  const [formCostIndex, setFormCostIndex] = useState<number>(50);
  const [formPopularity, setFormPopularity] = useState<number>(85);
  const [formImageUrl, setFormImageUrl] = useState('');

  // Delete Confirm state
  const [deletingCityId, setDeletingCityId] = useState<string | null>(null);

  const loadCities = async () => {
    setLoading(true);
    try {
      const r = await searchCities(query, { region, sortBy });
      setResults(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadCities();
    }, 250);
    return () => clearTimeout(t);
  }, [query, region, sortBy]);

  const openAddModal = () => {
    setEditingCity(null);
    setFormName('');
    setFormCountry('');
    setFormRegion('Asia');
    setFormDescription('');
    setFormCostIndex(50);
    setFormPopularity(85);
    setFormImageUrl('');
    setModalOpen(true);
  };

  const openEditModal = (city: City) => {
    setEditingCity(city);
    setFormName(city.name);
    setFormCountry(city.country);
    setFormRegion(city.region);
    setFormDescription(city.description);
    setFormCostIndex(city.costIndex);
    setFormPopularity(city.popularity);
    setFormImageUrl(city.imageUrl);
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCountry.trim()) {
      toast({ title: 'Validation error', description: 'City name and country are required.', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCity) {
        await updateCity(editingCity.id, {
          name: formName,
          country: formCountry,
          region: formRegion,
          description: formDescription,
          imageUrl: formImageUrl,
          costIndex: Number(formCostIndex),
          popularity: Number(formPopularity),
        });
        toast({ title: 'Destination updated', description: 'Saved changes to Supabase.', variant: 'success' });
      } else {
        await createCity({
          name: formName,
          country: formCountry,
          region: formRegion,
          description: formDescription,
          imageUrl: formImageUrl,
          costIndex: Number(formCostIndex),
          popularity: Number(formPopularity),
        });
        toast({ title: 'Destination created', description: 'Added new city to Supabase.', variant: 'success' });
      }

      setModalOpen(false);
      await loadCities();
    } catch (err: any) {
      toast({ title: 'Operation failed', description: err?.message || 'Could not save destination.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCityId) return;
    try {
      await deleteCity(deletingCityId);
      toast({ title: 'Destination deleted', description: 'Removed from Supabase.', variant: 'success' });
      setDeletingCityId(null);
      setResults((prev) => prev.filter((c) => c.id !== deletingCityId));
      await loadCities();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Could not delete destination.', variant: 'error' });
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <PageHeader title="Explore Cities" subtitle="Discover and manage destinations for your next journey" />
        <Button variant="primary" onClick={openAddModal} className="sm:shrink-0">
          <Plus className="w-4 h-4 mr-1.5" aria-hidden /> Add Destination
        </Button>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city, country, or keyword…"
            className="pl-10"
            aria-label="Search cities"
          />
        </div>
        <Select value={region} onChange={(e) => setRegion(e.target.value as Region | 'All')} className="sm:w-48" aria-label="Filter by region">
          <option value="All">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
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
          description="Try clearing your filters or add a new destination."
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
              className="rounded-xl overflow-hidden border border-parchment-300/60 shadow-paper bg-parchment-50 flex flex-col"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={city.imageUrl} alt={city.name} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  {city.popularity >= 90 && (
                    <Badge variant="gold"><Star className="w-3 h-3" aria-hidden /> Popular</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(city)}
                    className="h-7 w-7 p-0 bg-midnight/60 hover:bg-midnight text-parchment-50 rounded-full"
                    title="Edit destination"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingCityId(city.id)}
                    className="h-7 w-7 p-0 bg-midnight/60 hover:bg-coral text-parchment-50 rounded-full"
                    title="Delete destination"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-midnight">{city.name}</h3>
                      <p className="font-sans text-sm text-ink/50">{city.country}</p>
                    </div>
                    <Badge variant="outline">{city.region}</Badge>
                  </div>
                  <p className="font-sans text-sm text-ink/60 line-clamp-2 mb-3">{city.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
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
                  <Button
                    className="w-full"
                    onClick={() => {
                      toast({ title: 'Destination selected', description: `${city.name} is ready for your trip.`, variant: 'success' });
                      navigate('/trips/create');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" aria-hidden /> Add to Trip
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Destination Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-parchment-50 border border-parchment-300 p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-parchment-300">
                <h3 className="font-serif text-xl font-semibold text-midnight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal" />
                  {editingCity ? 'Edit Destination' : 'Add New Destination'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-ink/40 hover:text-ink font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city-name">City Name *</Label>
                    <Input
                      id="city-name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Kyoto"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city-country">Country *</Label>
                    <Input
                      id="city-country"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="e.g. Japan"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="city-region">Region</Label>
                    <Select
                      id="city-region"
                      value={formRegion}
                      onChange={(e) => setFormRegion(e.target.value as Region)}
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city-cost">Cost Index (1-100)</Label>
                    <Input
                      id="city-cost"
                      type="number"
                      min={1}
                      max={100}
                      value={formCostIndex}
                      onChange={(e) => setFormCostIndex(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city-pop">Popularity (1-100)</Label>
                    <Input
                      id="city-pop"
                      type="number"
                      min={1}
                      max={100}
                      value={formPopularity}
                      onChange={(e) => setFormPopularity(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="city-desc">Description</Label>
                  <Textarea
                    id="city-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Brief highlights about this destination…"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="city-img">Image URL (Optional)</Label>
                  <Input
                    id="city-img"
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/…"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-parchment-300">
                  <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                      </span>
                    ) : editingCity ? (
                      'Save Changes'
                    ) : (
                      'Create Destination'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deletingCityId}
        onClose={() => setDeletingCityId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Destination"
        description="Are you sure you want to delete this destination? This will permanently remove it from Supabase."
        confirmText="Delete"
        variant="danger"
      />
    </PageContainer>
  );
}
