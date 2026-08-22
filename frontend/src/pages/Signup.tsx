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
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signup } from '@/services/authService';
import { getCountries, searchCities } from '@/services/locationService';
import { LocationCombobox, type ComboboxOption } from '@/components/shared/LocationCombobox';
import type { Country, CityLocation } from '@/types/location';

export default function Signup() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
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
  const [isSuccess, setIsSuccess] = useState(false);

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
    // Reset previously selected city when country changes
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
    if (!pass) return { score: 0, label: '', color: '' };
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

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image too large', description: 'Please select an image under 5MB.', variant: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!email.trim()) {
      e.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address';
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
    try {
      await signup({
        name: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        countryId: selectedCountry?.id || undefined,
        country: selectedCountry?.name || undefined,
        cityId: selectedCity?.id || undefined,
        city: selectedCity?.name || undefined,
        additionalInfo: additionalInfo.trim(),
        avatarUrl: photoPreview || undefined,
        password,
      });

      setIsSuccess(true);
      toast({
        title: 'Welcome to GlobeTrotter!',
        description: 'Your adventure begins now.',
        variant: 'success',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch {
      toast({ title: 'Registration failed', description: 'Please check your details and try again.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

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
          <p className="font-sans text-sm text-parchment-100/60 mt-1">
            Personalize your profile and start crafting multi-city adventures
          </p>
        </div>

        {/* Boarding Pass Form Card */}
        <div className="boarding-pass p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-teal/15 flex items-center justify-center mx-auto text-teal">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-semibold text-midnight">Welcome to GlobeTrotter!</h2>
                  <p className="font-sans text-sm text-ink/70 max-w-md mx-auto">
                    Your account is ready. Let's start planning your next adventure. Redirecting to your dashboard...
                  </p>
                </div>
                <div className="pt-4 flex justify-center">
                  <Button onClick={() => navigate('/dashboard')} size="lg" className="inline-flex items-center gap-2">
                    <span>Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                noValidate
                className="space-y-6"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
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
                      Upload your picture for your personalized travel passport (PNG, JPG up to 5MB)
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
                          onClick={() => setPhotoPreview('')}
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
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Aarav"
                        className="pl-10"
                        aria-invalid={!!errors.firstName}
                        aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                      />
                    </div>
                    {errors.firstName && (
                      <p id="firstName-error" className="font-sans text-xs text-coral mt-1.5">{errors.firstName}</p>
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
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Mehta"
                        className="pl-10"
                        aria-invalid={!!errors.lastName}
                        aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                      />
                    </div>
                    {errors.lastName && (
                      <p id="lastName-error" className="font-sans text-xs text-coral mt-1.5">{errors.lastName}</p>
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
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="traveler@example.com"
                        className="pl-10"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                    {errors.email && (
                      <p id="email-error" className="font-sans text-xs text-coral mt-1.5">{errors.email}</p>
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
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
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
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="password-error" className="font-sans text-xs text-coral mt-1.5">{errors.password}</p>
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
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="pl-10 pr-10"
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
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
                      <p id="confirm-error" className="font-sans text-xs text-coral mt-1.5">{errors.confirmPassword}</p>
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
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating your journey...
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
