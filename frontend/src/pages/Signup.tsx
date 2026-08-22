import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  User as UserIcon,
  Mail,
  Lock,
  Phone,
  MapPin,
  Globe,
  Camera,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCountries, searchCities } from '@/services/locationService';
import { LocationCombobox, type ComboboxOption } from '@/components/shared/LocationCombobox';
import type { Country, CityLocation } from '@/types/location';

export default function Signup() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signUp, resendVerificationEmail } = useAuth();

  // Form Fields
  const [photoFile, setPhotoFile] = useState<File | Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Location States
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>(null);
  const [countriesList, setCountriesList] = useState<Country[]>([]);
  const [citiesList, setCitiesList] = useState<CityLocation[]>([]);

  // Location Loading & Error states
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const [additionalInfo, setAdditionalInfo] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Verification State (post signup)
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Load countries on mount
  const fetchCountries = async () => {
    setLoadingCountries(true);
    setCountriesError(null);
    try {
      const data = await getCountries();
      setCountriesList(data);
    } catch {
      setCountriesError('Unable to load countries.');
    } finally {
      setLoadingCountries(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Fetch initial cities whenever country changes
  useEffect(() => {
    if (!selectedCountry) {
      setCitiesList([]);
      setSelectedCity(null);
      return;
    }

    let isMounted = true;
    const fetchCountryCities = async () => {
      setLoadingCities(true);
      setCitiesError(null);
      try {
        const cities = await searchCities(selectedCountry.id, '');
        if (isMounted) {
          setCitiesList(cities);
        }
      } catch {
        if (isMounted) {
          setCitiesError('Unable to load cities.');
        }
      } finally {
        if (isMounted) {
          setLoadingCities(false);
        }
      }
    };

    fetchCountryCities();

    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  // Handle dynamic city search within selected country
  const handleCitySearchChange = async (query: string) => {
    if (!selectedCountry) return;
    setLoadingCities(true);
    setCitiesError(null);
    try {
      const results = await searchCities(selectedCountry.id, query);
      setCitiesList(results);
    } catch {
      setCitiesError('Unable to search cities.');
    } finally {
      setLoadingCities(false);
    }
  };

  // Handle country selection
  const handleCountrySelect = (option: ComboboxOption) => {
    const matched = countriesList.find((c) => c.id === option.id) || null;
    setSelectedCountry(matched);
    setSelectedCity(null);
    if (errors.country) {
      setErrors((prev) => ({ ...prev, country: '' }));
    }
  };

  // Handle city selection
  const handleCitySelect = (option: ComboboxOption) => {
    const matched = citiesList.find((c) => c.id === option.id) || {
      id: option.id,
      name: option.name,
      countryId: selectedCountry?.id || '',
      countryName: selectedCountry?.name || '',
      state: option.sublabel,
    };
    setSelectedCity(matched);
    if (errors.city) {
      setErrors((prev) => ({ ...prev, city: '' }));
    }
  };

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

  // Resize and compress photo locally before preview/upload
  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Image too large', description: 'Please select an image under 10MB.', variant: 'error' });
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setPhotoFile(blob);
                const compressedUrl = URL.createObjectURL(blob);
                setPhotoPreview(compressedUrl);
              } else {
                setPhotoFile(file);
                setPhotoPreview(objectUrl);
              }
            },
            'image/jpeg',
            0.8
          );
        } else {
          setPhotoFile(file);
          setPhotoPreview(objectUrl);
        }
      };
      img.src = objectUrl;
    }
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';

    // Strict email validation
    if (!email.trim()) {
      e.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      e.email = 'Please enter a valid email address.';
    }

    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 6) {
      e.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      e.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      e.confirmPassword = "Passwords don't match.";
    }

    if (!agreeTerms) {
      e.terms = 'Please accept the Terms of Service & Privacy Policy to continue.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const { isVerified } = await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        countryId: selectedCountry?.id,
        country: selectedCountry?.name,
        cityId: selectedCity?.id,
        city: selectedCity?.name,
        additionalInfo: additionalInfo.trim(),
        avatarFile: photoFile,
        password,
      });

      setRegisteredEmail(email.trim());

      if (isVerified) {
        toast({
          title: 'Welcome to GlobeTrotter!',
          description: 'Your passport is ready.',
          variant: 'success',
        });
        navigate('/dashboard');
      } else {
        setVerificationPending(true);
        toast({
          title: 'Verification email sent ✈️',
          description: `Please verify your email address to activate your account.`,
          variant: 'success',
        });
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed. Please try again.';
      setErrors({ general: errorMessage });
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    try {
      await resendVerificationEmail(registeredEmail);
      setCooldown(60);
      toast({
        title: 'Verification email sent!',
        description: `Check your inbox at ${registeredEmail}.`,
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

  // Format options for Country Combobox
  const countryOptions: ComboboxOption[] = countriesList.map((c) => ({
    id: c.id,
    name: c.name,
    flag: c.flag,
    sublabel: c.region,
  }));

  // Format options for City Combobox
  const cityOptions: ComboboxOption[] = citiesList.map((c) => ({
    id: c.id,
    name: c.name,
    sublabel: c.state,
    icon: <MapPin className="w-3.5 h-3.5" />,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-11 h-11 rounded-xl bg-teal flex items-center justify-center shadow-md">
              <Plane className="w-6 h-6 text-parchment-50" aria-hidden />
            </div>
            <span className="font-serif text-2xl font-semibold text-parchment-50 tracking-tight">GlobeTrotter</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-parchment-50">Create your traveler passport</h1>
          <p className="font-sans text-xs sm:text-sm text-parchment-100/60 mt-1">
            Personalize your profile and start crafting multi-city adventures
          </p>
        </div>

        {/* Boarding Pass Form Card */}
        <div className="boarding-pass p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {verificationPending ? (
              <motion.div
                key="verification-pending"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-6 text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-teal/15 flex items-center justify-center mx-auto text-teal">
                  <Mail className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-semibold text-midnight">Check your inbox ✈️</h2>
                  <p className="font-sans text-xs text-ink/70 max-w-md mx-auto leading-relaxed">
                    Your traveler passport is almost ready! We've sent a verification link to:
                  </p>
                  <p className="font-mono text-xs font-semibold text-teal bg-teal/10 py-1.5 px-3 rounded-md inline-block max-w-full truncate">
                    {registeredEmail}
                  </p>
                  <p className="font-sans text-xs text-ink/60 max-w-sm mx-auto pt-1">
                    Verify your email address to activate your account and start planning your next journey.
                  </p>
                </div>

                <div className="pt-3 space-y-3 max-w-sm mx-auto">
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
                        Sending link...
                      </span>
                    ) : cooldown > 0 ? (
                      `Resend available in ${cooldown}s`
                    ) : (
                      'Resend verification email'
                    )}
                  </Button>

                  <Link to="/login" className="block w-full">
                    <Button variant="default" size="lg" className="w-full text-xs inline-flex items-center justify-center gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {errors.general && (
                  <div className="p-3 rounded-lg bg-coral/10 border border-coral/30 text-xs font-sans text-coral flex items-start gap-2">
                    <div className="flex-1">
                      <span>{errors.general}</span>
                      {errors.general.includes('already associated') && (
                        <div className="mt-1 flex gap-3 text-teal font-semibold">
                          <Link to="/login" className="hover:underline">Sign In</Link>
                          <Link to="/forgot-password" className="hover:underline">Forgot Password?</Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Profile Photo Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 rounded-xl bg-parchment-200/50 border border-parchment-300/60">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-teal bg-parchment-100 flex items-center justify-center shadow-inner">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-9 h-9 text-ink/30" />
                      )}
                    </div>
                    <div
                      className="absolute inset-0 rounded-full bg-midnight/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Upload profile photo"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Label className="text-sm font-semibold text-ink">Profile Photo</Label>
                      <span className="text-[11px] text-ink/50">(Optional)</span>
                    </div>
                    <p className="text-xs text-ink/60 mt-0.5 mb-2">
                      Upload your picture for your personalized travel passport (PNG, JPG up to 10MB)
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs h-8"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1" />
                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      {photoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPhotoPreview('');
                            setPhotoFile(null);
                          }}
                          className="text-xs h-8 text-coral hover:text-coral hover:bg-coral/10"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      aria-label="Profile photo file input"
                    />
                  </div>
                </div>

                {/* Grid Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <div className="relative mt-1">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
                        }}
                        placeholder="Aarav"
                        className="pl-10"
                        aria-invalid={!!errors.firstName}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="font-sans text-xs text-coral mt-1.5">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <div className="relative mt-1">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
                        }}
                        placeholder="Mehta"
                        className="pl-10"
                        aria-invalid={!!errors.lastName}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="font-sans text-xs text-coral mt-1.5">{errors.lastName}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
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
                      />
                    </div>
                    {errors.email && (
                      <p className="font-sans text-xs text-coral mt-1.5">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <Label htmlFor="password">Password *</Label>
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

                  {/* Confirm Password */}
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" aria-hidden />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        }}
                        placeholder="Re-enter your password"
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

                  {/* Country (Searchable Combobox) */}
                  <div>
                    <Label htmlFor="country-select">Country</Label>
                    <div className="mt-1">
                      <LocationCombobox
                        id="country-select"
                        placeholder="Select your country"
                        searchPlaceholder="Search countries..."
                        options={countryOptions}
                        value={selectedCountry?.id || ''}
                        onChange={handleCountrySelect}
                        loading={loadingCountries}
                        loadingText="Loading countries..."
                        error={countriesError}
                        onRetry={fetchCountries}
                        icon={<Globe className="w-4 h-4" />}
                        errorText={errors.country}
                      />
                    </div>
                    {errors.country && (
                      <p className="font-sans text-xs text-coral mt-1.5">{errors.country}</p>
                    )}
                  </div>

                  {/* City (Searchable Combobox dependent on Country) */}
                  <div>
                    <Label htmlFor="city-select">City</Label>
                    <div className="mt-1">
                      <LocationCombobox
                        id="city-select"
                        placeholder="Search your city..."
                        searchPlaceholder="Search city name..."
                        disabled={!selectedCountry}
                        disabledPlaceholder="Select a country first"
                        options={cityOptions}
                        value={selectedCity?.id || ''}
                        onChange={handleCitySelect}
                        onSearchChange={handleCitySearchChange}
                        loading={loadingCities}
                        loadingText="Searching cities..."
                        error={citiesError}
                        onRetry={() => selectedCountry && handleCitySearchChange('')}
                        icon={<MapPin className="w-4 h-4" />}
                        errorText={errors.city}
                      />
                    </div>
                    {errors.city && (
                      <p className="font-sans text-xs text-coral mt-1.5">{errors.city}</p>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="additionalInfo">Additional Information</Label>
                    <span className="text-xs text-ink/40">Travel styles, preferences, dietary</span>
                  </div>
                  <Textarea
                    id="additionalInfo"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Tell us about your favorite destinations, travel style, or requirements (e.g. cultural explorer, vegetarian, loves hiking)..."
                    className="mt-1 min-h-[85px] text-sm"
                  />
                </div>

                {/* Terms of Service Checkbox */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={agreeTerms}
                      onClick={() => setAgreeTerms((prev) => !prev)}
                      className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                        agreeTerms
                          ? 'bg-teal border-teal text-white'
                          : 'border-midnight/30 bg-parchment-50 group-hover:border-teal'
                      }`}
                      aria-label="Agree to terms and privacy policy"
                    >
                      {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className="font-sans text-xs text-ink/70 leading-relaxed group-hover:text-ink transition-colors">
                      I agree to the{' '}
                      <span className="text-teal font-medium hover:underline">Terms of Service</span> and{' '}
                      <span className="text-teal font-medium hover:underline">Privacy Policy</span>.
                    </span>
                  </label>
                  {errors.terms && <p className="font-sans text-xs text-coral mt-1.5">{errors.terms}</p>}
                </div>

                {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating your passport...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <span>Start My Journey</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                {/* Already have an account */}
                <div className="pt-4 border-t border-dashed border-parchment-300 text-center">
                  <p className="font-sans text-sm text-ink/60">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-teal hover:text-teal-dark hover:underline transition-all">
                      Sign in
                    </Link>
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
