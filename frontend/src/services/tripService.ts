import type { Trip } from '@/types/trip';
import type { ActivityCategory } from '@/types/activity';
import type { Region } from '@/types/city';
import { mockTrips, getTripById } from '@/data/mockTrips';
import { supabase } from '@/lib/supabase';

interface SupabaseDestination {
  id: string;
  name: string;
  country: string;
  region?: string | null;
  image_url?: string | null;
  cost_index?: number | null;
  popularity_score?: number | null;
  description?: string | null;
}

interface SupabaseActivity {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  estimated_cost?: number | string | null;
  currency?: string | null;
  duration_minutes?: number | null;
  rating?: number | string | null;
}

interface SupabaseTripActivity {
  id: string;
  stop_id: string;
  activity_id: string;
  custom_name?: string | null;
  custom_cost?: number | string | null;
  activities?: SupabaseActivity | null;
}

interface SupabaseTripStop {
  id: string;
  trip_id: string;
  destination_id: string;
  stop_order: number;
  start_date: string;
  end_date: string;
  notes?: string | null;
  destinations?: SupabaseDestination | null;
  trip_activities?: SupabaseTripActivity[] | null;
}

interface SupabaseExpense {
  id: string;
  trip_id: string;
  category: string;
  amount: number | string;
  expense_date: string;
  description?: string | null;
}

interface SupabaseTripRow {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  cover_photo_url?: string | null;
  budget_limit?: number | string | null;
  currency?: string | null;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  trip_stops?: SupabaseTripStop[] | null;
  trip_expenses?: SupabaseExpense[] | null;
}

export async function getTrips(): Promise<Trip[]> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;

    let query = supabase.from('trips').select(`
      *,
      trip_stops (
        *,
        destinations (*)
      )
    `);

    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [...mockTrips];
    }

    return (data as SupabaseTripRow[]).map((t) => mapSupabaseTrip(t));
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase getTrips notice:', err);
    return [...mockTrips];
  }
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        trip_stops (
          *,
          destinations (*),
          trip_activities (
            *,
            activities (*)
          )
        ),
        trip_expenses (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return getTripById(id);
    }

    return mapSupabaseTrip(data as SupabaseTripRow);
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase getTrip notice:', err);
    return getTripById(id);
  }
}

export async function createTrip(
  input: Omit<Trip, 'id' | 'stops' | 'budget' | 'createdAt' | 'status'> & {
    status?: Trip['status'];
    budgetLimit?: number;
  }
): Promise<Trip> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    const initialBudget = input.budgetLimit || 0;

    if (!user) {
      const id = `trip-${String(Date.now()).slice(-6)}`;
      const trip: Trip = {
        id,
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        coverPhotoUrl: input.coverPhotoUrl,
        status: input.status ?? 'draft',
        stops: [],
        budget: { tripId: id, total: initialBudget, averagePerDay: 0, dailyLimit: 0, lineItems: [], daily: [] },
        createdAt: new Date().toISOString(),
      };
      mockTrips.push(trip);
      return trip;
    }

    const { data, error } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        start_date: input.startDate,
        end_date: input.endDate,
        cover_photo_url: input.coverPhotoUrl || null,
        budget_limit: initialBudget || null,
        is_public: false,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create trip');
    }

    const newTrip = mapSupabaseTrip(data as SupabaseTripRow);
    mockTrips.push(newTrip);
    return newTrip;
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase createTrip fallback:', err);
    const id = `trip-${String(Date.now()).slice(-6)}`;
    const trip: Trip = {
      id,
      name: input.name,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      coverPhotoUrl: input.coverPhotoUrl,
      status: input.status ?? 'draft',
      stops: [],
      budget: { tripId: id, total: input.budgetLimit || 0, averagePerDay: 0, dailyLimit: 0, lineItems: [], daily: [] },
      createdAt: new Date().toISOString(),
    };
    mockTrips.push(trip);
    return trip;
  }
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | undefined> {
  try {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.startDate !== undefined) payload.start_date = updates.startDate;
    if (updates.endDate !== undefined) payload.end_date = updates.endDate;
    if (updates.coverPhotoUrl !== undefined) payload.cover_photo_url = updates.coverPhotoUrl;

    if (Object.keys(payload).length > 0) {
      await supabase.from('trips').update(payload).eq('id', id);
    }
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase updateTrip notice:', err);
  }

  const idx = mockTrips.findIndex((t) => t.id === id);
  if (idx !== -1) {
    mockTrips[idx] = { ...mockTrips[idx], ...updates };
    return mockTrips[idx];
  }

  return getTrip(id);
}

export async function deleteTrip(id: string): Promise<boolean> {
  try {
    await supabase.from('trips').delete().eq('id', id);
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase deleteTrip notice:', err);
  }

  const idx = mockTrips.findIndex((t) => t.id === id);
  if (idx !== -1) {
    mockTrips.splice(idx, 1);
  }

  return true;
}

function mapSupabaseTrip(t: SupabaseTripRow): Trip {
  let totalActivityCost = 0;
  const stops = (t.trip_stops || [])
    .sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0))
    .map((s) => {
      const dest = s.destinations || ({} as SupabaseDestination);
      const activities = (s.trip_activities || []).map((ta) => {
        const act = ta.activities || ({} as SupabaseActivity);
        const cost = Number(ta.custom_cost || act.estimated_cost) || 0;
        totalActivityCost += cost;
        return {
          id: act.id || ta.id,
          cityId: dest.id || s.destination_id,
          name: ta.custom_name || act.name || 'Activity',
          description: act.description || '',
          category: (act.category as ActivityCategory) || 'Sightseeing',
          imageUrl: act.image_url || dest.image_url || 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
          price: cost,
          currency: act.currency || 'INR',
          durationHours: act.duration_minutes ? Math.round((act.duration_minutes / 60) * 10) / 10 : 2,
          rating: Number(act.rating) || 4.8,
          reviewCount: 95,
          popularity: 90,
          location: dest.name || 'City',
        };
      });

      return {
        id: s.id,
        tripId: t.id,
        cityId: s.destination_id,
        city: {
          id: dest.id || s.destination_id,
          name: dest.name || 'Destination',
          country: dest.country || 'Country',
          countryCode: dest.country?.slice(0, 2).toUpperCase() || 'GL',
          region: (dest.region as Region) || 'Asia',
          imageUrl: dest.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
          costIndex: dest.cost_index || 50,
          popularity: dest.popularity_score || 80,
          description: dest.description || '',
          timezone: 'UTC',
        },
        order: s.stop_order || 1,
        startDate: s.start_date || t.start_date,
        endDate: s.end_date || t.end_date,
        activities,
        notes: s.notes || '',
      };
    });

  const expenses = t.trip_expenses || [];
  const totalExpense = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const grandTotal = totalActivityCost + totalExpense || Number(t.budget_limit) || 0;
  const days = Math.max(1, Math.round((new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) / (1000 * 3600 * 24)));

  return {
    id: t.id,
    name: t.name,
    description: t.description || '',
    startDate: t.start_date,
    endDate: t.end_date,
    coverPhotoUrl: t.cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    status: new Date(t.end_date) < new Date() ? 'completed' : new Date(t.start_date) <= new Date() ? 'active' : 'upcoming',
    stops,
    budget: {
      tripId: t.id,
      total: grandTotal,
      averagePerDay: Math.round(grandTotal / days),
      dailyLimit: Math.round((Number(t.budget_limit) || grandTotal) / days),
      lineItems: expenses.map((e) => ({
        id: e.id,
        category: e.category,
        amount: Number(e.amount),
        date: e.expense_date,
        note: e.description || undefined,
      })),
      daily: [],
    },
    createdAt: t.created_at || new Date().toISOString(),
  };
}
