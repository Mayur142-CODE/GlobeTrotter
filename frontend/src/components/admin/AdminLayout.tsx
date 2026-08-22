import { useState, Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  MapPin,
  Sparkles,
  BarChart3,
  LogOut,
  Menu,
  X,
  Plane,
  LayoutDashboard,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/cities', label: 'Popular Cities', icon: MapPin },
  { to: '/admin/activities', label: 'Popular Activities', icon: Sparkles },
  { to: '/admin/analytics', label: 'User Trends & Analytics', icon: BarChart3 },
];

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { adminEmail, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    adminLogout();
    toast({
      title: 'Admin Signed Out',
      description: 'You have been logged out of the admin console.',
      variant: 'default',
    });
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-parchment text-midnight font-sans">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-midnight text-parchment-50 h-screen sticky top-0 border-r border-parchment-50/10">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-parchment-50/10">
          <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center shrink-0 shadow">
            <ShieldCheck className="w-5 h-5 text-parchment-50" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-tight block leading-tight">
              GlobeTrotter
            </span>
            <span className="text-[10px] ticket-mono uppercase tracking-widest text-teal font-semibold">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-all focus-ring',
                  isActive
                    ? 'bg-teal text-parchment-50 shadow-md font-semibold'
                    : 'text-parchment-100/70 hover:bg-parchment-50/10 hover:text-parchment-50'
                )
              }
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Admin info & Logout */}
        <div className="p-3 border-t border-parchment-50/10 space-y-2">
          <div className="p-2.5 rounded-lg bg-parchment-50/5 border border-parchment-50/10 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs font-semibold text-parchment-50 truncate">System Admin</p>
              <p className="ticket-mono text-[10px] text-parchment-200/50 truncate">{adminEmail || 'admin@globaltrotter.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-sans text-xs font-medium text-coral hover:bg-coral/10 transition-colors focus-ring"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out Admin
          </button>
        </div>
      </aside>

      {/* Mobile Admin Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 bg-midnight text-parchment-50 px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-parchment-50" />
            </div>
            <span className="font-serif text-base font-bold">Admin Console</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-parchment-50/10 focus-ring"
            aria-label={mobileOpen ? 'Close admin menu' : 'Open admin menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-midnight/60" onClick={() => setMobileOpen(false)}>
            <nav
              className="absolute top-14 left-0 right-0 bg-midnight text-parchment-50 py-4 px-4 space-y-1.5 shadow-2xl border-b border-parchment-50/10"
              onClick={(e) => e.stopPropagation()}
            >
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-colors focus-ring',
                      isActive ? 'bg-teal text-parchment-50' : 'text-parchment-100/80 hover:bg-parchment-50/10'
                    )
                  }
                >
                  <item.icon className="w-4.5 h-4.5" />
                  {item.label}
                </NavLink>
              ))}

              <div className="pt-3 mt-3 border-t border-parchment-50/10">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm font-medium text-coral hover:bg-coral/10"
                >
                  <LogOut className="w-4.5 h-4.5" />
                  Sign Out Admin
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
