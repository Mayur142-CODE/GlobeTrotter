import type { Stop } from '@/types/stop';
import type { Activity } from '@/types/activity';
import { getTripById } from '@/data/mockTrips';
import { getCityById } from '@/data/mockCities';

const LATENCY = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

export async function getStops(tripId: string): Promise<Stop[]> {
  const trip = getTripById(tripId);
  return delay(trip ? [...trip.stops].sort((a, b) => a.order - b.order) : []);
}

export async function addStop(
  tripId: string,
  input: { cityId: string; startDate: string; endDate: string; notes?: string }
): Promise<Stop | undefined> {
  const trip = getTripById(tripId);
  if (!trip) return delay(undefined);
  const city = getCityById(input.cityId);
  if (!city) return delay(undefined);
  const order = trip.stops.length + 1;
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
  trip.stops.push(stop);
  return delay(stop);
}

export async function reorderStops(tripId: string, orderedStopIds: string[]): Promise<Stop[]> {
  const trip = getTripById(tripId);
  if (!trip) return delay([]);
  orderedStopIds.forEach((id, i) => {
    const stop = trip.stops.find((s) => s.id === id);
    if (stop) stop.order = i + 1;
  });
  trip.stops.sort((a, b) => a.order - b.order);
  return delay([...trip.stops]);
}

export async function addActivityToStop(tripId: string, stopId: string, activity: Activity): Promise<Stop | undefined> {
  const trip = getTripById(tripId);
  if (!trip) return delay(undefined);
  const stop = trip.stops.find((s) => s.id === stopId);
  if (!stop) return delay(undefined);
  if (!stop.activities.some((a) => a.id === activity.id)) {
    stop.activities.push(activity);
  }
  return delay(stop);
}

export async function removeActivityFromStop(tripId: string, stopId: string, activityId: string): Promise<Stop | undefined> {
  const trip = getTripById(tripId);
  if (!trip) return delay(undefined);
  const stop = trip.stops.find((s) => s.id === stopId);
  if (!stop) return delay(undefined);
  stop.activities = stop.activities.filter((a) => a.id !== activityId);
  return delay(stop);
}
