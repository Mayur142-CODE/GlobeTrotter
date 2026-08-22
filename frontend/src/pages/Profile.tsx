import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Globe, Heart, Save, Trash2, Check, Phone, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { City } from '@/types/city';
import { searchCities as fetchCities } from '@/services/citySearchService';
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
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('English');
  const [allCities, setAllCities] = useState<City[]>([]);

  useEffect(() => {
    fetchCities('').then(setAllCities);
  }, []);

  useEffect(() => {
    if (user || profile) {
      setFirstName(user?.firstName || profile?.first_name || '');
      setLastName(user?.lastName || profile?.last_name || '');
      setPhone(user?.phone || profile?.phone || '');
      setCity(user?.city || profile?.city || '');
      setCountry(user?.country || profile?.country || '');
      setLanguage(user?.language || profile?.language || 'English');
    }
  }, [user, profile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
          country: country.trim() || null,
          language,
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

  async function handleSignOut() {
    try {
      await signOut();
      toast({ title: 'Signed out', description: 'See you next time!', variant: 'default' });
      navigate('/login');
    } catch {
      navigate('/login');
    }
  }

  function handleDeleteAccount() {
    toast({ title: 'Account deletion', description: 'Please contact support to permanently remove your account.', variant: 'warning' });
    setDeleteOpen(false);
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

  const savedCities = allCities.filter((c) => (user.savedDestinationIds || []).includes(c.id));

  return (
    <PageContainer>
      <PageHeader title="Profile & Passport" subtitle="Manage your traveler identity and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="boarding-pass p-5 text-center"
        >
          <img
            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
            alt={user.name}
            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-teal/30 shadow-paper mb-3"
          />
          <h2 className="font-serif text-xl font-semibold text-midnight">{user.name || 'GlobeTrotter Traveler'}</h2>
          <p className="font-sans text-xs text-ink/50">{user.email}</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Badge variant="teal">Traveler</Badge>
            {user.emailConfirmed && <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700">Verified</Badge>}
          </div>

          {(user.city || user.country) && (
            <p className="font-sans text-xs text-ink/60 mt-2 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-teal" />
              {[user.city, user.country].filter(Boolean).join(', ')}
            </p>
          )}

          <div className="border-t border-dashed border-parchment-300 mt-4 pt-4">
            <p className="ticket-mono text-[10px] text-ink/40">MEMBER SINCE</p>
            <p className="ticket-mono text-xs text-midnight">
              {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-parchment-300">
            <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full text-xs text-coral hover:bg-coral/10 hover:text-coral border-coral/30">
              <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Edit form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="boarding-pass p-5 lg:col-span-2"
        >
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Passport Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-first-name">First Name</Label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input id="profile-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div>
                <Label htmlFor="profile-last-name">Last Name</Label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input id="profile-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-email">Email (Immutable)</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input id="profile-email" type="email" value={user.email} disabled className="pl-10 bg-parchment-200/40 text-ink/60" />
                </div>
              </div>
              <div>
                <Label htmlFor="profile-phone">Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="pl-10" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile-country">Country</Label>
                <div className="relative mt-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input id="profile-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" className="pl-10" />
                </div>
              </div>
              <div>
                <Label htmlFor="profile-city">City</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input id="profile-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Rajkot" className="pl-10" />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="profile-language">Language</Label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 z-10" aria-hidden />
                <Select id="profile-language" value={language} onChange={(e) => setLanguage(e.target.value)} className="pl-10">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed border-parchment-300">
              <Button variant="outline" onClick={() => {
                setFirstName(user.firstName || '');
                setLastName(user.lastName || '');
                setPhone(user.phone || '');
                setCity(user.city || '');
                setCountry(user.country || '');
                setLanguage(user.language || 'English');
              }}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saved ? <><Check className="w-4 h-4" aria-hidden /> Saved</> : saving ? 'Saving…' : <><Save className="w-4 h-4" aria-hidden /> Save changes</>}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Saved destinations */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="boarding-pass p-5 mt-5"
      >
        <h2 className="font-serif text-lg font-semibold text-midnight mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-coral" aria-hidden /> Saved Destinations
        </h2>
        {savedCities.length === 0 ? (
          <p className="font-sans text-sm text-ink/40 italic">No saved destinations yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {savedCities.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate('/search/cities')}
                className="group relative rounded-lg overflow-hidden shadow-paper text-left focus-ring"
              >
                <img src={c.imageUrl} alt={c.name} loading="lazy" className="w-full h-24 object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 to-transparent" />
                <div className="absolute bottom-1.5 left-2.5 right-2.5">
                  <p className="font-serif text-sm font-semibold text-parchment-50">{c.name}</p>
                  <p className="ticket-mono text-[10px] text-parchment-100/70">{c.country}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18 }}
        className="mt-5 rounded-xl border border-coral/30 bg-coral/5 p-5"
      >
        <h2 className="font-serif text-lg font-semibold text-coral-700 mb-1">Danger Zone</h2>
        <p className="font-sans text-sm text-ink/60 mb-3">Permanently delete your account and all associated trips. This cannot be undone.</p>
        <Button variant="coral" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4" aria-hidden /> Delete account
        </Button>
      </motion.div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="All your trips, itineraries, and saved destinations will be permanently removed. This action cannot be undone."
        confirmLabel="Delete account"
      />
    </PageContainer>
  );
}
