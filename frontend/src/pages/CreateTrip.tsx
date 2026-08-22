import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImagePlus, ArrowRight, Upload, Loader2, Sparkles, X, RefreshCw, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { useToast } from '@/hooks/use-toast';
import { createTrip, uploadTripCover } from '@/services/tripService';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateTrip() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [budgetLimit, setBudgetLimit] = useState<string>('');

  // Cover photo upload state
  const [coverFile, setCoverFile] = useState<File | Blob | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // Compress photo locally before storing preview
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file (JPG, PNG, WebP).', variant: 'error' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image size should be less than 10MB.', variant: 'error' });
      return;
    }

    const img = new Image();
    const tempUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(tempUrl);
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCoverFile(blob);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              setCoverPreview(dataUrl);
            } else {
              setCoverFile(file);
              const reader = new FileReader();
              reader.onload = () => setCoverPreview(reader.result as string);
              reader.readAsDataURL(file);
            }
          },
          'image/jpeg',
          0.85
        );
      } else {
        setCoverFile(file);
        const reader = new FileReader();
        reader.onload = () => setCoverPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
    };
    img.src = tempUrl;
  };

  const handleRemovePhoto = () => {
    setCoverFile(null);
    setCoverPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      let finalCoverUrl = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

      // If user uploaded a custom cover image, upload persistently to Supabase Storage
      if (coverFile && user) {
        setUploadingImage(true);
        finalCoverUrl = await uploadTripCover(user.id, coverFile);
      } else if (coverPreview && !coverPreview.startsWith('blob:')) {
        finalCoverUrl = coverPreview;
      }

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
      setUploadingImage(false);
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
            className="mt-1"
          />
          {errors.name && <p id="name-error" className="font-sans text-xs text-coral mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date *</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 font-mono text-xs"
              required
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date *</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 font-mono text-xs"
              required
            />
          </div>
        </div>
        {errors.dates && <p className="font-sans text-xs text-coral">{errors.dates}</p>}

        <div>
          <Label htmlFor="trip-desc">Description / Notes</Label>
          <Textarea
            id="trip-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the theme or goal of this trip?"
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="budget-limit">Total Budget Limit (INR)</Label>
          <Input
            id="budget-limit"
            type="number"
            min={0}
            step="100"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            placeholder="e.g. 50000"
            className="mt-1"
          />
          <p className="font-sans text-xs text-ink/50 mt-1">Optional budget ceiling to track expenditures.</p>
        </div>

        {/* Clean Cover Photo Upload Section (No Preset Templates) */}
        <div>
          <Label className="block mb-2">Cover Photo</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {!coverPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-parchment-300 hover:border-teal rounded-xl p-6 text-center cursor-pointer transition-colors bg-parchment-50/50 hover:bg-parchment-100/50 flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-midnight/5 group-hover:bg-teal/10 flex items-center justify-center text-ink/50 group-hover:text-teal transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-serif text-sm font-semibold text-midnight">Upload Cover Photo</p>
                <p className="font-sans text-xs text-ink/50 mt-0.5">
                  No cover photo selected (JPG, PNG, WebP up to 10MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-paper border border-parchment-300">
                <img
                  src={coverPreview}
                  alt="Uploaded cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="ticket-mono text-xs text-parchment-50 font-medium">Cover Photo Selected</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-midnight/70 text-parchment-50 border-parchment-50/20 hover:bg-midnight text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Change Photo
                    </Button>
                    <Button
                      type="button"
                      variant="coral"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="text-xs"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-parchment-300 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/trips')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || uploadingImage}>
            {loading || uploadingImage ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Trip…
              </span>
            ) : (
              <>
                Create & Continue <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </motion.form>
    </PageContainer>
  );
}
