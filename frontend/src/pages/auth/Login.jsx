import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';

import { AuthLayout }     from '../../layouts/AuthLayout';
import { AuthBrandPanel } from '../../components/auth/AuthBrandPanel';
import { AuthCard }       from '../../components/auth/AuthCard';
import { AuthInput }      from '../../components/auth/AuthInput';
import { PasswordInput }  from '../../components/auth/PasswordInput';
import { AuthButton }     from '../../components/auth/AuthButton';
import { GlobeTrotterLogo } from '../../components/ui/GlobeTrotterLogo';
import { useAuth }        from '../../hooks/useAuth';

/* Stagger variants for form fields */
const fieldV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.22 } },
};
const rowV = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 20 } },
};

/* Client-side validation */
function validate({ email, password }) {
  const e = {};
  if (!email.trim())   e.email = 'Email is required.';
  else if (email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    e.email = 'Enter a valid email address.';
  if (!password)       e.password = 'Password is required.';
  else if (password.length < 6) e.password = 'At least 6 characters required.';
  return e;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [form,        setForm]        = useState({ email: '', password: '' });
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name])   setErrors((er) => ({ ...er, [name]: '' }));
    if (serverError)    setServerError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const ve = validate(form);
    if (Object.keys(ve).length) { setErrors(ve); return; }

    const result = await login({ email: form.email, password: form.password });
    if (!result.success) setServerError(result.error);
    else navigate('/dashboard');
  };

  return (
    <AuthLayout leftPanel={<AuthBrandPanel mode="login" />}>
      <AuthCard>
        {/* ─ Logo ─ */}
        <motion.div
          className="card-logo"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
        >
          <GlobeTrotterLogo size="md" />
        </motion.div>

        {/* ─ Heading ─ */}
        <motion.div
          className="card-header"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.08, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="card-title">Welcome back</h2>
          <p className="card-subtitle">
            Continue planning your next adventure.
          </p>
        </motion.div>

        {/* ─ Form ─ */}
        <form onSubmit={onSubmit} noValidate>
          <motion.div className="form-stack" variants={fieldV} initial="hidden" animate="visible">

            {/* Email */}
            <motion.div variants={rowV}>
              <AuthInput
                id="login-email"
                name="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                icon={<Mail size={16} strokeWidth={1.75} />}
                value={form.email}
                onChange={onChange}
                error={errors.email}
                autoComplete="email"
                autoFocus
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={rowV}>
              <PasswordInput
                id="login-password"
                name="password"
                label="Password"
                placeholder="Enter your password"
                icon={<Lock size={16} strokeWidth={1.75} />}
                value={form.password}
                onChange={onChange}
                error={errors.password}
                autoComplete="current-password"
              />
            </motion.div>

            {/* Forgot password */}
            <motion.div variants={rowV} className="forgot-row">
              <button type="button" className="forgot-link">
                Forgot password?
              </button>
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
                Continue Journey
              </AuthButton>
            </motion.div>

          </motion.div>
        </form>

        {/* ─ Divider + Sign up ─ */}
        <div className="card-divider" />
        <div className="signup-row">
          Don't have an account?{' '}
          <Link to="/register" className="signup-link">
            Create your account
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
