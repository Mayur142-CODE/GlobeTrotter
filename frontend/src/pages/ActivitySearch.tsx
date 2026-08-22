import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Plus, Loader2, Sparkles } from 'lucide-react';
import type { Activity, ActivityCategory } from '@/types/activity';
import type { City } from '@/types/city';
import {
  searchActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  type ActivitySearchFilters,
} from '@/services/activitySearchService';
import { searchCities as fetchCities } from '@/services/citySearchService';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ActivityCard } from '@/components/itinerary/ActivityCard';
import { ActivityCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES: ActivityCategory[] = [
  'Sightseeing',
  'Food & Drink',
  'Adventure',
  'Culture',
  'Nature',
  'Nightlife',
  'Shopping',
  'Relaxation',
];

export default function ActivitySearch() {
  const toast = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState<string>(''); // Default to '' (All Destinations) so all activities are shown
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ActivityCategory | 'All'>('All');
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [sortBy, setSortBy] = useState<ActivitySearchFilters['sortBy']>('popularity');
  const [results, setResults] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Modal Dialog states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('Sightseeing');
  const [formCityId, setFormCityId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number>(500);
  const [formDuration, setFormDuration] = useState<number>(2);
  const [formImageUrl, setFormImageUrl] = useState('');

  // Delete Confirm Dialog state
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

  // Load cities from Supabase
  useEffect(() => {
    fetchCities('').then((cList) => {
      setCities(cList);
    });
  }, []);

  // Fetch activities from Supabase
  const loadActivities = async () => {
    setLoading(true);
    try {
      const r = await searchActivities(cityId, query, {
        category,
        maxPrice,
        sortBy,
      });
      setResults(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadActivities();
    }, 250);
    return () => clearTimeout(t);
  }, [cityId, query, category, maxPrice, sortBy]);

  const openAddModal = () => {
    setEditingActivity(null);
    setFormName('');
    setFormCategory('Sightseeing');
    setFormCityId(cityId || (cities[0]?.id ?? ''));
    setFormDescription('');
    setFormPrice(500);
    setFormDuration(2);
    setFormImageUrl('');
    setModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setFormName(act.name);
    setFormCategory(act.category);
    setFormCityId(act.cityId || cityId);
    setFormDescription(act.description);
    setFormPrice(act.price);
    setFormDuration(act.durationHours);
    setFormImageUrl(act.imageUrl);
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast({ title: 'Validation error', description: 'Activity name is required.', variant: 'error' });
      return;
    }
    if (!formCityId) {
      toast({ title: 'Validation error', description: 'Please select a destination.', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, {
          cityId: formCityId,
          name: formName,
          category: formCategory,
          description: formDescription,
          imageUrl: formImageUrl,
          price: Number(formPrice),
          durationHours: Number(formDuration),
        });
        toast({ title: 'Activity updated', description: 'Changes saved to Supabase!', variant: 'success' });
      } else {
        await createActivity({
          cityId: formCityId,
          name: formName,
          category: formCategory,
          description: formDescription,
          imageUrl: formImageUrl,
          price: Number(formPrice),
          durationHours: Number(formDuration),
        });

        // Automatically switch filter to the target city or all destinations so the new activity shows immediately
        if (cityId && cityId !== formCityId) {
          setCityId(formCityId);
        }

        toast({ title: 'Activity created', description: 'New activity saved to Supabase!', variant: 'success' });
      }

      setModalOpen(false);
      await loadActivities();
    } catch (err: any) {
      toast({ title: 'Error saving activity', description: err?.message || 'Operation failed.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingActivityId) return;
    try {
      await deleteActivity(deletingActivityId);
      toast({ title: 'Activity deleted', description: 'Permanently removed from Supabase.', variant: 'success' });
      setDeletingActivityId(null);
      // Immediately filter out deleted item from state
      setResults((prev) => prev.filter((a) => a.id !== deletingActivityId));
      await loadActivities();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Could not delete from Supabase.', variant: 'error' });
    }
  };

  const selectedCity: City | undefined = cities.find((c) => c.id === cityId);

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <PageHeader title="Find & Manage Activities" subtitle="Browse and create live experiences in Supabase" />
        <Button variant="primary" onClick={openAddModal} className="sm:shrink-0">
          <Plus className="w-4 h-4 mr-1.5" aria-hidden /> Add Activity
        </Button>
      </div>

      {/* City selector + search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="sm:w-64"
          aria-label="Select destination filter"
        >
          <option value="">🌐 All Destinations (Show Everything)</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.country}
            </option>
          ))}
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities by name, description, or category…"
            className="pl-10"
            aria-label="Search activities"
          />
        </div>
        <Button variant="outline" onClick={() => setFiltersOpen(!filtersOpen)} className="sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 mr-1.5" aria-hidden /> Filters
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
            <Select
              id="act-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory | 'All')}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="act-sort">Sort By</Label>
            <Select
              id="act-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ActivitySearchFilters['sortBy'])}
            >
              <option value="popularity">Most Popular</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="duration">Duration</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="max-price">Max Price: ₹{maxPrice.toLocaleString()}</Label>
            <input
              id="max-price"
              type="range"
              min={500}
              max={25000}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-teal mt-2"
              aria-label="Maximum price filter"
            />
          </div>
        </motion.div>
      )}

      <p className="font-sans text-sm text-ink/50 mb-4">
        {selectedCity ? (
          <>
            Showing activities in <span className="font-semibold text-midnight">{selectedCity.name}</span> —{' '}
            {loading ? '…' : `${results.length} found`}
          </>
        ) : (
          <>
            Showing activities across <span className="font-semibold text-midnight">All Destinations</span> —{' '}
            {loading ? '…' : `${results.length} found`}
          </>
        )}
      </p>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ActivityCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No activities found"
          description="Be the first to add an activity for this destination!"
          action={
            <Button variant="primary" onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Activity Now
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {results.map((act, i) => (
            <ActivityCard
              key={act.id}
              activity={act}
              index={i}
              onEdit={() => openEditModal(act)}
              onDelete={() => setDeletingActivityId(act.id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Activity Dialog Modal */}
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
                  {editingActivity ? 'Edit Activity' : 'Add New Activity'}
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
                <div>
                  <Label htmlFor="form-name">Activity Title *</Label>
                  <Input
                    id="form-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Jambuvanti Gufa Trek"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="form-dest">Destination *</Label>
                    <Select
                      id="form-dest"
                      value={formCityId}
                      onChange={(e) => setFormCityId(e.target.value)}
                      required
                    >
                      {cities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}, {c.country}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="form-cat">Category</Label>
                    <Select
                      id="form-cat"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="form-desc">Description</Label>
                  <Textarea
                    id="form-desc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe what travelers will experience…"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="form-price">Price (₹ INR)</Label>
                    <Input
                      id="form-price"
                      type="number"
                      min={0}
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="form-dur">Duration (Hours)</Label>
                    <Input
                      id="form-dur"
                      type="number"
                      step={0.5}
                      min={0.5}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="form-img">Image URL (Optional)</Label>
                  <Input
                    id="form-img"
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
                    ) : editingActivity ? (
                      'Save Changes'
                    ) : (
                      'Create Activity'
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
        open={!!deletingActivityId}
        onClose={() => setDeletingActivityId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Activity"
        description="Are you sure you want to delete this activity? This will permanently remove it from Supabase."
        confirmText="Delete"
        variant="danger"
      />
    </PageContainer>
  );
}
