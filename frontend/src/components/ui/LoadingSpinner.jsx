import React from 'react';
import { motion } from 'framer-motion';

/**
 * LoadingSpinner
 * Subtle aurora-styled spinner for button loading states.
 */
export function LoadingSpinner({ size = 18, className = '' }) {
  return (
    <motion.span
      className={`inline-block rounded-full border-2 border-white/20 border-t-cyan-400 ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      aria-hidden="true"
    />
  );
}
