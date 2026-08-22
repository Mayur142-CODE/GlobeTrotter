import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Globe, Navigation, Compass, MapPin } from 'lucide-react';

/* ──────────────────────────────────────────────────────
   GLOBE VISUAL
   Large SVG globe ~420px with animated route + destination
   dots + subtle rotation of the route path
────────────────────────────────────────────────────── */
const GlobeVisual = memo(function GlobeVisual() {
  return (
    <div className="globe-container">
      {/* Ambient glow behind globe */}
      <div style={{
        position: 'absolute', inset: '-12%',
        background: 'radial-gradient(ellipse at 45% 45%, rgba(34,211,238,0.09) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} aria-hidden="true" />

      <svg
        viewBox="0 0 420 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Animated travel globe visualization"
        role="img"
      >
        <defs>
          <radialGradient id="globeFill" cx="38%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="#1e40af" stopOpacity="0.22" />
            <stop offset="55%"  stopColor="#0c1a3a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#020510" stopOpacity="0.08" />
          </radialGradient>

          <radialGradient id="rimLight" cx="30%" cy="28%" r="72%">
            <stop offset="0%"  stopColor="#22d3ee" stopOpacity="0.0" />
            <stop offset="85%" stopColor="#22d3ee" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.28" />
          </radialGradient>

          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
          </linearGradient>

          <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id="globeClip">
            <circle cx="210" cy="210" r="165" />
          </clipPath>
        </defs>

        {/* ── Sphere fill ── */}
        <circle cx="210" cy="210" r="165" fill="url(#globeFill)" />
        <circle cx="210" cy="210" r="165" fill="url(#rimLight)" />

        {/* ── Outline ── */}
        <circle cx="210" cy="210" r="165"
          stroke="rgba(34,211,238,0.18)" strokeWidth="1" fill="none" />

        {/* ── Latitude lines (inside clip) ── */}
        <g clipPath="url(#globeClip)" opacity="0.35">
          {[0.18, 0.35, 0.5, 0.65, 0.82].map((t, i) => {
            const ry = Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)) * 165;
            const cy = 45 + t * 330;
            return (
              <ellipse key={i} cx="210" cy={cy} rx={ry} ry={ry * 0.14}
                stroke="rgba(34,211,238,0.35)" strokeWidth="0.7" fill="none" />
            );
          })}
        </g>

        {/* ── Longitude arcs (inside clip) ── */}
        <g clipPath="url(#globeClip)" opacity="0.28">
          {[0, 30, 60, 90, 120, 150].map((angle, i) => (
            <ellipse key={i} cx="210" cy="210" rx={Math.abs(Math.cos((angle * Math.PI) / 180)) * 165} ry="165"
              stroke="rgba(34,211,238,0.30)" strokeWidth="0.7" fill="none"
              transform={`rotate(${angle}, 210, 210)`} />
          ))}
        </g>

        {/* ── Animated dashed route ── */}
        <motion.path
          d="M 110 280 C 140 180 200 160 255 185 C 305 210 330 155 360 120"
          stroke="url(#routeGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 8"
          fill="none"
          filter="url(#glowFilter)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, delay: 0.8, ease: [0.32, 0.72, 0, 1] }}
        />

        {/* ── Destination nodes ── */}
        {[
          { cx: 110, cy: 280, label: 'Origin' },
          { cx: 255, cy: 185, label: 'Waypoint' },
          { cx: 360, cy: 120, label: 'Destination' },
        ].map(({ cx, cy }, i) => (
          <motion.g
            key={i}
            filter="url(#glowFilter)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2 + i * 0.3, type: 'spring', stiffness: 200 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          >
            {/* Outer pulse ring */}
            <motion.circle cx={cx} cy={cy} r="14"
              fill="rgba(34,211,238,0.08)"
              stroke="rgba(34,211,238,0.25)" strokeWidth="1"
              animate={{ r: [12, 18, 12], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2.8 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Core dot */}
            <circle cx={cx} cy={cy} r="5" fill="#22d3ee" />
          </motion.g>
        ))}

        {/* ── Continents (simplified outlines as decorative paths) ── */}
        <g clipPath="url(#globeClip)" opacity="0.10" fill="rgba(34,211,238,0.6)">
          {/* Simplified land mass hints */}
          <path d="M 130 170 L 145 155 L 165 160 L 170 175 L 155 185 Z" />
          <path d="M 220 140 L 250 130 L 265 145 L 260 165 L 235 162 Z" />
          <path d="M 280 240 L 310 235 L 325 252 L 310 265 L 285 258 Z" />
          <path d="M 155 245 L 175 240 L 182 255 L 165 265 Z" />
        </g>
      </svg>

      {/* ── Floating location chip (absolutely positioned relative to globe-container) ── */}
      <motion.div
        className="globe-chip"
        style={{ top: '12%', right: '-8%' }}
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <MapPin size={12} color="#f97316" strokeWidth={2} aria-hidden="true" />
        <span>Santorini, GR</span>
      </motion.div>

      <motion.div
        className="globe-chip"
        style={{ bottom: '20%', left: '-6%' }}
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      >
        <span className="chip-dot" aria-hidden="true" />
        <span>Kyoto, JP</span>
      </motion.div>

      <motion.div
        className="globe-chip"
        style={{ top: '52%', right: '-12%' }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <span className="chip-dot" aria-hidden="true" style={{ background: '#818cf8' }} />
        <span>Marrakech, MA</span>
      </motion.div>
    </div>
  );
});

/* ── Stagger animation variants ── */
const containerV = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};

const itemV = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 110, damping: 18 } },
};

const stats = [
  { icon: <Globe size={14} strokeWidth={2} />, label: '120+ Destinations' },
  { icon: <Navigation size={14} strokeWidth={2} />, label: 'Plan · Explore · Share' },
  { icon: <Compass size={14} strokeWidth={2} />, label: 'Smart Itineraries' },
];

/* ── Heading data ── */
const headings = {
  login: [
    { text: 'Your next', grad: false },
    { text: 'journey', grad: true },
    { text: 'starts here.', grad: false },
  ],
  register: [
    { text: "Let's plan", grad: false },
    { text: 'somewhere', grad: false },
    { text: 'unforgettable.', grad: true },
  ],
};

const subtext = {
  login:    'Plan unforgettable journeys across cities, cultures, and experiences — all in one place.',
  register: 'Create your GlobeTrotter profile and start building journeys that are uniquely yours.',
};

export function AuthBrandPanel({ mode = 'login' }) {
  const lines = headings[mode] || headings.login;

  return (
    <motion.div
      variants={containerV}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}
    >
      {/* Eyebrow tag */}
      <motion.div variants={itemV}>
        <div className="hero-eyebrow">
          <Globe size={10} strokeWidth={2.5} aria-hidden="true" />
          GlobeTrotter
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1 className="hero-heading" variants={itemV}>
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {line.grad
              ? <span className="grad-word">{line.text}</span>
              : line.text
            }
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </motion.h1>

      {/* Description */}
      <motion.p className="hero-desc" variants={itemV}>
        {subtext[mode]}
      </motion.p>

      {/* Globe visual */}
      <motion.div variants={itemV}>
        <GlobeVisual />
      </motion.div>

      {/* Stat chips */}
      <motion.div className="stat-row" variants={itemV}>
        {stats.map((s, i) => (
          <div key={i} className="stat-chip">
            {s.icon}
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
