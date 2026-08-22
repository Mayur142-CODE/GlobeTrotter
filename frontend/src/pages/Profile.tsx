import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Globe, Heart, Save, Trash2, Check } from 'lucide-react';
import type { User } from '@/types/user';
import type { City } from '@/types/city';
import { getCurrentUser, updateUser } from '@/services/authService';
import { mockCities } from '@/data/mockCities';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Japanese', 'German', 'Mandarin'];

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setName(u.name);
      setEmail(u.email);
      setLanguage(u.language);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const updated = await updateUser({ name, email, language });
    setUser(updated);
    setSaving(false);
    setSaved(true);
    toast({ title: 'Profile saved', description: 'Your changes have been updated.', variant: 'success' });
    setTimeout(() => setSaved(false), 3000);
  }

  function handleDeleteAccount() {
    toast({ title: 'Account deleted', description: 'This is a demo — your account is still active.', variant: 'warning' });
    setDeleteOpen(false);
    navigate('/login');
  }

  if (loading) {
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

  const savedCities = mockCities.filter((c) => user.savedDestinationIds.includes(c.id));

  return (
    <PageContainer>
      <PageHeader title="Profile" subtitle="Manage your account and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="boarding-pass p-5 text-center"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-parchment-300/60 shadow-paper mb-3"
          />
          <h2 className="font-serif text-xl font-semibold text-midnight">{user.name}</h2>
          <p className="font-sans text-sm text-ink/50">{user.email}</p>
          <Badge variant="teal" className="mt-2">Traveler</Badge>
          <div className="border-t border-dashed border-parchment-300 mt-4 pt-4">
            <p className="ticket-mono text-xs text-ink/40">MEMBER SINCE</p>
            <p className="ticket-mono text-sm text-midnight">{new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
          </div>
        </motion.div>

        {/* Edit form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="boarding-pass p-5 lg:col-span-2"
        >
          <h2 className="font-serif text-lg font-semibold text-midnight mb-4">Account Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="profile-name">Full Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="profile-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                <Input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="profile-language">Language</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 z-10" aria-hidden />
                <Select id="profile-language" value={language} onChange={(e) => setLanguage(e.target.value)} className="pl-10">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed border-parchment-300">
              <Button variant="outline" onClick={() => { setName(user.name); setEmail(user.email); setLanguage(user.language); }}>
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
            {savedCities.map((city) => (
              <button
                key={city.id}
                onClick={() => navigate('/search/cities')}
                className="group relative rounded-lg overflow-hidden shadow-paper text-left focus-ring"
              >
                <img src={city.imageUrl} alt={city.name} loading="lazy" className="w-full h-24 object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 to-transparent" />
                <div className="absolute bottom-1.5 left-2.5 right-2.5">
                  <p className="font-serif text-sm font-semibold text-parchment-50">{city.name}</p>
                  <p className="ticket-mono text-[10px] text-parchment-100/70">{city.country}</p>
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
