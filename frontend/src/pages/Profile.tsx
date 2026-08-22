import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Globe,
  Heart,
  Save,
  Trash2,
  Check,
  Phone,
  MapPin,
  LogOut,
  Camera,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { City } from '@/types/city';
import { getSavedDestinations, unsaveDestination } from '@/services/savedDestinationService';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Japanese', 'German', 'Mandarin'];

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, loading: authLoading, signOut, refreshProfile, uploadAvatar } = useAuth();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('English');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savedCities, setSavedCities] = useState<City[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const loadSavedDestinationsList = async () => {
    if (!user) return;
    try {
      const list = await getSavedDestinations(user.id);
      setSavedCities(list);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (user || profile) {
      setFirstName(user?.firstName || profile?.first_name || '');
      setLastName(user?.lastName || profile?.last_name || '');
      setEmailInput(user?.email || '');
      setPhone(user?.phone || profile?.phone || '');
      setCity(user?.city || profile?.city || '');
      setCountry(user?.country || profile?.country || '');
      setLanguage(user?.language || profile?.language || 'English');
      setAvatarUrl(user?.avatarUrl || profile?.avatar_url || '');
      loadSavedDestinationsList();
    }
  }, [user, profile]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid image', description: 'Please select a JPG or PNG photo.', variant: 'error' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Photo should be smaller than 5MB.', variant: 'error' });
      return;
    }

    setUploadingPhoto(true);
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      if (publicUrl) {
        setAvatarUrl(publicUrl);
        // Persist avatar to profile immediately
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        await refreshProfile();
        toast({ title: 'Avatar updated', description: 'Profile picture saved.', variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message, variant: 'error' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      // 1. Check if email was changed
      if (emailInput.trim() && emailInput.trim() !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: emailInput.trim(),
        });
        if (emailError) {
          toast({
            title: 'Email change notice',
            description: emailError.message,
            variant: 'warning',
          });
        } else {
          toast({
            title: 'Email confirmation sent',
            description: `Confirmation email sent to ${emailInput.trim()}.`,
            variant: 'success',
          });
        }
      }

      // 2. Update profile table
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
          country: country.trim() || null,
          language,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setSaved(true);
      toast({ title: 'Profile saved', description: 'Your passport details have been updated.', variant: 'success' });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast({ title: 'Save failed', description: err?.message || 'Could not update profile.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleUnsaveCity(cityId: string, cityName: string) {
    try {
      await unsaveDestination(cityId);
      setSavedCities((prev) => prev.filter((c) => c.id !== cityId));
      toast({
        title: 'Destination removed',
        description: `${cityName} removed from your saved bookmarks.`,
        variant: 'default',
      });
    } catch (err: any) {
      toast({ title: 'Unsave failed', description: err?.message, variant: 'error' });
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      toast({ title: 'Signed out', description: 'See you next time!', variant: 'default' });
      navigate('/login');
    } catch {
      navigate('/login');
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    try {
      // Delete user profile data (trips, stops, activities, saved destinations cascade)
      await supabase.from('profiles').delete().eq('id', user.id);
      await signOut();
      toast({
        title: 'Account deleted',
        description: 'All your user data has been permanently removed.',
        variant: 'default',
      });
      navigate('/signup');
    } catch (err: any) {
      toast({ title: 'Account deletion failed', description: err?.message, variant: 'error' });
    } finally {
      setDeleteOpen(false);
    }
  }

  if (authLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-64 w-full col-span-2" />
        </div>
      </PageContainer>
    );
  }

  if (!user) return null;

  return (
    <PageContainer>
      <PageHeader title="Profile & Passport" subtitle="Manage your traveler identity and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="boarding-pass p-5 text-center flex flex-col justify-between"
        >
          <div>
            <div className="relative w-28 h-28 mx-auto mb-3">
              <img
                src={avatarUrl || user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                alt={user.name}
                className="w-full h-full rounded-full object-cover border-4 border-teal/30 shadow-paper"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-teal text-parchment-50 shadow hover:bg-teal-600 focus-ring"
                aria-label="Upload profile picture"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <h2 className="font-serif text-xl font-semibold text-midnight">{user.name || 'GlobeTrotter Traveler'}</h2>
            <p className="font-sans text-xs text-ink/50">{user.email}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <Badge variant="teal">Traveler</Badge>
              {user.emailConfirmed && (
                <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700">
                  Verified
                </Badge>
              )}
            </div>

            {(city || country) && (
              <p className="font-sans text-xs text-ink/60 mt-2.5 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal" />
                {[city, country].filter(Boolean).join(', ')}
              </p>
            )}

            <div className="border-t border-dashed border-parchment-300 mt-4 pt-4 text-xs">
              <p className="ticket-mono text-[10px] text-ink/40">MEMBER SINCE</p>
              <p className="ticket-mono text-midnight font-medium">
                {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-dashed border-parchment-300">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full text-xs text-coral hover:bg-coral/10 hover:text-coral border-coral/30"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Edit Passport Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="boarding-pass p-6 lg:col-span-2"
        >
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Passport Details & Preferences</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-first-name">First Name</Label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input
                    id="profile-first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="profile-last-name">Last Name</Label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input
                    id="profile-last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input
                    id="profile-email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="profile-phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input
                    id="profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-country">Home Country</Label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input
                    id="profile-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="India"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="profile-city">Home City</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input
                    id="profile-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Rajkot"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="profile-language">Language Preference</Label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 z-10" aria-hidden />
                <Select id="profile-language" value={language} onChange={(e) => setLanguage(e.target.value)} className="pl-10">
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dashed border-parchment-300">
              <Button
                variant="outline"
                onClick={() => {
                  setFirstName(user.firstName || '');
                  setLastName(user.lastName || '');
                  setEmailInput(user.email || '');
                  setPhone(user.phone || '');
                  setCity(user.city || '');
                  setCountry(user.country || '');
                  setLanguage(user.language || 'English');
                }}
              >
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saved ? (
                  <>
                    <Check className="w-4 h-4 mr-1" aria-hidden /> Saved
                  </>
                ) : saving ? (
                  'Saving…'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" aria-hidden /> Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Saved Destinations Section (Connected to Supabase saved_destinations table) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="boarding-pass p-6 mt-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-midnight flex items-center gap-2">
              <Heart className="w-5 h-5 text-coral fill-coral" aria-hidden /> Saved Destinations
            </h2>
            <p className="font-sans text-xs text-ink/50">Cities and regions bookmarked for your future travel plans</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/search/cities')}>
            Explore More Cities
          </Button>
        </div>

        {loadingSaved ? (
          <p className="font-sans text-sm text-ink/50 py-4">Loading saved destinations…</p>
        ) : savedCities.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-parchment-300 rounded-lg">
            <p className="font-sans text-sm text-ink/50 mb-2">No saved destinations yet.</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/search/cities')}>
              Browse & Bookmark Cities
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {savedCities.map((c) => (
              <div
                key={c.id}
                className="group relative rounded-xl overflow-hidden shadow-paper text-left border border-parchment-300/60 bg-parchment-50"
              >
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={c.imageUrl}
                    alt={c.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnsaveCity(c.id, c.name);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-midnight/60 text-parchment-50 hover:bg-coral hover:text-white transition-colors"
                    aria-label={`Unsave ${c.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="font-serif text-sm font-semibold text-parchment-50">{c.name}</p>
                    <p className="ticket-mono text-[10px] text-parchment-100/70">{c.country}</p>
                  </div>
                </div>
                <div className="p-2.5 flex items-center justify-between text-[11px] text-ink/60">
                  <span>Region: {c.region}</span>
                  <span className="font-semibold text-teal">{c.popularity}% Pop</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="mt-6 rounded-xl border border-coral/30 bg-coral/5 p-6"
      >
        <h2 className="font-serif text-lg font-semibold text-coral-700 mb-1">Danger Zone</h2>
        <p className="font-sans text-sm text-ink/60 mb-4">
          Permanently delete your account and all associated itineraries, stops, and saved data. This cannot be undone.
        </p>
        <Button variant="coral" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4 mr-1.5" aria-hidden /> Delete Account
        </Button>
      </motion.div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Permanently delete your account?"
        description="All your created trips, itineraries, activities, budget expenses, and saved destinations will be permanently purged. This action cannot be reversed."
        confirmLabel="Delete Account"
      />
    </PageContainer>
  );
}
