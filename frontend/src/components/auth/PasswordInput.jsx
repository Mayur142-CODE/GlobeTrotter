import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export function PasswordInput({ id, label, icon, error, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      {label && (
        <label htmlFor={id} className="auth-label">
          {label}
        </label>
      )}
      <div className="auth-input-wrap">
        {icon && (
          <span className="auth-input-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`auth-input has-right ${error ? 'has-error' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        <button
          type="button"
          className="auth-input-right"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-controls={id}
        >
          {visible
            ? <EyeOff size={16} strokeWidth={1.75} />
            : <Eye    size={16} strokeWidth={1.75} />
          }
        </button>
      </div>
      {error && (
        <motion.p
          id={`${id}-error`}
          role="alert"
          className="auth-field-error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
