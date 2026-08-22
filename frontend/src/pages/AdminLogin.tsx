import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { adminLogin, isAdminAuthenticated } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to /admin
  if (isAdminAuthenticated) {
    navigate('/admin', { replace: true });
  }

  const from = (location.state as any)?.from?.pathname || '/admin';

  const handleFillDemo = () => {
    setEmail('admin@globaltrotter.com');
    setPassword('admin#123');
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Admin ID / Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await adminLogin(email, password);
      if (success) {
        toast({
          title: 'Admin Access Granted',
          description: 'Welcome to GlobeTrotter Platform Management.',
          variant: 'success',
        });
        navigate(from, { replace: true });
      } else {
        setError('Invalid admin credentials. Please check your Admin ID and password.');
        toast({
          title: 'Access Denied',
          description: 'Invalid admin credentials.',
          variant: 'error',
        });
      }
    } catch {
      setError('An error occurred during admin authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-midnight text-parchment-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal/20 border border-teal/40 text-teal mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-parchment-50">GlobeTrotter Admin</h1>
          <p className="font-sans text-sm text-parchment-200/70 mt-1">Platform Control & Analytics Portal</p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-midnight-800/90 backdrop-blur-xl py-8 px-6 sm:px-8 rounded-2xl border border-parchment-50/15 shadow-2xl space-y-6"
        >
          {/* Demo credential badge */}
          <div className="rounded-xl bg-teal/10 border border-teal/30 p-3.5 flex items-start justify-between gap-2">
            <div>
              <p className="font-sans text-xs font-semibold text-teal-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" /> Demo Admin Access
              </p>
              <p className="ticket-mono text-[11px] text-parchment-200/80 mt-1">
                ID: <span className="text-parchment-50 select-all font-bold">admin@globaltrotter.com</span>
              </p>
              <p className="ticket-mono text-[11px] text-parchment-200/80">
                Pass: <span className="text-parchment-50 select-all font-bold">admin#123</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs text-gold hover:text-gold/80 font-sans font-medium underline underline-offset-2 shrink-0 pt-0.5"
            >
              Fill Credentials
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-email" className="text-parchment-100 text-xs">Admin ID / Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment-200/50" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="admin@globaltrotter.com"
                  className="pl-10 bg-midnight-900/80 border-parchment-50/20 text-parchment-50 placeholder:text-parchment-200/40 focus-ring"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="admin-pass" className="text-parchment-100 text-xs">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment-200/50" />
                <Input
                  id="admin-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-midnight-900/80 border-parchment-50/20 text-parchment-50 placeholder:text-parchment-200/40 focus-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-200/50 hover:text-parchment-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-coral/15 border border-coral/30 p-2.5 flex items-center gap-2 text-xs text-coral-200"
              >
                <AlertCircle className="w-4 h-4 text-coral shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal hover:bg-teal-600 text-parchment-50 font-semibold shadow-lg transition-all"
            >
              {loading ? 'Authenticating…' : (
                <>
                  Enter Admin Portal <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-parchment-50/10">
            <Link
              to="/dashboard"
              className="font-sans text-xs text-parchment-200/60 hover:text-teal inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Traveler App
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
