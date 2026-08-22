import type { Stop } from '@/types/stop';
import type { Activity } from '@/types/activity';
import { getTripById } from '@/data/mockTrips';
import { getCityById } from '@/data/mockCities';
import { supabase } from '@/lib/supabase';
import { getTrip } from './tripService';

export async function getStops(tripId: string): Promise<Stop[]> {
  try {
    const trip = await getTrip(tripId);
    if (trip && trip.stops) {
      return [...trip.stops].sort((a, b) => a.order - b.order);
    }
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase getStops notice:', err);
  }

  const mockTrip = getTripById(tripId);
  return mockTrip ? [...mockTrip.stops].sort((a, b) => a.order - b.order) : [];
}

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
    console.warn('[GlobeTrotter] Supabase addStop fallback:', err);
    const mockTrip = getTripById(tripId);
    if (!mockTrip) return undefined;
    const city = getCityById(input.cityId);
    if (!city) return undefined;
    const order = mockTrip.stops.length + 1;
    const stop: Stop = {
      id: `stop-${tripId}-${input.cityId}-${Date.now()}`,
      tripId,
      cityId: input.cityId,
      city,
      order,
      startDate: input.startDate,
      endDate: input.endDate,
      activities: [],
      notes: input.notes,
    };
    mockTrip.stops.push(stop);
    return stop;
  }
}

export async function deleteStop(tripId: string, stopId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('trip_stops')
      .delete()
      .eq('id', stopId)
      .select('id');

    if (error) {
      console.warn('[GlobeTrotter] deleteStop Supabase notice:', error.message);
    }
  } catch (err) {
    console.warn('[GlobeTrotter] deleteStop exception:', err);
  }

  const mockTrip = getTripById(tripId);
  if (mockTrip) {
    mockTrip.stops = mockTrip.stops.filter((s) => s.id !== stopId);
  }
  return true;
}

export async function reorderStops(tripId: string, orderedStopIds: string[]): Promise<Stop[]> {
  try {
    for (let i = 0; i < orderedStopIds.length; i++) {
      await supabase
        .from('trip_stops')
        .update({ stop_order: i + 1 })
        .eq('id', orderedStopIds[i]);
    }
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase reorderStops notice:', err);
  }

  return getStops(tripId);
}

export async function addActivityToStop(
  tripId: string,
  stopId: string,
  activity: Activity
): Promise<Stop | undefined> {
  try {
    const { data: existingActivities } = await supabase
      .from('trip_activities')
      .select('stop_order')
      .eq('stop_id', stopId);

    const nextOrder = (existingActivities?.length || 0) + 1;

    await supabase.from('trip_activities').insert({
      stop_id: stopId,
      activity_id: activity.id,
      stop_order: nextOrder,
      custom_name: activity.name,
      custom_cost: activity.price,
    });
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase addActivityToStop notice:', err);
  }

  const stops = await getStops(tripId);
  const updatedStop = stops.find((s) => s.id === stopId);
  if (updatedStop && !updatedStop.activities.some((a) => a.id === activity.id)) {
    updatedStop.activities.push(activity);
  }
  return updatedStop;
}

export async function removeActivityFromStop(
  tripId: string,
  stopId: string,
  activityId: string
): Promise<Stop | undefined> {
  try {
    await supabase
      .from('trip_activities')
      .delete()
      .eq('stop_id', stopId)
      .eq('activity_id', activityId);
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase removeActivityFromStop notice:', err);
  }

  const stops = await getStops(tripId);
  const updatedStop = stops.find((s) => s.id === stopId);
  if (updatedStop) {
    updatedStop.activities = updatedStop.activities.filter((a) => a.id !== activityId);
  }
  return updatedStop;
}
