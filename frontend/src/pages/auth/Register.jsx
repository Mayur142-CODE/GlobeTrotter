import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Globe, Lock, FileText } from 'lucide-react';

import { AuthLayout }     from '../../layouts/AuthLayout';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { AuthCard }       from '../../components/auth/AuthCard';
import { AuthInput }      from '../../components/auth/AuthInput';
import { PasswordInput }  from '../../components/auth/PasswordInput';
import { AuthButton }     from '../../components/auth/AuthButton';
import { ProfileUploader } from '../../components/auth/ProfileUploader';
import { GlobeTrotterLogo } from '../../components/ui/GlobeTrotterLogo';
import { useAuth }        from '../../hooks/useAuth';

const fieldV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.065, delayChildren: 0.18 } },
};
const rowV = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 18 } },
};

const phoneRx = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,14}$/;

function validate(form) {
  const e = {};
  if (!form.firstName.trim()) e.firstName = 'First name is required.';
  if (!form.lastName.trim())  e.lastName  = 'Last name is required.';
  if (!form.email.trim())     e.email     = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = 'Enter a valid email address.';
  if (form.phone && !phoneRx.test(form.phone)) e.phone = 'Enter a valid phone number.';
  if (!form.city.trim())    e.city    = 'City is required.';
  if (!form.country.trim()) e.country = 'Country is required.';
  if (!form.password)       e.password = 'Password is required.';
  else if (form.password.length < 8) e.password = 'Minimum 8 characters required.';
  if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
  else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
  return e;
}

const INIT = {
  photo: null, firstName: '', lastName: '',
  email: '', phone: '',
  city: '', country: '',
  password: '', confirmPassword: '',
  additionalInfo: '',
};

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [form,        setForm]        = useState(INIT);
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
    if (serverError)  setServerError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const ve = validate(form);
    if (Object.keys(ve).length) {
      setErrors(ve);
      const first = Object.keys(ve)[0];
      document.getElementById(`reg-${first}`)?.focus();
      return;
    }
    const { confirmPassword: _, photo: __, ...userData } = form;
    const result = await register(userData);
    if (!result.success) setServerError(result.error);
    else navigate('/login');
  };

  return (
    <AuthLayout leftPanel={<AuthBrandPanel mode="register" />}>
      {/* Register card is slightly wider — max-width managed inline so it doesn't break the grid */}
      <AuthCard>
        {/* ─ Logo ─ */}
        <motion.div
          className="card-logo"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
        >
          <GlobeTrotterLogo size="md" />
        </motion.div>

        {/* ─ Heading ─ */}
        <motion.div
          className="card-header"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.07, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="card-title">Create your account</h2>
          <p className="card-subtitle">Tell us a little about yourself.</p>
        </motion.div>

        {/* ─ Form ─ */}
        <form onSubmit={onSubmit} noValidate>
          <motion.div className="form-stack" variants={fieldV} initial="hidden" animate="visible">

            {/* Profile photo */}
            <motion.div variants={rowV} style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <ProfileUploader
                value={form.photo}
                onChange={(file) => setForm((f) => ({ ...f, photo: file }))}
                error={errors.photo}
              />
            </motion.div>

            {/* First Name + Last Name */}
            <motion.div variants={rowV} className="form-row">
              <AuthInput id="reg-firstName" name="firstName" type="text"
                label="First name" placeholder="Alex"
                icon={<User size={15} strokeWidth={1.75} />}
                value={form.firstName} onChange={onChange} error={errors.firstName}
                autoComplete="given-name" />
              <AuthInput id="reg-lastName" name="lastName" type="text"
                label="Last name" placeholder="Mercer"
                icon={<User size={15} strokeWidth={1.75} />}
                value={form.lastName} onChange={onChange} error={errors.lastName}
                autoComplete="family-name" />
            </motion.div>

            {/* Email + Phone */}
            <motion.div variants={rowV} className="form-row">
              <AuthInput id="reg-email" name="email" type="email"
                label="Email address" placeholder="you@example.com"
                icon={<Mail size={15} strokeWidth={1.75} />}
                value={form.email} onChange={onChange} error={errors.email}
                autoComplete="email" />
              <AuthInput id="reg-phone" name="phone" type="tel"
                label="Phone number" placeholder="+1 (312) 847-1928"
                icon={<Phone size={15} strokeWidth={1.75} />}
                value={form.phone} onChange={onChange} error={errors.phone}
                autoComplete="tel" />
            </motion.div>

            {/* City + Country */}
            <motion.div variants={rowV} className="form-row">
              <AuthInput id="reg-city" name="city" type="text"
                label="City" placeholder="Barcelona"
                icon={<MapPin size={15} strokeWidth={1.75} />}
                value={form.city} onChange={onChange} error={errors.city}
                autoComplete="address-level2" />
              <AuthInput id="reg-country" name="country" type="text"
                label="Country" placeholder="Spain"
                icon={<Globe size={15} strokeWidth={1.75} />}
                value={form.country} onChange={onChange} error={errors.country}
                autoComplete="country-name" />
            </motion.div>

            {/* Password + Confirm */}
            <motion.div variants={rowV} className="form-row">
              <PasswordInput id="reg-password" name="password"
                label="Password" placeholder="Min. 8 characters"
                icon={<Lock size={15} strokeWidth={1.75} />}
                value={form.password} onChange={onChange} error={errors.password}
                autoComplete="new-password" />
              <PasswordInput id="reg-confirmPassword" name="confirmPassword"
                label="Confirm password" placeholder="Repeat password"
                icon={<Lock size={15} strokeWidth={1.75} />}
                value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword}
                autoComplete="new-password" />
            </motion.div>

            {/* Additional information */}
            <motion.div variants={rowV} className="auth-field">
              <label htmlFor="reg-additionalInfo" className="auth-label">
                Additional information
              </label>
              <textarea
                id="reg-additionalInfo"
                name="additionalInfo"
                className="auth-textarea"
                rows={3}
                placeholder="Share your travel interests, dream destinations, travel style…"
                value={form.additionalInfo}
                onChange={onChange}
                aria-label="Additional information about your travel preferences"
              />
            </motion.div>

            {/* Server error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  role="alert"
                  className="server-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <motion.div variants={rowV} style={{ marginTop: '4px' }}>
              <AuthButton type="submit" loading={loading} showArrow>
                Start My Journey
              </AuthButton>
            </motion.div>

          </motion.div>
        </form>

        {/* ─ Sign in link ─ */}
        <div className="card-divider" />
        <div className="signup-row">
          Already have an account?{' '}
          <Link to="/login" className="signup-link">Sign in</Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
