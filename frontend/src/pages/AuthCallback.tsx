import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function handleAuthCallback() {
      try {
        // Exchange code or parse session from URL fragment
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session?.user) {
          const user = data.session.user;
          const isVerified = !!(user.email_confirmed_at || user.confirmed_at);

          if (isVerified) {
            // Upsert profile in case it wasn't created
            const meta = user.user_metadata || {};
            await supabase.from('profiles').upsert(
              {
                id: user.id,
                first_name: meta.first_name || null,
                last_name: meta.last_name || null,
                phone: meta.phone || null,
                city: meta.city || null,
                country: meta.country || null,
                additional_info: meta.additional_info || null,
                avatar_url: meta.avatar_url || null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );

            await refreshProfile();

            if (mounted) {
              setStatus('success');
              // Auto-navigate after 2.5 seconds
              setTimeout(() => {
                navigate('/dashboard');
              }, 2500);
            }
            return;
          }
        }

        // If no active session, listen for auth change
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (session?.user?.email_confirmed_at || session?.user?.confirmed_at) {
              await refreshProfile();
              setStatus('success');
              setTimeout(() => {
                navigate('/dashboard');
              }, 2500);
            }
          }
        });

        // Timeout fallback
        setTimeout(() => {
          if (mounted && status === 'loading') {
            setStatus('error');
            setErrorMessage('Email verification link is invalid or has expired. Please sign in or request a new link.');
          }
        }, 6000);

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error('[GlobeTrotter] Callback processing error:', err);
        if (mounted) {
          setStatus('error');
          setErrorMessage(err?.message || "We couldn't verify your email. Please try again.");
        }
      }
    }

    handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, refreshProfile, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-11 h-11 rounded-xl bg-teal flex items-center justify-center shadow-md">
              <Plane className="w-6 h-6 text-parchment-50" aria-hidden />
            </div>
            <span className="font-serif text-2xl font-semibold text-parchment-50 tracking-tight">GlobeTrotter</span>
          </div>
        </div>

        <div className="boarding-pass p-6 sm:p-8 text-center">
          {status === 'loading' && (
            <div className="py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal/15 flex items-center justify-center mx-auto text-teal animate-pulse">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <h1 className="font-serif text-xl font-semibold text-midnight">Verifying your passport...</h1>
              <p className="font-sans text-xs text-ink/60 max-w-xs mx-auto">
                Please wait while we confirm your email and set up your GlobeTrotter account.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h1 className="font-serif text-2xl font-semibold text-midnight">Email verified! ✈️</h1>
                <p className="font-sans text-sm text-ink/70">Your traveler passport is ready.</p>
                <p className="font-sans text-xs text-ink/50 pt-1">Redirecting to your dashboard in a moment...</p>
              </div>

              <div className="pt-4">
                <Button onClick={() => navigate('/dashboard')} size="lg" className="w-full inline-flex items-center justify-center gap-2">
                  <span>Continue to GlobeTrotter</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-coral/15 flex items-center justify-center mx-auto text-coral">
                <AlertCircle className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h1 className="font-serif text-xl font-semibold text-midnight">We couldn't verify your email</h1>
                <p className="font-sans text-xs text-ink/70 max-w-xs mx-auto">
                  {errorMessage || 'The verification link may have expired or was already used. Please try again.'}
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Link to="/login" className="block w-full">
                  <Button variant="default" size="lg" className="w-full inline-flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </Button>
                </Link>
                <Link
                  to="/verify-email"
                  className="block text-xs font-sans text-teal hover:underline pt-2 font-medium"
                >
                  Request a new verification email
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
