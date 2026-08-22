import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { forgotPassword } from '@/services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
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
      await forgotPassword(email);
      setSent(true);
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
            <div className="w-11 h-11 rounded-xl bg-teal flex items-center justify-center">
              <Plane className="w-6 h-6 text-parchment-50" aria-hidden />
            </div>
            <span className="font-serif text-2xl font-semibold text-parchment-50">GlobeTrotter</span>
          </div>
        </div>

        <div className="boarding-pass p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-teal/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-teal" aria-hidden />
              </div>
              <h1 className="font-serif text-xl font-semibold text-midnight mb-1.5">Check your inbox</h1>
              <p className="font-sans text-sm text-ink/60 mb-5">
                If an account exists for <span className="font-semibold text-ink">{email}</span>, a password reset link has been sent.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-teal hover:underline">
                <ArrowLeft className="w-4 h-4" aria-hidden /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-xl font-semibold text-midnight mb-1.5">Forgot password?</h1>
              <p className="font-sans text-sm text-ink/60 mb-5">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10" aria-invalid={!!error} aria-describedby={error ? 'email-error' : undefined} />
                  </div>
                  {error && <p id="email-error" className="font-sans text-xs text-coral mt-1.5">{error}</p>}
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
              <div className="mt-5 pt-5 border-t border-dashed border-parchment-300 text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-teal hover:underline">
                  <ArrowLeft className="w-4 h-4" aria-hidden /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
