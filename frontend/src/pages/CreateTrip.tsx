import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImagePlus, ArrowRight, Check, Upload, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { useToast } from '@/hooks/use-toast';
import { createTrip } from '@/services/tripService';
import { supabase } from '@/lib/supabase';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState(COVER_OPTIONS[0].url);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customPreview, setCustomPreview] = useState<string>('');

  const [errors, setErrors] = useState<{ name?: string; dates?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Trip name is required';
    if (!startDate || !endDate) e.dates = 'Please select start and end dates';
    else if (new Date(endDate) < new Date(startDate)) e.dates = 'End date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'error' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image size should be less than 10MB.', variant: 'error' });
      return;
    }

    setCustomFile(file);
    const localPreview = URL.createObjectURL(file);
    setCustomPreview(localPreview);
    setCoverUrl(localPreview);

    // Upload to Supabase Storage asynchronously
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const filePath = `trip-covers/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) {
          setCoverUrl(publicUrlData.publicUrl);
          toast({ title: 'Photo uploaded!', description: 'Saved to Supabase storage.', variant: 'success' });
        }
      }
    } catch (err) {
      console.warn('[GlobeTrotter] Cover photo upload fallback:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    let finalCoverUrl = coverUrl;

    // If file selected and not yet uploaded to Supabase Storage, upload before submit
    if (customFile && coverUrl.startsWith('blob:')) {
      try {
        const fileExt = customFile.name.split('.').pop() || 'jpg';
        const filePath = `trip-covers/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, customFile, { upsert: true, contentType: customFile.type });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            finalCoverUrl = publicUrlData.publicUrl;
          }
        }
      } catch (err) {
        console.warn('[GlobeTrotter] Final storage upload notice:', err);
      }
    }

    try {
      const trip = await createTrip({
        name: name.trim(),
        description: description.trim() || 'A new adventure awaiting its story.',
        startDate,
        endDate,
        coverPhotoUrl: finalCoverUrl,
        budgetLimit: budgetLimit.trim() ? Number(budgetLimit) : undefined,
        status: 'draft',
      });
      toast({ title: 'Trip created!', description: 'Start adding stops to your itinerary.', variant: 'success' });
      navigate(`/itinerary/${trip.id}`);
    } catch (err: any) {
      toast({ title: 'Error creating trip', description: err?.message || 'Could not create trip.', variant: 'error' });
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
          <Label htmlFor="trip-name">Trip Name *</Label>
          <Input
            id="trip-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Europe Summer Journal"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            required
          />
          {errors.name && <p id="name-error" className="font-sans text-xs text-coral mt-1.5">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date *</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="end-date">End Date *</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
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
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="budget-limit">Estimated Price / Budget (₹ INR)</Label>
          <Input
            id="budget-limit"
            type="number"
            min={0}
            step={500}
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            placeholder="e.g. 50000"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Cover Photo</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs border-teal/40 text-teal hover:bg-teal/10"
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1" /> Upload Custom Photo
                </>
              )}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <p className="font-sans text-xs text-ink/50 mb-3">
            Select a preset cover or upload your own image from your device
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {/* Custom Uploaded Preview Tile if present */}
            {customPreview && (
              <button
                type="button"
                onClick={() => setCoverUrl(customPreview)}
                className={`relative rounded-lg overflow-hidden aspect-[4/3] focus-ring transition-all ${
                  coverUrl === customPreview ? 'ring-2 ring-teal ring-offset-2 ring-offset-parchment-50' : 'ring-1 ring-parchment-300/60'
                }`}
                aria-label="Select custom uploaded photo"
              >
                <img src={customPreview} alt="Custom uploaded cover" className="w-full h-full object-cover" />
                {coverUrl === customPreview && (
                  <div className="absolute inset-0 bg-teal/20 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center">
                      <Check className="w-4 h-4 text-parchment-50" aria-hidden />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-midnight/70 px-2 py-1 flex items-center justify-between">
                  <span className="ticket-mono text-[10px] text-teal font-semibold">CUSTOM</span>
                  <Sparkles className="w-3 h-3 text-gold" />
                </div>
              </button>
            )}

            {/* Presets */}
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

          <div className="mt-3">
            <Label htmlFor="custom-url" className="text-xs text-ink/60">Or enter an image URL directly:</Label>
            <Input
              id="custom-url"
              type="url"
              value={coverUrl.startsWith('blob:') ? '' : coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://images.unsplash.com/…"
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed border-parchment-300">
          <Button type="button" variant="outline" onClick={() => navigate('/trips')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || uploadingImage}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Create & Build Itinerary <ArrowRight className="w-4 h-4" aria-hidden />
              </span>
            )}
          </Button>
        </div>
      </motion.form>
    </PageContainer>
  );
}
