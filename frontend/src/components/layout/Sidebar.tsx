import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  PlusCircle,
  Compass,
  User,
  Plane,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips', label: 'My Trips', icon: Map },
  { to: '/trips/create', label: 'Plan Trip', icon: PlusCircle },
  { to: '/search/cities', label: 'Explore Cities', icon: Compass },
  { to: '/search/activities', label: 'Activities', icon: Compass },
  { to: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'See you on your next journey!',
        variant: 'default',
      });
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-midnight text-parchment-50 h-screen sticky top-0">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2.5 px-6 py-5 border-b border-parchment-50/10 focus-ring"
      >
        <div className="w-9 h-9 rounded-lg bg-teal flex items-center justify-center shrink-0">
          <Plane className="w-5 h-5 text-parchment-50" aria-hidden />
        </div>
        <span className="font-serif text-xl font-semibold tracking-tight">GlobeTrotter</span>
      </button>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-colors focus-ring',
                isActive
                  ? 'bg-teal text-parchment-50'
                  : 'text-parchment-100 hover:bg-parchment-50/10 hover:text-parchment-50'
              )
            }
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User profile snippet & Logout */}
      <div className="px-3 py-3 border-t border-parchment-50/10 space-y-1">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-parchment-50/5 mb-1">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-teal/40"
            />
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-semibold text-parchment-50 truncate">{user.name}</p>
              <p className="font-sans text-[10px] text-parchment-100/50 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg font-sans text-xs font-medium transition-colors focus-ring',
              isActive
                ? 'bg-teal text-parchment-50'
                : 'text-parchment-100/60 hover:bg-parchment-50/10 hover:text-parchment-100'
            )
          }
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden />
          Admin Dashboard
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-sans text-xs font-medium text-coral/80 hover:text-coral hover:bg-coral/10 transition-colors focus-ring"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
