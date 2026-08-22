import type { Trip } from '@/types/trip';
import type { ActivityCategory } from '@/types/activity';
import type { Region } from '@/types/city';
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
  activity_date: string;
  start_time?: string | null;
  end_time?: string | null;
  estimated_cost?: number | string | null;
  notes?: string | null;
  activity_order: number;
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
  stop_id?: string | null;
  category: string;
  amount: number | string;
  expense_date: string;
  description?: string | null;
  created_at?: string;
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
  share_slug?: string | null;
  created_at?: string;
  updated_at?: string;
  trip_stops?: SupabaseTripStop[] | null;
  trip_expenses?: SupabaseExpense[] | null;
}

/**
 * Fetch all trips owned by the current authenticated user.
 */
export async function getTrips(): Promise<Trip[]> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;

    if (!userId) {
      return [];
    }

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
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[GlobeTrotter] getTrips notice:', error?.message);
      return [];
    }

    return (data as SupabaseTripRow[]).map((t) => mapSupabaseTrip(t));
  } catch (err) {
    console.warn('[GlobeTrotter] getTrips exception:', err);
    return [];
  }
}

/**
 * Fetch a single trip by ID (either owned by current user or public).
 */
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
      console.warn('[GlobeTrotter] getTrip notice:', error?.message);
      return undefined;
    }

    return mapSupabaseTrip(data as SupabaseTripRow);
  } catch (err) {
    console.warn('[GlobeTrotter] getTrip exception:', err);
    return undefined;
  }
}

/**
 * Upload a trip cover image with persistent storage and resilient fallback.
 */
export async function uploadTripCover(userId: string, file: File | Blob): Promise<string> {
  try {
    const fileExt = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
    const filePath = `${userId}/trip-covers/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('[GlobeTrotter] Cover storage upload notice:', err);
  }

  // Resilient fallback: convert to base64 Data URL so image is never lost on refresh
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800');
    reader.readAsDataURL(file);
  });
}

/**
 * Create a new trip in Supabase.
 */
export async function createTrip(
  input: Omit<Trip, 'id' | 'stops' | 'budget' | 'createdAt' | 'status'> & {
    status?: Trip['status'];
    budgetLimit?: number;
  }
): Promise<Trip> {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;

  if (!user) {
    throw new Error('You must be signed in to create a trip.');
  }

  const initialBudget = input.budgetLimit ?? null;

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      start_date: input.startDate,
      end_date: input.endDate,
      cover_photo_url: input.coverPhotoUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      budget_limit: initialBudget,
      is_public: false,
    })
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
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create trip in database.');
  }

  return mapSupabaseTrip(data as SupabaseTripRow);
}

/**
 * Update an existing trip in Supabase.
 */
export async function updateTrip(
  id: string,
  updates: Partial<Trip> & { budgetLimit?: number; isPublic?: boolean }
): Promise<Trip | undefined> {
  const currentTrip = await getTrip(id);
  if (!currentTrip) {
    throw new Error('Trip not found.');
  }

  // Validate dates against existing stops
  if (updates.startDate || updates.endDate) {
    const existingStops = currentTrip.stops || [];
    if (existingStops.length > 0) {
      if (updates.startDate) {
        const firstStopArrival = existingStops[0].startDate;
        if (updates.startDate > firstStopArrival) {
          throw new Error(
            `Trip start date cannot be after the arrival date of the first stop (${firstStopArrival}).`
          );
        }
      }

      if (updates.endDate) {
        const maxDeparture = existingStops.reduce(
          (max, s) => (s.endDate > max ? s.endDate : max),
          existingStops[0].endDate
        );
        if (updates.endDate < maxDeparture) {
          throw new Error(
            `Trip end date (${updates.endDate}) cannot be before the departure date of an existing stop (${maxDeparture}). Please adjust stops first.`
          );
        }
      }
    }
  }

  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.startDate !== undefined) payload.start_date = updates.startDate;
  if (updates.endDate !== undefined) payload.end_date = updates.endDate;
  if (updates.coverPhotoUrl !== undefined) payload.cover_photo_url = updates.coverPhotoUrl;
  if (updates.budgetLimit !== undefined) payload.budget_limit = updates.budgetLimit;
  if (updates.isPublic !== undefined) payload.is_public = updates.isPublic;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase.from('trips').update(payload).eq('id', id);
    if (error) {
      throw new Error(error.message || 'Failed to update trip.');
    }
  }

  return getTrip(id);
}

/**
 * Toggle trip public visibility.
 */
export async function toggleTripPublic(id: string, isPublic: boolean): Promise<Trip | undefined> {
  const { error } = await supabase
    .from('trips')
    .update({ is_public: isPublic })
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Failed to update trip sharing settings.');
  }

  return getTrip(id);
}

/**
 * Delete a trip from Supabase (cascades to stops, activities, expenses).
 */
export async function deleteTrip(id: string): Promise<boolean> {
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Failed to delete trip.');
  }
  return true;
}

/**
 * Duplicate a public trip into the currently authenticated user's account.
 */
export async function duplicateTrip(sourceTripId: string): Promise<Trip> {
  const { data: userRes } = await supabase.auth.getUser();
  const currentUser = userRes?.user;
  if (!currentUser) {
    throw new Error('You must be signed in to copy this trip.');
  }

  // 1. Fetch source trip with full stops and activities
  const sourceTrip = await getTrip(sourceTripId);
  if (!sourceTrip) {
    throw new Error('Source trip could not be found.');
  }

  // 2. Create the new trip owned by currentUser
  const { data: newTripRow, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: currentUser.id,
      name: `${sourceTrip.name} (Copy)`,
      description: sourceTrip.description || null,
      start_date: sourceTrip.startDate,
      end_date: sourceTrip.endDate,
      cover_photo_url: sourceTrip.coverPhotoUrl,
      budget_limit: sourceTrip.budget?.dailyLimit ? sourceTrip.budget.total : null,
      is_public: false,
    })
    .select('*')
    .single();

  if (tripError || !newTripRow) {
    throw new Error(tripError?.message || 'Failed to duplicate trip.');
  }

  const newTripId = newTripRow.id;

  // 3. Duplicate each stop and its activities
  for (const stop of sourceTrip.stops) {
    const { data: newStopRow, error: stopError } = await supabase
      .from('trip_stops')
      .insert({
        trip_id: newTripId,
        destination_id: stop.cityId,
        start_date: stop.startDate,
        end_date: stop.endDate,
        stop_order: stop.order,
        notes: stop.notes || null,
      })
      .select('*')
      .single();

    if (stopError || !newStopRow) continue;

    // Duplicate activities for this stop
    if (stop.activities && stop.activities.length > 0) {
      const activitiesToInsert = stop.activities.map((act, index) => ({
        stop_id: newStopRow.id,
        activity_id: act.id,
        activity_date: stop.startDate,
        estimated_cost: act.price || 0,
        activity_order: index + 1,
      }));

      await supabase.from('trip_activities').insert(activitiesToInsert);
    }
  }

  const duplicatedTrip = await getTrip(newTripId);
  if (!duplicatedTrip) {
    throw new Error('Trip created but failed to reload.');
  }
  return duplicatedTrip;
}

function mapSupabaseTrip(t: SupabaseTripRow): Trip {
  let totalActivityCost = 0;
  const stops = (t.trip_stops || [])
    .sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0))
    .map((s) => {
      const dest = s.destinations || ({} as SupabaseDestination);
      const activities = (s.trip_activities || [])
        .sort((a, b) => (a.activity_order || 0) - (b.activity_order || 0))
        .map((ta) => {
          const act = ta.activities || ({} as SupabaseActivity);
          const cost = Number(ta.estimated_cost ?? act.estimated_cost) || 0;
          totalActivityCost += cost;
          return {
            id: act.id || ta.activity_id || ta.id,
            cityId: dest.id || s.destination_id,
            name: act.name || 'Activity',
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
            scheduledDate: ta.activity_date,
            startTime: ta.start_time,
            endTime: ta.end_time,
            notes: ta.notes,
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
  const grandTotal = totalActivityCost + totalExpense;
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
      budgetLimit: t.budget_limit ? Number(t.budget_limit) : undefined,
      total: grandTotal,
      averagePerDay: Math.round(grandTotal / days),
      dailyLimit: Math.round((Number(t.budget_limit) || grandTotal) / days),
      lineItems: [
        {
          category: 'Activities',
          amount: totalActivityCost,
          percentage: grandTotal > 0 ? Math.round((totalActivityCost / grandTotal) * 100) : 0,
        },
        {
          category: 'Transport',
          amount: expenses.filter((e) => e.category === 'transport').reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
          percentage: grandTotal > 0 ? Math.round((expenses.filter((e) => e.category === 'transport').reduce((sum, e) => sum + (Number(e.amount) || 0), 0) / grandTotal) * 100) : 0,
        },
        {
          category: 'Accommodation',
          amount: expenses.filter((e) => e.category === 'accommodation').reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
          percentage: grandTotal > 0 ? Math.round((expenses.filter((e) => e.category === 'accommodation').reduce((sum, e) => sum + (Number(e.amount) || 0), 0) / grandTotal) * 100) : 0,
        },
        {
          category: 'Meals',
          amount: expenses.filter((e) => e.category === 'meals').reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
          percentage: grandTotal > 0 ? Math.round((expenses.filter((e) => e.category === 'meals').reduce((sum, e) => sum + (Number(e.amount) || 0), 0) / grandTotal) * 100) : 0,
        },
        {
          category: 'Misc',
          amount: expenses.filter((e) => e.category === 'other').reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
          percentage: grandTotal > 0 ? Math.round((expenses.filter((e) => e.category === 'other').reduce((sum, e) => sum + (Number(e.amount) || 0), 0) / grandTotal) * 100) : 0,
        },
      ],
      daily: [],
      expenses: expenses.map((e) => ({
        id: e.id,
        tripId: t.id,
        stopId: e.stop_id || null,
        category: (['transport', 'accommodation', 'activities', 'meals', 'other'].includes(e.category)
          ? e.category
          : 'other') as any,
        description: e.description || '',
        amount: Number(e.amount) || 0,
        currency: 'INR',
        expenseDate: e.expense_date,
        createdAt: e.created_at || new Date().toISOString(),
      })),
    },
    createdAt: t.created_at || new Date().toISOString(),
  };
}
