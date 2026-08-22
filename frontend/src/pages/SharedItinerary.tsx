import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane,
  MapPin,
  Calendar,
  Wallet,
  Clock,
  Share2,
  Copy,
  Check,
  ArrowRight,
  Facebook,
  Twitter,
  MessageCircle,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import { getTrip, duplicateTrip } from '@/services/tripService';
import { getStops } from '@/services/itineraryService';
import { useAuth } from '@/contexts/AuthContext';
import { FlightPathLine } from '@/components/itinerary/FlightPathLine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateShort, formatDate, daysBetween } from '@/lib/utils';

export default function SharedItinerary() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyingTrip, setCopyingTrip] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    Promise.all([getTrip(tripId), getStops(tripId)]).then(([t, s]) => {
      setTrip(t ?? null);
      setStops(s);
      setLoading(false);
    });
  }, [tripId]);

  async function handleCopyTrip() {
    if (!trip) return;

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in or create an account to copy this trip to your travel journal.',
        variant: 'default',
      });
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    setCopyingTrip(true);
    try {
      const cloned = await duplicateTrip(trip.id);
      setCopied(true);
      toast({
        title: 'Trip copied to your account!',
        description: `"${cloned.name}" is now ready for you to customize.`,
        variant: 'success',
      });
      navigate(`/itinerary/${cloned.id}`);
    } catch (err: any) {
      toast({
        title: 'Copy failed',
        description: err?.message || 'Could not duplicate trip.',
        variant: 'error',
      });
    } finally {
      setCopyingTrip(false);
    }
  }

  function handleShare() {
    if (navigator.share) {
      navigator
        .share({
          title: `GlobeTrotter: ${trip?.name}`,
          text: trip?.description || `Check out this multi-city itinerary on GlobeTrotter!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  }

  function handleSocialShare(platform: 'facebook' | 'twitter' | 'whatsapp') {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this travel itinerary on GlobeTrotter: ${trip?.name}`);
    let shareUrl = '';
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${text}%20${url}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  }

  function handleCopyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: 'Link copied', description: 'Public share link copied to clipboard.', variant: 'success' });
      setTimeout(() => setCopied(false), 3000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-midnight/10 text-midnight flex items-center justify-center mx-auto mb-3">
            <Plane className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-midnight mb-2">Itinerary Not Available</h1>
          <p className="font-sans text-sm text-ink/60 mb-6">
            This shared itinerary may be private or has been removed.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Go to GlobeTrotter Home</Button>
        </div>
      </div>
    );
  }

  const days = Math.max(1, daysBetween(trip.startDate, trip.endDate));
  const totalActivityCost = stops.reduce(
    (sum, s) => sum + (s.activities || []).reduce((a, act) => a + (act.price || 0), 0),
    0
  );
  const totalCost = (trip.budget?.total || 0) > 0 ? trip.budget.total : totalActivityCost;

  return (
    <div className="min-h-screen bg-parchment">
      {/* Public Navbar */}
      <header className="bg-midnight text-parchment-50 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-paper">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5 focus-ring rounded">
          <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
            <Plane className="w-4 h-4 text-parchment-50" aria-hidden />
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight">GlobeTrotter</span>
        </button>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleCopyTrip} disabled={copyingTrip} className="border-parchment-50/20 text-parchment-50 hover:bg-parchment-50/10">
            {copyingTrip ? 'Copying…' : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy Trip</>}
          </Button>
          {!isAuthenticated && (
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Cover & Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden shadow-paper-lg mb-6"
        >
          <div className="relative h-56 sm:h-72">
            <img src={trip.coverPhotoUrl} alt={trip.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/40 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 sm:bottom-6 sm:left-8 sm:right-8">
              <Badge variant="gold" className="mb-2">
                Public Shared Itinerary
              </Badge>
              <h1 className="font-serif text-2xl sm:text-4xl font-semibold text-parchment-50 text-balance">
                {trip.name}
              </h1>
              <p className="font-sans text-sm text-parchment-100/80 mt-1.5 max-w-xl line-clamp-2">
                {trip.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Calendar, label: 'Dates', value: `${formatDateShort(trip.startDate)} — ${formatDateShort(trip.endDate)}` },
            { icon: MapPin, label: 'Destinations', value: `${stops.length} stops` },
            { icon: Calendar, label: 'Duration', value: `${days} days` },
            { icon: Wallet, label: 'Est. Budget', value: formatCurrency(totalCost) },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              className="rounded-xl bg-parchment-50 border border-parchment-300/60 shadow-paper p-3.5"
            >
              <stat.icon className="w-4 h-4 text-teal mb-1" aria-hidden />
              <p className="ticket-mono text-sm font-semibold text-midnight">{stat.value}</p>
              <p className="font-sans text-[11px] text-ink/50">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Share actions bar */}
        <div className="boarding-pass p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-semibold text-midnight">Share Itinerary:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleSocialShare('whatsapp')}
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 focus-ring"
                aria-label="Share on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSocialShare('twitter')}
                className="p-2 rounded-lg bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 focus-ring"
                aria-label="Share on Twitter"
              >
                <Twitter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSocialShare('facebook')}
                className="p-2 rounded-lg bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 focus-ring"
                aria-label="Share on Facebook"
              >
                <Facebook className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-teal/10 text-teal hover:bg-teal/20 focus-ring"
                aria-label="Copy public link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1 sm:flex-none">
              {copied ? <><Check className="w-3.5 h-3.5 mr-1" /> Copied</> : <><LinkIcon className="w-3.5 h-3.5 mr-1" /> Copy Link</>}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCopyTrip} disabled={copyingTrip} className="flex-1 sm:flex-none">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> {copyingTrip ? 'Copying…' : 'Copy Trip to My Account'}
            </Button>
          </div>
        </div>

        {/* Flight path */}
        {stops.length > 0 && (
          <div className="boarding-pass p-6 mb-6">
            <h2 className="font-serif text-lg font-semibold text-midnight mb-4 text-center">Itinerary Route</h2>
            <FlightPathLine
              stops={stops.map((s) => ({ id: s.id, label: s.city.name, sublabel: formatDateShort(s.startDate) }))}
              variant="light"
            />
          </div>
        )}

        {/* Stops & Experiences */}
        <div className="space-y-4 mb-8">
          <h2 className="font-serif text-xl font-semibold text-midnight">Destination Schedule</h2>
          {stops.map((stop, i) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
              className="boarding-pass overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-36 h-28 sm:h-auto shrink-0 overflow-hidden">
                  <img src={stop.city.imageUrl} alt={stop.city.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="ticket-mono text-xs text-ink/40">STOP {String(i + 1).padStart(2, '0')}</span>
                    <Badge variant="gold">
                      {formatDateShort(stop.startDate)} — {formatDateShort(stop.endDate)}
                    </Badge>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-midnight flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal" aria-hidden /> {stop.city.name}, {stop.city.country}
                  </h3>
                  {stop.notes && <p className="font-sans text-xs text-ink/60 mt-1 italic">{stop.notes}</p>}

                  {stop.activities.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-dashed border-parchment-300">
                      <p className="ticket-mono text-[10px] uppercase tracking-wider text-ink/40 font-semibold mb-1.5">
                        Planned Experiences ({stop.activities.length}):
                      </p>
                      <ul className="space-y-1.5">
                        {stop.activities.map((act) => (
                          <li key={act.id} className="flex items-center justify-between gap-2 text-xs bg-parchment-100/50 p-2 rounded">
                            <span className="font-sans font-medium text-ink/80">{act.name}</span>
                            <span className="ticket-mono text-[11px] text-ink/60 flex items-center gap-2">
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-teal" /> {act.durationHours}h
                              </span>
                              {formatCurrency(act.price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
