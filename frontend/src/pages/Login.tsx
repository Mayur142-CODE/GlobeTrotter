import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Mail, Lock, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { login } from '@/services/authService';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) {
      e.email = 'Username or email is required';
    } else if (email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address';
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
    try {
      await login(email, password);
      toast({ title: 'Welcome back!', description: 'You are now signed in.', variant: 'success' });
      navigate('/dashboard');
    } catch {
      toast({ title: 'Sign-in failed', description: 'Please check your credentials and try again.', variant: 'error' });
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
          <p className="font-sans text-sm text-parchment-100/60 mt-1">Sign in to continue your journey</p>
        </div>

        <div className="boarding-pass p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <Label htmlFor="email">Username or Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded p-1 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden />
                  )}
                </button>
              </div>
              {errors.password && <p id="password-error" className="font-sans text-xs text-coral mt-1.5">{errors.password}</p>}
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe((prev) => !prev)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    rememberMe
                      ? 'bg-teal border-teal text-white'
                      : 'border-midnight/30 bg-parchment-50 group-hover:border-teal'
                  }`}
                  aria-label="Remember me on this device"
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span className="font-sans text-xs text-ink/70 group-hover:text-ink transition-colors">
                  Remember me
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="font-sans text-xs text-teal/80 hover:text-teal font-medium hover:underline transition-colors text-right"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Continue Journey'}
              {!loading && <ArrowRight className="w-4 h-4" aria-hidden />}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-dashed border-parchment-300 text-center">
            <p className="font-sans text-sm text-ink/60">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-teal hover:text-teal-dark hover:underline transition-all"
              >
                Create your account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

