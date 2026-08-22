import React from 'react';
import { Globe, Map, Compass } from 'lucide-react';
import { GlobeTrotterLogo } from '../components/ui/GlobeTrotterLogo';

/**
 * Dashboard — placeholder page.
 * Shown after successful mock login/register.
 * Replace with real dashboard when the full app is built.
 */
export default function Dashboard() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center text-white"
      style={{ background: 'linear-gradient(135deg, #03040A 0%, #060B1A 100%)' }}
    >
      <div className="text-center max-w-md px-6">
        <GlobeTrotterLogo size="lg" className="justify-center mb-8" />

        <div className="flex justify-center gap-6 mb-8 text-slate-600">
          <Globe size={28} strokeWidth={1.5} />
          <Map size={28} strokeWidth={1.5} />
          <Compass size={28} strokeWidth={1.5} />
        </div>

        <h1
          className="text-3xl font-bold mb-3 tracking-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Dashboard coming soon
        </h1>
        <p
          className="text-slate-400 text-base leading-relaxed"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Authentication is working. The full GlobeTrotter dashboard will be built in the next phase.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-400 text-sm font-medium"
          style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Mock login successful
        </div>
      </div>
    </div>
  );
}
