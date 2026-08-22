import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImagePlus, ArrowRight, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { useToast } from '@/hooks/use-toast';
import { createTrip } from '@/services/tripService';

const COVER_OPTIONS = [
  { url: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg?auto=compress&cs=tinysrgb&w=800', label: 'Paris' },
  { url: 'https://images.pexels.com/photos/161251/kyoto-japan-temple-zen-161251.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Kyoto' },
  { url: 'https://images.pexels.com/photos/1802255/pexels-photo-1802255.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Bali' },
  { url: 'https://images.pexels.com/photos/819764/pexels-photo-819764.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Barcelona' },
  { url: 'https://images.pexels.com/photos/2506922/pexels-photo-2506922.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Tokyo' },
  { url: 'https://images.pexels.com/photos/3787839/pexels-photo-3787839.jpeg?auto=compress&cs=tinysrgb&w=800', label: 'Dubai' },
];

export default function CreateTrip() {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState(COVER_OPTIONS[0].url);
  const [errors, setErrors] = useState<{ name?: string; dates?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name) e.name = 'Trip name is required';
    if (!startDate || !endDate) e.dates = 'Please select start and end dates';
    else if (new Date(endDate) < new Date(startDate)) e.dates = 'End date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const trip = await createTrip({
        name,
        description: description || 'A new adventure awaiting its story.',
        startDate,
        endDate,
        coverPhotoUrl: coverUrl,
        status: 'draft',
      });
      toast({ title: 'Trip created!', description: 'Start adding stops to your itinerary.', variant: 'success' });
      navigate(`/itinerary/${trip.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader title="Plan a New Trip" subtitle="Open a fresh page in your travel journal" />

      <motion.form
        onSubmit={handleSubmit}
        noValidate
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="boarding-pass p-6 sm:p-8 space-y-5"
      >
        <div>
          <Label htmlFor="trip-name">Trip Name</Label>
          <Input
            id="trip-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Europe Summer Journal"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" className="font-sans text-xs text-coral mt-1.5">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        {errors.dates && <p className="font-sans text-xs text-coral -mt-2">{errors.dates}</p>}

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this journey about?"
          />
        </div>

        <div>
          <Label>Cover Photo</Label>
          <p className="font-sans text-xs text-ink/50 mb-3">Choose a cover image for your trip</p>
          <div className="grid grid-cols-3 gap-3">
            {COVER_OPTIONS.map((opt) => (
              <button
                key={opt.url}
                type="button"
                onClick={() => setCoverUrl(opt.url)}
                className={`relative rounded-lg overflow-hidden aspect-[4/3] focus-ring transition-all ${
                  coverUrl === opt.url ? 'ring-2 ring-teal ring-offset-2 ring-offset-parchment-50' : 'ring-1 ring-parchment-300/60'
                }`}
                aria-label={`Select ${opt.label} cover photo`}
                aria-pressed={coverUrl === opt.url}
              >
                <img src={opt.url} alt={opt.label} loading="lazy" className="w-full h-full object-cover" />
                {coverUrl === opt.url && (
                  <div className="absolute inset-0 bg-teal/20 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center">
                      <Check className="w-4 h-4 text-parchment-50" aria-hidden />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-midnight/60 px-2 py-1">
                  <span className="ticket-mono text-[10px] text-parchment-50">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-ink/40 font-sans">
            <ImagePlus className="w-4 h-4" aria-hidden />
            Cover photo selection is visual only — no files are uploaded.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed border-parchment-300">
          <Button type="button" variant="outline" onClick={() => navigate('/trips')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create & Build Itinerary'}
            {!loading && <ArrowRight className="w-4 h-4" aria-hidden />}
          </Button>
        </div>
      </motion.form>
    </PageContainer>
  );
}
