import { Plane, Globe2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="hidden md:block bg-midnight text-parchment-100 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
              <Plane className="w-4 h-4 text-parchment-50" aria-hidden />
            </div>
            <span className="font-serif text-lg font-semibold text-parchment-50">GlobeTrotter</span>
          </div>
          <p className="font-sans text-sm text-parchment-100/60 flex items-center gap-1.5">
            <Globe2 className="w-4 h-4" aria-hidden />
            Plan, track, and share your multi-city journeys.
          </p>
          <p className="font-mono text-xs text-parchment-100/40">© 2025 GlobeTrotter</p>
        </div>
      </div>
    </footer>
  );
}
