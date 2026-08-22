import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // Password strength calculator
  function getPasswordStrength(pass: string) {
    if (!pass) return { score: 0, label: '', color: '', text: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-coral', text: 'text-coral' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-teal', text: 'text-teal' };
      case 4:
      default:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
    }
  }

  const passwordStrength = getPasswordStrength(password);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!password) {
      e.password = 'New password is required';
    } else if (password.length < 6) {
      e.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your new password';
    } else if (password !== confirmPassword) {
      e.confirmPassword = "Passwords don't match.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      toast({
        title: 'Password updated!',
        description: 'You can now sign in with your new password.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message || 'Please request a new password reset link.',
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
          <h1 className="font-serif text-2xl font-semibold text-parchment-50">Set new password</h1>
          <p className="font-sans text-xs text-parchment-100/60 mt-1">Create a secure password for your traveler account</p>
        </div>

        <div className="boarding-pass p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal/15 flex items-center justify-center mx-auto text-teal">
                <CheckCircle2 className="w-7 h-7" aria-hidden />
              </div>
              <h2 className="font-serif text-xl font-semibold text-midnight">Password updated successfully!</h2>
              <p className="font-sans text-xs text-ink/60 max-w-xs mx-auto">
                Your password has been changed. You can now continue your journey with your new credentials.
              </p>
              <div className="pt-3">
                <Button onClick={() => navigate('/login')} size="lg" className="w-full inline-flex items-center justify-center gap-2">
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pl-10 pr-10"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="font-sans text-xs text-coral mt-1.5">{errors.password}</p>
                )}

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink/60">Strength</span>
                      <span className={`font-semibold ${passwordStrength.text}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-parchment-300/50 rounded-full overflow-hidden">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-full transition-all duration-300 ${
                            level <= passwordStrength.score ? passwordStrength.color : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                  <Input
                    id="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="pl-10 pr-10"
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal rounded p-1 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="font-sans text-xs text-coral mt-1.5">{errors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                {loading ? 'Updating password…' : 'Update Password'}
              </Button>

              <div className="mt-5 pt-4 border-t border-dashed border-parchment-300 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-teal hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
