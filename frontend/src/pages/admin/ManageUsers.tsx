import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  Eye,
  X,
  Phone,
  Mail,
  Plane,
  ArrowUpDown,
  Lock,
  Globe,
  Compass,
} from 'lucide-react';
import {
  getAdminUsers,
  getAdminUserTrips,
  type AdminUserItem,
  type AdminUserTrip,
} from '@/services/adminService';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { formatDateShort } from '@/lib/utils';

export default function ManageUsers() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'trips' | 'newest' | 'name'>('trips');

  // Selected user for inspection modal
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [userTrips, setUserTrips] = useState<AdminUserTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search]);

  useEffect(() => {
    if (!selectedUser) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedUser(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(search);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectUser = async (user: AdminUserItem) => {
    setSelectedUser(user);
    setLoadingTrips(true);
    try {
      const trips = await getAdminUserTrips(user.id);
      setUserTrips(trips);
    } finally {
      setLoadingTrips(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'trips') return b.tripCount - a.tripCount;
    if (sortBy === 'newest') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-midnight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-teal" /> Manage Users
          </h1>
          <p className="font-sans text-xs sm:text-sm text-ink/60 mt-1">
            Registered travelers and their travel itineraries ({users.length} {users.length === 1 ? 'traveler' : 'travelers'} in database)
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="boarding-pass p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, location…"
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-ink/50 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs w-36"
          >
            <option value="trips">Most Trips</option>
            <option value="newest">Newest Joined</option>
            <option value="name">Alphabetical</option>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : sortedUsers.length === 0 ? (
        <div className="boarding-pass p-10 text-center">
          <Users className="w-12 h-12 text-ink/30 mx-auto mb-3" />
          <h3 className="font-serif text-base font-semibold text-midnight">No Travelers Found</h3>
          <p className="font-sans text-xs text-ink/50 mt-1">
            {search ? 'No users matching your search query.' : 'No travelers registered yet in database.'}
          </p>
        </div>
      ) : (
        <div className="boarding-pass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-midnight text-parchment-50 text-xs ticket-mono uppercase border-b border-parchment-300">
                <tr>
                  <th className="py-3.5 px-4 font-medium">User</th>
                  <th className="py-3.5 px-4 font-medium">Email</th>
                  <th className="py-3.5 px-4 font-medium hidden sm:table-cell">Location</th>
                  <th className="py-3.5 px-4 font-medium hidden md:table-cell">Joined Date</th>
                  <th className="py-3.5 px-4 font-medium text-center">Trips</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-200/80 bg-parchment-50/50">
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-parchment-100/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar avatarUrl={u.avatarUrl} name={u.name} size="sm" />
                        <div>
                          <p className="font-serif font-semibold text-midnight leading-tight">{u.name}</p>
                          <p className="ticket-mono text-[10px] text-ink/40 mt-0.5">ID: {u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-sans text-xs text-ink/70 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-teal shrink-0" />
                        {u.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 hidden sm:table-cell">
                      <div className="text-xs space-y-0.5">
                        {(u.city || u.country) ? (
                          <p className="flex items-center gap-1 text-ink/70">
                            <MapPin className="w-3 h-3 text-teal shrink-0" />
                            {[u.city, u.country].filter(Boolean).join(', ')}
                          </p>
                        ) : (
                          <span className="text-ink/40 italic text-xs">Global Traveler</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell text-xs ticket-mono text-ink/60">
                      {new Date(u.joinedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={u.tripCount > 0 ? 'teal' : 'secondary'} className="ticket-mono text-xs">
                        {u.tripCount} {u.tripCount === 1 ? 'trip' : 'trips'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInspectUser(u)}
                        className="text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Trips
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details & Trips Inspection Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div
            className="fixed inset-0 z-50 bg-midnight/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="boarding-pass w-full max-w-2xl bg-parchment p-6 overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-parchment-300">
                <div className="flex items-center gap-3">
                  <UserAvatar avatarUrl={selectedUser.avatarUrl} name={selectedUser.name} size="md" />
                  <div>
                    <h2 className="font-serif text-xl font-bold text-midnight">{selectedUser.name}</h2>
                    <p className="ticket-mono text-xs text-ink/50 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-teal" /> {selectedUser.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-lg text-ink/40 hover:text-midnight hover:bg-parchment-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Metadata */}
              <div className="py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-b border-parchment-300">
                <div>
                  <span className="ticket-mono text-[10px] text-ink/40 uppercase block">Location</span>
                  <span className="font-medium text-midnight">
                    {[selectedUser.city, selectedUser.country].filter(Boolean).join(', ') || 'Global Traveler'}
                  </span>
                </div>
                <div>
                  <span className="ticket-mono text-[10px] text-ink/40 uppercase block">Member Since</span>
                  <span className="font-medium text-midnight ticket-mono">
                    {new Date(selectedUser.joinedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="ticket-mono text-[10px] text-ink/40 uppercase block">Total Trips</span>
                  <span className="font-bold text-teal ticket-mono">{userTrips.length} itineraries</span>
                </div>
              </div>

              {/* User Trips Section */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                <h3 className="font-serif text-sm font-semibold text-midnight flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-teal" /> Itineraries Created by {selectedUser.name}
                </h3>

                {loadingTrips ? (
                  <div className="space-y-2 py-4">
                    <LoadingSkeleton className="h-16 w-full" />
                    <LoadingSkeleton className="h-16 w-full" />
                  </div>
                ) : userTrips.length === 0 ? (
                  <p className="font-sans text-xs text-ink/50 italic py-4 text-center">
                    This traveler has not created any trips yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {userTrips.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-xl border border-parchment-300 bg-parchment-50 p-3.5 shadow-sm space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-serif text-sm font-semibold text-midnight">{t.name}</h4>
                            <p className="ticket-mono text-xs text-ink/60 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-teal" />
                              {formatDateShort(t.startDate)} — {formatDateShort(t.endDate)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant={t.isPublic ? 'teal' : 'secondary'} className="text-[10px]">
                              {t.isPublic ? (
                                <span className="flex items-center gap-1">
                                  <Globe className="w-2.5 h-2.5" /> Public
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> Private
                                </span>
                              )}
                            </Badge>
                            <Badge variant="gold" className="text-[10px]">
                              {t.stopCount} stops
                            </Badge>
                          </div>
                        </div>

                        {t.stops.length > 0 && (
                          <div className="pt-1.5 border-t border-dashed border-parchment-200">
                            <p className="ticket-mono text-[10px] text-ink/50 uppercase mb-1">Route Stops:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {t.stops.map((s, idx) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-parchment-200/70 text-[11px] font-sans text-midnight"
                                >
                                  <span className="font-bold text-teal">{idx + 1}.</span> {s.cityName}
                                  {s.country && <span className="text-ink/40">({s.country})</span>}
                                  <span className="text-[10px] text-teal font-semibold">· {s.activityCount} acts</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-parchment-300 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
