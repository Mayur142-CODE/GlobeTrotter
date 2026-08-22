import { Plane, Globe2, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="hidden md:block bg-midnight text-parchment-100 mt-auto border-t border-parchment-50/10">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal flex items-center justify-center">
              <Plane className="w-3.5 h-3.5 text-parchment-50" aria-hidden />
            </div>
            <span className="font-serif text-base font-semibold text-parchment-50">GlobeTrotter</span>
          </div>

          <p className="font-sans text-xs text-parchment-100/60 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-teal" aria-hidden />
            Plan, track, and share your multi-city journeys.
          </p>

          <p className="font-sans text-xs font-medium text-parchment-100/70 flex items-center gap-1">
            Made by <span className="text-teal font-semibold">Mayur Chavda</span> & <span className="text-teal font-semibold">Mohit Baraiya</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
