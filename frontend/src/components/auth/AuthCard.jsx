import React from 'react';
import { motion } from 'framer-motion';

/**
 * AuthCard — double-bezel glass card container
 * Outer shell + inner core = physical premium glass feel
 */
export function AuthCard({ children, style = {} }) {
  return (
    <motion.div
      className="glass-shell"
      style={style}
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.08 }}
    >
      <div className="glass-core">
        {children}
      </div>
    </motion.div>
  );
}
