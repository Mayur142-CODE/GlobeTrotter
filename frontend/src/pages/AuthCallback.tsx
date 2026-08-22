import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2, RefreshCw, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth, getFriendlyAuthErrorMessage } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshProfile, resendVerificationEmail } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorTitle, setErrorTitle] = useState('We couldn\'t verify your email');
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // Resend state
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Read stored pending email from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('globetrotter_pending_verification_email') || '';
    setPendingEmail(stored);
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let mounted = true;

    async function processAuthCallback() {
      try {
        // 1. Parse query and hash parameters
        const searchParams = new URLSearchParams(window.location.search);
        const rawHash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(rawHash);

        const error = searchParams.get('error') || hashParams.get('error');
        const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
        const errorDescription =
          searchParams.get('error_description') || hashParams.get('error_description');

        // Check for error in URL parameters immediately
        if (error || errorCode) {
          if (!mounted) return;
          setStatus('error');
          if (
            errorCode === 'otp_expired' ||
            errorCode === 'expired_token' ||
            errorDescription?.toLowerCase().includes('expired') ||
            errorDescription?.toLowerCase().includes('invalid')
          ) {
            setIsExpired(true);
            setErrorTitle('Verification link expired');
            setErrorMessage(
              'The verification link may have already been used or has expired. Request a new verification email to continue your journey.'
            );
          } else {
            setErrorTitle('Verification failed');
            setErrorMessage(
              decodeURIComponent(errorDescription || error || '').replace(/\+/g, ' ') ||
                'Unable to complete email verification. Please try again.'
            );
          }
          return;
        }

        // 2. Check for token_hash (PKCE / Token Hash flow)
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const type = (searchParams.get('type') || hashParams.get('type') || 'email') as any;

        if (tokenHash) {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });

          if (verifyError) {
            if (!mounted) return;
            setStatus('error');
            const msg = verifyError.message.toLowerCase();
            if (msg.includes('expired') || msg.includes('invalid') || (verifyError as any).code === 'otp_expired') {
              setIsExpired(true);
              setErrorTitle('Verification link expired');
              setErrorMessage(
                'The verification link may have already been used or has expired. Request a new verification email to continue your journey.'
              );
            } else {
              setErrorTitle('Verification failed');
              setErrorMessage(getFriendlyAuthErrorMessage(verifyError));
            }
            return;
          }

          if (data?.user || data?.session) {
            const confirmedUser = data.user || data.session?.user;
            if (confirmedUser) {
              await ensureProfile(confirmedUser);
            }
            if (mounted) {
              sessionStorage.removeItem('globetrotter_pending_verification_email');
              setStatus('success');
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 2000);
            }
            return;
          }
        }

        // 3. Check for active session or implicit token grant
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          if (!mounted) return;
          setStatus('error');
          setErrorMessage(getFriendlyAuthErrorMessage(sessionError));
          return;
        }

        if (sessionData.session?.user) {
          const user = sessionData.session.user;
          const isVerified = !!(user.email_confirmed_at || user.confirmed_at);
          if (isVerified) {
            await ensureProfile(user);
            if (mounted) {
              sessionStorage.removeItem('globetrotter_pending_verification_email');
              setStatus('success');
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 2000);
            }
            return;
          }
        }

        // 4. Fallback listener for auth state change
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (session?.user?.email_confirmed_at || session?.user?.confirmed_at) {
              await ensureProfile(session.user);
              sessionStorage.removeItem('globetrotter_pending_verification_email');
              setStatus('success');
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 2000);
            }
          }
        });

        // 5. Explicit timeout failsafe: Never stay indefinitely in loading
        const timer = setTimeout(() => {
          if (mounted && status === 'loading') {
            setStatus('error');
            setIsExpired(true);
            setErrorTitle('Verification link expired or invalid');
            setErrorMessage(
              'No active verification session was found. The link may have expired or was already verified.'
            );
          }
        }, 4000);

        return () => {
          clearTimeout(timer);
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

    async function ensureProfile(user: any) {
      try {
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
            avatar_url: meta.avatar_url && !meta.avatar_url.startsWith('data:') ? meta.avatar_url : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
        await refreshProfile();
      } catch (e) {
        console.warn('[GlobeTrotter] Profile upsert notice:', e);
      }
    }

    processAuthCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, refreshProfile]);

  const handleResend = async () => {
    const emailToUse = pendingEmail.trim();
    if (!emailToUse) {
      toast({
        title: 'Email required',
        description: 'Please go to Sign In or Enter your email.',
        variant: 'error',
      });
      navigate('/verify-email');
      return;
    }

    setResending(true);
    try {
      await resendVerificationEmail(emailToUse);
      setCooldown(60);
      toast({
        title: 'New verification email sent!',
        description: `Check your inbox at ${emailToUse}.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Unable to resend email',
        description: err.message || 'Please wait a moment before trying again.',
        variant: 'error',
      });
    } finally {
      setResending(false);
    }
  };

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

        <div className="boarding-pass p-6 sm:p-8 text-center shadow-2xl">
          {status === 'loading' && (
            <div className="py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal/15 flex items-center justify-center mx-auto text-teal">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <h1 className="font-serif text-xl font-semibold text-midnight">Verifying your account...</h1>
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
                <p className="font-sans text-sm text-ink/70">Your travel planning account is ready.</p>
                <p className="font-sans text-xs text-ink/50 pt-1">Redirecting to your dashboard in a moment...</p>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  size="lg"
                  className="w-full inline-flex items-center justify-center gap-2"
                >
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
              <div className="space-y-2">
                <h1 className="font-serif text-xl font-semibold text-midnight">{errorTitle}</h1>
                <p className="font-sans text-xs text-ink/70 max-w-xs mx-auto leading-relaxed">
                  {errorMessage}
                </p>
                {pendingEmail && (
                  <p className="font-mono text-xs text-teal font-semibold bg-teal/10 py-1 px-2.5 rounded max-w-xs mx-auto truncate">
                    {pendingEmail}
                  </p>
                )}
              </div>

              <div className="pt-4 space-y-3">
                {isExpired && pendingEmail && (
                  <Button
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    variant="secondary"
                    size="lg"
                    className="w-full text-xs font-medium inline-flex items-center justify-center gap-2"
                  >
                    {resending ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Sending new email...
                      </span>
                    ) : cooldown > 0 ? (
                      `Resend available in ${cooldown}s`
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send New Verification Email
                      </span>
                    )}
                  </Button>
                )}

                <Link to="/login" className="block w-full">
                  <Button variant="default" size="lg" className="w-full inline-flex items-center justify-center gap-2 text-xs">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </Button>
                </Link>

                <Link
                  to="/verify-email"
                  className="block text-xs font-sans text-teal hover:underline pt-1 font-medium"
                >
                  Verify another email address
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
