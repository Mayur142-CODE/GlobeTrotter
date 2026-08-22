import type { Stop } from '@/types/stop';
import type { Activity } from '@/types/activity';
import { supabase } from '@/lib/supabase';
import { getTrip } from './tripService';
import { addDays, diffDays, getNextStopArrival, validateNewStopDates } from '@/lib/dateSequence';

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
 * Fetch all stops with destinations and scheduled activities for a trip, sorted by stop_order.
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
 * Add a new stop destination to a trip enforcing strictly continuous sequential dates.
 */
export async function addStop(
  tripId: string,
  input: { cityId: string; startDate: string; endDate: string; notes?: string }
): Promise<Stop | undefined> {
  // 1. Fetch trip and existing stops
  const trip = await getTrip(tripId);
  if (!trip) {
    throw new Error('Trip not found.');
  }

  const existingStops = (trip.stops || []).sort((a, b) => a.order - b.order);

  // 2. Validate sequential dates
  const validation = validateNewStopDates(
    trip.startDate,
    trip.endDate,
    existingStops,
    input.startDate,
    input.endDate
  );

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid stop dates.');
  }

  const nextOrder = existingStops.length + 1;

  // 3. Insert into Supabase trip_stops
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
    throw new Error(error?.message || 'Failed to insert trip stop.');
  }

  const dest = data.destinations || {};
  return {
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
}

/**
 * Update an existing stop's departure date or notes and revalidate/adjust all downstream stops.
 */
export async function updateStop(
  tripId: string,
  stopId: string,
  updates: { endDate?: string; notes?: string }
): Promise<Stop[]> {
  const trip = await getTrip(tripId);
  if (!trip) throw new Error('Trip not found.');

  const stops = (trip.stops || []).sort((a, b) => a.order - b.order);
  const targetIndex = stops.findIndex((s) => s.id === stopId);
  if (targetIndex === -1) throw new Error('Stop not found in trip.');

  const targetStop = stops[targetIndex];

  if (updates.endDate && updates.endDate !== targetStop.endDate) {
    const newEnd = updates.endDate;

    // Validate new departure against arrival and trip end
    if (newEnd < targetStop.startDate) {
      throw new Error(`Departure date cannot be before arrival date (${targetStop.startDate}).`);
    }
    if (newEnd > trip.endDate) {
      throw new Error(`Departure date cannot be after the trip end date (${trip.endDate}).`);
    }

    // Check downstream stops
    let currentArrival = newEnd;
    const downstreamUpdates: { id: string; startDate: string; endDate: string }[] = [];

    for (let i = targetIndex + 1; i < stops.length; i++) {
      const nextStop = stops[i];
      if (currentArrival > trip.endDate) {
        throw new Error(
          `Departure date pushes following stop (${nextStop.city.name}) beyond the trip end date (${trip.endDate}). Please choose an earlier departure or adjust following stops.`
        );
      }

      const stayDuration = Math.max(0, diffDays(nextStop.startDate, nextStop.endDate));
      let nextEnd = addDays(currentArrival, stayDuration);
      if (nextEnd > trip.endDate) {
        nextEnd = trip.endDate;
      }

      downstreamUpdates.push({
        id: nextStop.id,
        startDate: currentArrival,
        endDate: nextEnd,
      });

      currentArrival = nextEnd;
    }

    // Persist target stop update
    await supabase
      .from('trip_stops')
      .update({
        end_date: newEnd,
        notes: updates.notes !== undefined ? updates.notes?.trim() || null : targetStop.notes || null,
      })
      .eq('id', stopId);

    // Persist downstream stop updates
    for (const d of downstreamUpdates) {
      await supabase
        .from('trip_stops')
        .update({
          start_date: d.startDate,
          end_date: d.endDate,
        })
        .eq('id', d.id);
    }
  } else if (updates.notes !== undefined) {
    await supabase
      .from('trip_stops')
      .update({ notes: updates.notes?.trim() || null })
      .eq('id', stopId);
  }

  return getStops(tripId);
}

/**
 * Delete a stop from a trip in Supabase and re-sequence remaining stops.
 */
export async function deleteStop(tripId: string, stopId: string): Promise<boolean> {
  const trip = await getTrip(tripId);
  if (!trip) throw new Error('Trip not found.');

  // 1. Delete the target stop
  const { error } = await supabase.from('trip_stops').delete().eq('id', stopId);
  if (error) {
    throw new Error(error.message || 'Failed to delete stop.');
  }

  // 2. Re-sequence remaining stops
  const remainingStops = (trip.stops || [])
    .filter((s) => s.id !== stopId)
    .sort((a, b) => a.order - b.order);

  if (remainingStops.length > 0) {
    let currentArrival = trip.startDate;
    for (let i = 0; i < remainingStops.length; i++) {
      const stop = remainingStops[i];
      const stayDuration = Math.max(0, diffDays(stop.startDate, stop.endDate));
      let currentEnd = addDays(currentArrival, stayDuration);
      if (currentEnd > trip.endDate) {
        currentEnd = trip.endDate;
      }

      await supabase
        .from('trip_stops')
        .update({
          stop_order: i + 1,
          start_date: currentArrival,
          end_date: currentEnd,
        })
        .eq('id', stop.id);

      currentArrival = currentEnd;
    }
  }

  return true;
}

/**
 * Reorder stops within a trip, recalculate sequential dates, and persist to Supabase.
 */
export async function reorderStops(tripId: string, orderedStopIds: string[]): Promise<Stop[]> {
  const trip = await getTrip(tripId);
  if (!trip) throw new Error('Trip not found.');

  const stopsMap = new Map((trip.stops || []).map((s) => [s.id, s]));
  let currentArrival = trip.startDate;

  for (let i = 0; i < orderedStopIds.length; i++) {
    const id = orderedStopIds[i];
    const originalStop = stopsMap.get(id);
    const stayDuration = originalStop ? Math.max(0, diffDays(originalStop.startDate, originalStop.endDate)) : 2;
    let currentEnd = addDays(currentArrival, stayDuration);
    if (currentEnd > trip.endDate) {
      currentEnd = trip.endDate;
    }

    await supabase
      .from('trip_stops')
      .update({
        stop_order: i + 1,
        start_date: currentArrival,
        end_date: currentEnd,
      })
      .eq('id', id);

    currentArrival = currentEnd;
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
  // Check if activity is already added to this stop in Supabase
  const { data: duplicateCheck } = await supabase
    .from('trip_activities')
    .select('id')
    .eq('stop_id', stopId)
    .eq('activity_id', activity.id)
    .maybeSingle();

  if (duplicateCheck) {
    throw new Error('This activity is already added to this stop.');
  }

  const { data: stopData } = await supabase
    .from('trip_stops')
    .select('start_date')
    .eq('id', stopId)
    .single();

  const activityDate = options?.scheduledDate || stopData?.start_date || new Date().toISOString().slice(0, 10);

  const { data: existingActivities } = await supabase
    .from('trip_activities')
    .select('activity_order')
    .eq('stop_id', stopId);

  const nextOrder = (existingActivities?.length || 0) + 1;

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
    if (error.code === '23505' || error.message?.toLowerCase().includes('duplicate') || error.message?.toLowerCase().includes('unique')) {
      throw new Error('This activity is already added to this stop.');
    }
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
