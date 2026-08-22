import React, { memo } from 'react';
import { motion } from 'framer-motion';

/* ── Memoized atmospheric blob — isolated to prevent parent re-renders ── */
const Blob = memo(function Blob({ top, left, right, bottom, size, color, dx, dy, duration, delay }) {
  return (
    <div
      className="atm-layer"
      style={{
        top, left, right, bottom,
        width: size, height: size,
        background: color,
        '--dx': dx, '--dy': dy, '--ds': '1.06',
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
      aria-hidden="true"
    />
  );
});

/* ── Particle stars — pure CSS, zero JS overhead ── */
const Stars = memo(function Stars() {
  const pts = Array.from({ length: 38 }, (_, i) => ({
    id: i,
    left: `${(i * 37 + 11) % 100}%`,
    top:  `${(i * 59 + 7)  % 100}%`,
    size: i % 5 === 0 ? 2 : 1,
    dur:  `${3 + (i % 5)}s`,
    del:  `${(i * 0.6) % 5}s`,
  }));

  return (
    <div
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      {pts.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            borderRadius: '50%',
            background: '#fff',
            animation: `star-pulse ${p.dur} ${p.del} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
});

/**
 * AuthLayout
 * Master page wrapper — provides the atmospheric background + grid container.
 * The grid layout (.auth-inner) lives in CSS for proper breakpoint control.
 */
export function AuthLayout({ leftPanel, children }) {
  return (
    <div className="auth-page">
      {/* ── Atmospheric background ── */}

      {/* Blobs */}
      <Blob top="-18%" left="-8%"  size="56vw" color="radial-gradient(circle, rgba(34,211,238,0.11) 0%, transparent 70%)"
            dx="44px" dy="36px" duration={22} delay={0} />
      <Blob bottom="-15%" right="-6%" size="50vw" color="radial-gradient(circle, rgba(124,58,237,0.09) 0%, transparent 70%)"
            dx="-40px" dy="-30px" duration={26} delay={4} />
      <Blob top="25%" left="38%" size="36vw" color="radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)"
            dx="28px" dy="-22px" duration={18} delay={8} />

      {/* Grid texture */}
      <div className="atm-grid" aria-hidden="true" />

      {/* Stars */}
      <Stars />

      {/* Grain */}
      <div className="atm-grain" aria-hidden="true" />

      {/* ── Main grid ── */}
      <div className="auth-inner">
        {/* Left — brand/hero */}
        <motion.div
          className="auth-hero"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.05 }}
        >
          {leftPanel}
        </motion.div>

        {/* Right — auth form */}
        <motion.div
          className="auth-form-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
