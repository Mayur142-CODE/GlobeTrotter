import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, MapPin, Calendar, Wallet, Clock, Share2, Copy, Check, ArrowRight, Facebook, Twitter, MessageCircle, Link as LinkIcon } from 'lucide-react';
import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import { getTrip } from '@/services/tripService';
import { getStops } from '@/services/itineraryService';
import { createTrip } from '@/services/tripService';
import { FlightPathLine } from '@/components/itinerary/FlightPathLine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDateShort, formatDate, daysBetween } from '@/lib/utils';

export default function SharedItinerary() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    Promise.all([getTrip(tripId), getStops(tripId)]).then(([t, s]) => {
      setTrip(t ?? null);
      setStops(s);
      setLoading(false);
    });
  }, [tripId]);

  function handleCopyTrip() {
    if (!trip) return;
    createTrip({
      name: `${trip.name} (Copy)`,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverPhotoUrl: trip.coverPhotoUrl,
      status: 'draft',
    }).then((newTrip) => {
      setCopied(true);
      toast({ title: 'Copied to your trips', description: `"${newTrip.name}" is now in your trip list.`, variant: 'success' });
      setTimeout(() => setCopied(false), 3000);
    });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: trip?.name, text: trip?.description, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Share link copied', description: 'The link is in your clipboard.', variant: 'success' });
    }
  }

  function handleSocialShare(platform: 'facebook' | 'twitter' | 'whatsapp') {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this trip: ${trip?.name}`);
    let shareUrl = '';
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${text}%20${url}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
  }

  function handleCopyLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied', description: 'Share it anywhere!', variant: 'success' });
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
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-midnight mb-2">Trip not found</h1>
          <p className="font-sans text-sm text-ink/60 mb-4">This shared itinerary may have been removed.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const days = daysBetween(trip.startDate, trip.endDate);
  const totalActivityCost = stops.reduce((sum, s) => sum + s.activities.reduce((a, act) => a + act.price, 0), 0);
  const totalCost = trip.budget.total + totalActivityCost;

  return (
    <div className="min-h-screen bg-parchment">
      {/* Public header bar */}
      <header className="bg-midnight text-parchment-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
            <Plane className="w-4 h-4 text-parchment-50" aria-hidden />
          </div>
          <span className="font-serif text-lg font-semibold">GlobeTrotter</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
          Sign in to plan your own
        </Button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Cover */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden shadow-paper-lg mb-6"
        >
          <div className="relative h-48 sm:h-64">
            <img src={trip.coverPhotoUrl} alt={trip.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <Badge variant="gold" className="mb-2">Shared Itinerary</Badge>
              <h1 className="font-serif text-2xl sm:text-4xl font-semibold text-parchment-50 text-balance">{trip.name}</h1>
              <p className="font-sans text-sm text-parchment-100/80 mt-1.5 max-w-xl">{trip.description}</p>
            </div>
          </div>
        </motion.div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Calendar, label: 'Dates', value: `${formatDateShort(trip.startDate)} — ${formatDateShort(trip.endDate)}` },
            { icon: MapPin, label: 'Stops', value: String(stops.length) },
            { icon: Calendar, label: 'Days', value: String(days) },
            { icon: Wallet, label: 'Est. Cost', value: formatCurrency(totalCost) },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              className="rounded-xl bg-parchment-50 border border-parchment-300/60 shadow-paper p-3"
            >
              <stat.icon className="w-4 h-4 text-teal mb-1.5" aria-hidden />
              <p className="ticket-mono text-sm font-semibold text-midnight">{stat.value}</p>
              <p className="font-sans text-xs text-ink/50">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Flight path */}
        {stops.length > 0 && (
          <div className="boarding-pass p-6 mb-6">
            <h2 className="font-serif text-lg font-semibold text-midnight mb-4 text-center">Route</h2>
            <FlightPathLine stops={stops.map((s) => ({ id: s.id, label: s.city.name, sublabel: formatDateShort(s.startDate) }))} variant="light" />
          </div>
        )}

        {/* Destination sequence */}
        <div className="space-y-4 mb-6">
          {stops.map((stop, i) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.3) }}
              className="boarding-pass overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-32 h-24 sm:h-auto shrink-0 overflow-hidden">
                  <img src={stop.city.imageUrl} alt={stop.city.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="ticket-mono text-xs text-ink/40">STOP {String(i + 1).padStart(2, '0')}</span>
                    <Badge variant="gold">{formatDateShort(stop.startDate)} — {formatDateShort(stop.endDate)}</Badge>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-midnight flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal" aria-hidden /> {stop.city.name}, {stop.city.country}
                  </h3>
                  {stop.activities.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {stop.activities.map((act) => (
                        <li key={act.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-sans text-ink/70">{act.name}</span>
                          <span className="ticket-mono text-xs text-ink/50 flex items-center gap-2">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden />{act.durationHours}h</span>
                            {formatCurrency(act.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Button size="lg" className="flex-1" onClick={handleCopyTrip}>
            {copied ? <><Check className="w-5 h-5" aria-hidden /> Copied to your trips</> : <><Copy className="w-5 h-5" aria-hidden /> Copy this Trip</>}
          </Button>
          <Button variant="outline" size="lg" onClick={handleShare}>
            <Share2 className="w-5 h-5" aria-hidden /> Share
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate('/signup')}>
            Start planning <ArrowRight className="w-4 h-4" aria-hidden />
          </Button>
        </div>

        {/* Social share buttons */}
        <div className="boarding-pass p-4">
          <p className="font-sans text-sm font-semibold text-midnight mb-3 text-center">Share this itinerary</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleSocialShare('facebook')}
              className="w-11 h-11 rounded-full bg-midnight text-parchment-50 flex items-center justify-center hover:bg-midnight-600 transition-colors focus-ring"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-5 h-5" aria-hidden />
            </button>
            <button
              onClick={() => handleSocialShare('twitter')}
              className="w-11 h-11 rounded-full bg-teal text-parchment-50 flex items-center justify-center hover:bg-teal-600 transition-colors focus-ring"
              aria-label="Share on Twitter"
            >
              <Twitter className="w-5 h-5" aria-hidden />
            </button>
            <button
              onClick={() => handleSocialShare('whatsapp')}
              className="w-11 h-11 rounded-full bg-gold text-midnight flex items-center justify-center hover:bg-gold-600 transition-colors focus-ring"
              aria-label="Share on WhatsApp"
            >
              <MessageCircle className="w-5 h-5" aria-hidden />
            </button>
            <button
              onClick={handleCopyLink}
              className="w-11 h-11 rounded-full bg-coral text-parchment-50 flex items-center justify-center hover:bg-coral-600 transition-colors focus-ring"
              aria-label="Copy link"
            >
              <LinkIcon className="w-5 h-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
