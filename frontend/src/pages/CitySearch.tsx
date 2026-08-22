import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Star, TrendingUp, Edit2, Trash2, Loader2, Sparkles, Heart } from 'lucide-react';
import type { City, Region } from '@/types/city';
import {
  searchCities,
  createCity,
  updateCity,
  deleteCity,
  type CitySearchFilters,
} from '@/services/citySearchService';
import {
  getSavedDestinationIds,
  saveDestination,
  unsaveDestination,
} from '@/services/savedDestinationService';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<Region | 'All'>('All');
  const [sortBy, setSortBy] = useState<CitySearchFilters['sortBy']>('popularity');
  const [results, setResults] = useState<City[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
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
      const [r, saved] = await Promise.all([
        searchCities(query, { region, sortBy }),
        user ? getSavedDestinationIds(user.id) : Promise.resolve([]),
      ]);
      setResults(r);
      setSavedIds(saved);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadCities();
    }, 250);
    return () => clearTimeout(t);
  }, [query, region, sortBy, user]);

  const handleToggleBookmark = async (city: City) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Sign in to save destinations to your account.', variant: 'default' });
      navigate('/login');
      return;
    }

    const isSaved = savedIds.includes(city.id);
    try {
      if (isSaved) {
        await unsaveDestination(city.id);
        setSavedIds((prev) => prev.filter((id) => id !== city.id));
        toast({ title: 'Removed bookmark', description: `${city.name} removed from saved list.`, variant: 'default' });
      } else {
        await saveDestination(city.id);
        setSavedIds((prev) => [...prev, city.id]);
        toast({ title: 'Destination saved!', description: `${city.name} bookmarked to your profile.`, variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Error saving destination', description: err?.message, variant: 'error' });
    }
  };

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
          name: formName.trim(),
          country: formCountry.trim(),
          region: formRegion,
          description: formDescription.trim(),
          costIndex: formCostIndex,
          popularity: formPopularity,
          imageUrl: formImageUrl.trim() || undefined,
        });
        toast({ title: 'City updated', description: `${formName} has been updated in catalog.`, variant: 'success' });
      } else {
        await createCity({
          name: formName.trim(),
          country: formCountry.trim(),
          region: formRegion,
          description: formDescription.trim() || 'A vibrant travel destination awaiting discovery.',
          costIndex: formCostIndex,
          popularity: formPopularity,
          imageUrl: formImageUrl.trim() || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
        });
        toast({ title: 'Destination added', description: `${formName} added to the catalog.`, variant: 'success' });
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
      toast({ title: 'Destination deleted', description: 'Removed from global destination catalog.', variant: 'success' });
      setDeletingCityId(null);
      await loadCities();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Could not delete destination.', variant: 'error' });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Destination Explorer"
        subtitle="Discover world-class cities, check cost indices, and bookmark favorite spots"
        action={
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-1.5" aria-hidden /> Add Destination
          </Button>
        }
      />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city, country, or keyword…"
            className="pl-10"
            aria-label="Search destinations"
          />
        </div>
        <Select
          value={region}
          onChange={(e) => setRegion(e.target.value as Region | 'All')}
          className="sm:w-44"
          aria-label="Filter by region"
        >
          <option value="All">All Regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as CitySearchFilters['sortBy'])}
          className="sm:w-44"
          aria-label="Sort destinations"
        >
          <option value="popularity">Most Popular</option>
          <option value="name">Alphabetical</option>
          <option value="cost_asc">Cost: Low to High</option>
          <option value="cost_desc">Cost: High to Low</option>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <CityCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No destinations found"
          description="Try broadening your search keywords or switching the region filter."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setRegion('All');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {results.map((city, i) => {
            const isBookmarked = savedIds.includes(city.id);
            return (
              <motion.div
                key={city.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                className="boarding-pass overflow-hidden group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={city.imageUrl}
                      alt={city.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/30 to-transparent" />

                    {/* Bookmark heart button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(city);
                      }}
                      className="absolute top-2.5 right-2.5 p-2 rounded-full bg-midnight/60 backdrop-blur-sm text-parchment-50 hover:bg-midnight transition-colors focus-ring"
                      aria-label={isBookmarked ? `Unsave ${city.name}` : `Save ${city.name}`}
                    >
                      <Heart
                        className={`w-4 h-4 ${isBookmarked ? 'text-coral fill-coral' : 'text-parchment-50'}`}
                      />
                    </button>

                    <div className="absolute top-2.5 left-2.5">
                      <Badge variant="teal" className="text-[10px]">
                        {city.region}
                      </Badge>
                    </div>

                    <div className="absolute bottom-2.5 left-3.5 right-3.5">
                      <h3 className="font-serif text-lg font-semibold text-parchment-50">{city.name}</h3>
                      <p className="ticket-mono text-xs text-parchment-100/70">{city.country}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="font-sans text-xs text-ink/60 line-clamp-2">{city.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-dashed border-parchment-300 pt-2.5">
                      <div>
                        <span className="font-sans text-ink/50 text-[10px] block uppercase">Cost Index</span>
                        <p className="ticket-mono text-sm font-semibold text-midnight">{city.costIndex}/100</p>
                      </div>
                      <div>
                        <span className="font-sans text-ink/50 text-[10px] block uppercase">Popularity</span>
                        <p className="ticket-mono text-sm font-semibold text-midnight flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-teal" aria-hidden />
                          {city.popularity}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-dashed border-parchment-300 mt-2 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      toast({ title: 'Destination selected', description: `${city.name} ready for trip planning.`, variant: 'success' });
                      navigate('/trips/create');
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add to Trip
                  </Button>
                  <button
                    onClick={() => openEditModal(city)}
                    className="p-2 text-ink/40 hover:text-teal rounded focus-ring"
                    aria-label={`Edit ${city.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingCityId(city.id)}
                    className="p-2 text-ink/40 hover:text-coral rounded focus-ring"
                    aria-label={`Delete ${city.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
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
                  <Label htmlFor="city-img">Cover Image URL</Label>
                  <Input
                    id="city-img"
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>

                <div>
                  <Label htmlFor="city-desc">Description</Label>
                  <Textarea
                    id="city-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the culture, landscape, and attractions…"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-parchment-300">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                      </>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingCityId}
        onClose={() => setDeletingCityId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this destination?"
        description="Are you sure you want to remove this destination from the global catalog? Associated trips with this stop will also be affected."
        confirmLabel="Delete Destination"
      />
    </PageContainer>
  );
}
