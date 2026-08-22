import React from 'react';
import { Globe } from 'lucide-react';

export function GlobeTrotterLogo({ size = 'md', className = '' }) {
  const sizes = {
    sm: { icon: 14, box: 28, text: '15px', radius: '7px' },
    md: { icon: 16, box: 34, text: '18px', radius: '9px' },
    lg: { icon: 20, box: 42, text: '22px', radius: '11px' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className={`gt-logo ${className}`}
      style={{ gap: '9px' }}
    >
      <div
        className="gt-logo-icon"
        style={{ width: s.box, height: s.box, borderRadius: s.radius, flexShrink: 0 }}
      >
        <Globe size={s.icon} color="#22d3ee" strokeWidth={2} aria-hidden="true" />
      </div>
      <span className="gt-logo-text" style={{ fontSize: s.text }}>
        Globe<span>Trotter</span>
      </span>
    </div>
  );
}
