import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPassword() {
  const toast = useToast();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    if (!email.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPasswordForEmail(email);
      setSent(true);
      toast({
        title: 'Reset link sent!',
        description: `Check your inbox at ${email}`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Unable to send reset link',
        description: err.message || 'Please check your email and try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight px-4 py-8">
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

        <div className="boarding-pass p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-teal/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-teal" aria-hidden />
              </div>
              <h1 className="font-serif text-xl font-semibold text-midnight mb-1.5">Check your inbox</h1>
              <p className="font-sans text-xs text-ink/60 mb-5 leading-relaxed">
                If an account exists for <span className="font-semibold text-ink">{email}</span>, a password reset link has been sent.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-teal hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-xl font-semibold text-midnight mb-1.5">Forgot password?</h1>
              <p className="font-sans text-xs text-ink/60 mb-5">Enter your email and we'll send you a password reset link.</p>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="traveler@example.com"
                      className="pl-10"
                      aria-invalid={!!error}
                      aria-describedby={error ? 'email-error' : undefined}
                    />
                  </div>
                  {error && <p id="email-error" className="font-sans text-xs text-coral mt-1.5">{error}</p>}
                </div>
                <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                  {loading ? 'Sending link…' : 'Send Reset Link'}
                </Button>
              </form>
              <div className="mt-5 pt-5 border-t border-dashed border-parchment-300 text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-teal hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
