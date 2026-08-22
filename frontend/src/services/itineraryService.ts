import type { Stop } from '@/types/stop';
import type { Activity } from '@/types/activity';
import { supabase } from '@/lib/supabase';
import { getTrip } from './tripService';

export interface AddActivityOptions {
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  customCost?: number;
  notes?: string;
}

export interface UpdateActivityOptions {
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  customCost?: number;
  notes?: string;
}

/**
 * Fetch all stops with destinations and scheduled activities for a trip.
 */
export async function getStops(tripId: string): Promise<Stop[]> {
  try {
    const trip = await getTrip(tripId);
    if (trip && trip.stops) {
      return [...trip.stops].sort((a, b) => a.order - b.order);
    }
    return [];
  } catch (err) {
    console.warn('[GlobeTrotter] getStops exception:', err);
    return [];
  }
}

/**
 * Add a new stop destination to a trip.
 */
export async function addStop(
  tripId: string,
  input: { cityId: string; startDate: string; endDate: string; notes?: string }
): Promise<Stop | undefined> {
  try {
    const { data: existingStops } = await supabase
      .from('trip_stops')
      .select('stop_order')
      .eq('trip_id', tripId);

    const nextOrder = (existingStops?.length || 0) + 1;

    const { data, error } = await supabase
      .from('trip_stops')
      .insert({
        trip_id: tripId,
        destination_id: input.cityId,
        stop_order: nextOrder,
        start_date: input.startDate,
        end_date: input.endDate,
        notes: input.notes?.trim() || null,
      })
      .select(`
        *,
        destinations (*)
      `)
      .single();

    if (error || !data) {
      throw error || new Error('Failed to insert trip stop');
    }

    const dest = data.destinations || {};
    const newStop: Stop = {
      id: data.id,
      tripId,
      cityId: input.cityId,
      city: {
        id: dest.id || input.cityId,
        name: dest.name || 'Destination',
        country: dest.country || 'Country',
        countryCode: dest.country?.slice(0, 2).toUpperCase() || 'GL',
        region: dest.region || 'Asia',
        imageUrl: dest.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
        costIndex: dest.cost_index || 50,
        popularity: dest.popularity_score || 80,
        description: dest.description || '',
        timezone: 'UTC',
      },
      order: data.stop_order,
      startDate: data.start_date,
      endDate: data.end_date,
      activities: [],
      notes: data.notes || '',
    };

    return newStop;
  } catch (err) {
    console.error('[GlobeTrotter] addStop error:', err);
    throw err;
  }
}

/**
 * Update an existing stop's dates or notes.
 */
export async function updateStop(
  stopId: string,
  updates: { startDate?: string; endDate?: string; notes?: string }
): Promise<boolean> {
  const payload: Record<string, unknown> = {};
  if (updates.startDate) payload.start_date = updates.startDate;
  if (updates.endDate) payload.end_date = updates.endDate;
  if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

  const { error } = await supabase.from('trip_stops').update(payload).eq('id', stopId);
  if (error) throw new Error(error.message || 'Failed to update stop');
  return true;
}

/**
 * Delete a stop from a trip in Supabase.
 */
export async function deleteStop(tripId: string, stopId: string): Promise<boolean> {
  const { error } = await supabase.from('trip_stops').delete().eq('id', stopId);
  if (error) {
    throw new Error(error.message || 'Failed to delete stop');
  }
  return true;
}

/**
 * Reorder stops within a trip and persist order to Supabase.
 */
export async function reorderStops(tripId: string, orderedStopIds: string[]): Promise<Stop[]> {
  for (let i = 0; i < orderedStopIds.length; i++) {
    await supabase
      .from('trip_stops')
      .update({ stop_order: i + 1 })
      .eq('id', orderedStopIds[i]);
  }

  return getStops(tripId);
}

/**
 * Add an activity to a specific trip stop.
 */
export async function addActivityToStop(
  tripId: string,
  stopId: string,
  activity: Activity,
  options?: AddActivityOptions
): Promise<Stop | undefined> {
  // 1. Get the stop to determine default date
  const { data: stopData } = await supabase
    .from('trip_stops')
    .select('start_date')
    .eq('id', stopId)
    .single();

  const activityDate = options?.scheduledDate || stopData?.start_date || new Date().toISOString().slice(0, 10);

  // 2. Determine next order
  const { data: existingActivities } = await supabase
    .from('trip_activities')
    .select('activity_order')
    .eq('stop_id', stopId);

  const nextOrder = (existingActivities?.length || 0) + 1;

  // 3. Insert into trip_activities
  const { error } = await supabase.from('trip_activities').insert({
    stop_id: stopId,
    activity_id: activity.id,
    activity_date: activityDate,
    start_time: options?.startTime || null,
    end_time: options?.endTime || null,
    estimated_cost: options?.customCost ?? activity.price ?? 0,
    notes: options?.notes?.trim() || null,
    activity_order: nextOrder,
  });

  if (error) {
    throw new Error(error.message || 'Failed to add activity to itinerary');
  }

  const stops = await getStops(tripId);
  return stops.find((s) => s.id === stopId);
}

/**
 * Update a scheduled activity in a stop (time, notes, cost).
 */
export async function updateActivityInStop(
  tripId: string,
  stopId: string,
  activityId: string,
  updates: UpdateActivityOptions
): Promise<Stop | undefined> {
  const payload: Record<string, unknown> = {};
  if (updates.scheduledDate) payload.activity_date = updates.scheduledDate;
  if (updates.startTime !== undefined) payload.start_time = updates.startTime || null;
  if (updates.endTime !== undefined) payload.end_time = updates.endTime || null;
  if (updates.customCost !== undefined) payload.estimated_cost = updates.customCost;
  if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

  const { error } = await supabase
    .from('trip_activities')
    .update(payload)
    .eq('stop_id', stopId)
    .eq('activity_id', activityId);

  if (error) {
    throw new Error(error.message || 'Failed to update activity schedule');
  }

  const stops = await getStops(tripId);
  return stops.find((s) => s.id === stopId);
}

/**
 * Remove an activity from a stop.
 */
export async function removeActivityFromStop(
  tripId: string,
  stopId: string,
  activityId: string
): Promise<Stop | undefined> {
  const { error } = await supabase
    .from('trip_activities')
    .delete()
    .eq('stop_id', stopId)
    .eq('activity_id', activityId);

  if (error) {
    throw new Error(error.message || 'Failed to remove activity');
  }

  const stops = await getStops(tripId);
  return stops.find((s) => s.id === stopId);
}

/**
 * Reorder activities within a stop and persist to Supabase.
 */
export async function reorderActivitiesInStop(
  tripId: string,
  stopId: string,
  orderedActivityIds: string[]
): Promise<Stop | undefined> {
  for (let i = 0; i < orderedActivityIds.length; i++) {
    await supabase
      .from('trip_activities')
      .update({ activity_order: i + 1 })
      .eq('stop_id', stopId)
      .eq('activity_id', orderedActivityIds[i]);
  }

  const stops = await getStops(tripId);
  return stops.find((s) => s.id === stopId);
}
