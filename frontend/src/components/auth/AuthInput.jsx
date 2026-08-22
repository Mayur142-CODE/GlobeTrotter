import React from 'react';
import { motion } from 'framer-motion';

export function AuthInput({
  id,
  label,
  icon,
  error,
  className = '',
  ...rest
}) {
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
          className={`auth-input ${error ? 'has-error' : ''} ${className}`}
          style={!icon ? { paddingLeft: '16px' } : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
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
