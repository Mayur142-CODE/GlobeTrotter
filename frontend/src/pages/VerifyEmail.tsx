import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { supabaseUser, isEmailVerified, resendVerificationEmail, refreshProfile } = useAuth();

  const [inputEmail, setInputEmail] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const emailFromState = (location.state as any)?.email;
    const emailFromStorage = sessionStorage.getItem('globetrotter_pending_verification_email');
    const resolved = emailFromState || emailFromStorage || supabaseUser?.email || '';
    setTargetEmail(resolved);
    if (resolved) {
      setInputEmail(resolved);
    }
  }, [location.state, supabaseUser]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // If user is already verified, navigate to dashboard
  useEffect(() => {
    if (isEmailVerified) {
      sessionStorage.removeItem('globetrotter_pending_verification_email');
      navigate('/dashboard', { replace: true });
    }
  }, [isEmailVerified, navigate]);

  const handleResend = async () => {
    const emailToSend = (targetEmail || inputEmail).trim();
    if (!emailToSend || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailToSend)) {
      toast({
        title: 'Valid email required',
        description: 'Please enter a valid email address to receive the verification link.',
        variant: 'error',
      });
      return;
    }

    setResending(true);
    try {
      await resendVerificationEmail(emailToSend);
      sessionStorage.setItem('globetrotter_pending_verification_email', emailToSend);
      setTargetEmail(emailToSend);
      setCooldown(60);
      toast({
        title: 'Verification email sent!',
        description: `Check your inbox at ${emailToSend}.`,
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

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const { data } = await supabase.auth.getUser();
      const confirmed = !!(data.user?.email_confirmed_at || data.user?.confirmed_at);
      if (confirmed) {
        sessionStorage.removeItem('globetrotter_pending_verification_email');
        await refreshProfile();
        toast({
          title: 'Email verified!',
          description: 'Welcome to GlobeTrotter!',
          variant: 'success',
        });
        navigate('/dashboard', { replace: true });
      } else {
        toast({
          title: 'Awaiting confirmation',
          description: 'Please click the link sent to your email inbox, then check back here.',
          variant: 'default',
        });
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-11 h-11 rounded-xl bg-teal flex items-center justify-center shadow-md">
              <Plane className="w-6 h-6 text-parchment-50" aria-hidden />
            </div>
            <span className="font-serif text-2xl font-semibold text-parchment-50 tracking-tight">GlobeTrotter</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-parchment-50">Verify your email</h1>
          <p className="font-sans text-xs text-parchment-100/60 mt-1">We're almost ready for takeoff ✈️</p>
        </div>

        <div className="boarding-pass p-6 sm:p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-teal/15 flex items-center justify-center mx-auto mb-4 text-teal">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2 mb-5">
            <h2 className="font-serif text-xl font-semibold text-midnight">Check your inbox</h2>
            <p className="font-sans text-xs text-ink/70 leading-relaxed max-w-xs mx-auto">
              We've sent a verification link to:
            </p>
            {targetEmail ? (
              <p className="font-mono text-xs font-semibold text-teal bg-teal/10 py-1.5 px-3 rounded-md inline-block max-w-full truncate">
                {targetEmail}
              </p>
            ) : (
              <div className="pt-2 text-left">
                <Input
                  type="email"
                  placeholder="Enter your registered email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}
            <p className="font-sans text-xs text-ink/60 pt-1">
              Verify your email address to activate your account and start planning your journeys.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={handleCheckStatus}
              disabled={checking}
              size="lg"
              className="w-full inline-flex items-center justify-center gap-2"
            >
              {checking ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking status...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  I've verified my email
                </span>
              )}
            </Button>

            <Button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              variant="secondary"
              size="lg"
              className="w-full text-xs font-medium"
            >
              {resending
                ? 'Sending verification link…'
                : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : 'Resend verification email'}
            </Button>
          </div>

          <div className="mt-6 pt-5 border-t border-dashed border-parchment-300 flex items-center justify-between text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-sans font-medium text-teal hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
            <Link
              to="/register"
              className="font-sans text-ink/60 hover:text-teal transition-colors"
            >
              Change email / Register
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
