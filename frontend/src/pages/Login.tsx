import { useState, type FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Mail, Lock, ArrowRight, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { signIn } = useAuth();
  const { adminLogin } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) {
      e.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = 'Please enter a valid email address.';
    }
    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 6) {
      e.password = 'Password must be at least 6 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check if attempting Demo Admin Login
    if (cleanEmail === 'admin@globaltrotter.com') {
      try {
        const isAdmin = await adminLogin(cleanEmail, cleanPassword);
        if (isAdmin) {
          toast({
            title: 'Admin Access Granted',
            description: 'Welcome to GlobeTrotter Admin Console.',
            variant: 'success',
          });
          const adminTarget = from.startsWith('/admin') ? from : '/admin';
          navigate(adminTarget, { replace: true });
          return;
        } else {
          setErrors({ general: 'Invalid admin credentials.' });
          toast({
            title: 'Sign in failed',
            description: 'Invalid admin credentials.',
            variant: 'error',
          });
          return;
        }
      } catch (err: any) {
        setErrors({ general: 'Admin login error.' });
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Normal Traveler Login with Supabase
    try {
      const { isVerified } = await signIn(email, password);

      if (!isVerified) {
        sessionStorage.setItem('globetrotter_pending_verification_email', email.trim());
        toast({
          title: 'Email verification required',
          description: 'Please confirm your email address before accessing GlobeTrotter.',
          variant: 'default',
        });
        navigate('/verify-email', { state: { email: email.trim() } });
        return;
      }

      sessionStorage.removeItem('globetrotter_pending_verification_email');
      toast({
        title: 'Welcome back!',
        description: 'Your journey continues.',
        variant: 'success',
      });

      const normalTarget = from.startsWith('/admin') ? '/dashboard' : from;
      navigate(normalTarget, { replace: true });
    } catch (err: any) {
      const errorMessage = err?.message || 'Email or password is incorrect.';
      if (errorMessage.toLowerCase().includes('not confirmed') || errorMessage.toLowerCase().includes('verify')) {
        sessionStorage.setItem('globetrotter_pending_verification_email', email.trim());
      }
      setErrors({ general: errorMessage });
      toast({
        title: 'Sign in failed',
        description: errorMessage,
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
          <h1 className="font-serif text-2xl font-semibold text-parchment-50">Welcome back, traveler</h1>
          <p className="font-sans text-xs text-parchment-100/60 mt-1">Sign in to continue your journey</p>
        </div>

        <div className="boarding-pass p-6 sm:p-8 shadow-2xl">
          {errors.general && (
            <div className="mb-4 p-3 rounded-lg bg-coral/10 border border-coral/30 text-xs font-sans text-coral">
              {errors.general}
              {(errors.general.toLowerCase().includes('verify') || errors.general.toLowerCase().includes('confirmed')) && (
                <div className="mt-1.5 pt-1.5 border-t border-coral/20">
                  <Link to="/verify-email" className="font-semibold text-teal hover:underline">
                    Go to verification page →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="traveler@example.com"
                  className="pl-10"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && <p id="email-error" className="font-sans text-xs text-coral mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus-ring rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="font-sans text-xs text-coral mt-1.5">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-parchment-300 text-teal focus:ring-teal"
                />
                <span className="font-sans text-ink/70">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="font-sans text-teal hover:underline focus-ring rounded"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-dashed border-parchment-300 text-center">
            <p className="font-sans text-xs text-ink/60">
              New to GlobeTrotter?{' '}
              <Link to="/signup" className="font-semibold text-teal hover:underline focus-ring rounded">
                Create your account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
