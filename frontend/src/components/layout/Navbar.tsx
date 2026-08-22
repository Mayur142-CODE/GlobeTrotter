import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Menu, X, LayoutDashboard, Map, PlusCircle, Compass, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/trips', label: 'Trips', icon: Map },
  { to: '/trips/create', label: 'Plan', icon: PlusCircle },
  { to: '/search/cities', label: 'Explore', icon: Compass },
  { to: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isItemActive = (to: string) => {
    if (to === '/trips/create') return currentPath === '/trips/create';
    if (to === '/trips') {
      return (
        currentPath === '/trips' ||
        (currentPath.startsWith('/trips/') && currentPath !== '/trips/create') ||
        currentPath.startsWith('/itinerary/') ||
        currentPath.startsWith('/trip/')
      );
    }
    if (to === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
    return currentPath === to;
  };

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 bg-midnight text-parchment-50 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 focus-ring rounded"
        >
          <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
            <Plane className="w-4 h-4 text-parchment-50" aria-hidden />
          </div>
          <span className="font-serif text-lg font-semibold">GlobeTrotter</span>
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-parchment-50/10 focus-ring"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-30 bg-midnight/50" onClick={() => setOpen(false)}>
          <nav
            className="absolute top-14 left-0 right-0 bg-midnight text-parchment-50 py-3 px-4 space-y-1 shadow-paper-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {mobileNavItems.map((item) => {
              const active = isItemActive(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg font-sans text-sm font-medium transition-colors focus-ring',
                    active ? 'bg-teal text-parchment-50' : 'text-parchment-100 hover:bg-parchment-50/10'
                  )}
                >
                  <item.icon className="w-5 h-5" aria-hidden />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-midnight border-t border-parchment-50/10 flex items-center justify-around px-2 py-1.5">
        {mobileNavItems.map((item) => {
          const active = isItemActive(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg font-sans text-[10px] font-medium transition-colors focus-ring',
                active ? 'text-teal-200' : 'text-parchment-100/60'
              )}
            >
              <item.icon className="w-5 h-5" aria-hidden />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
