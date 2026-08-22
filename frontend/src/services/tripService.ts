import type { Trip } from '@/types/trip';
import { mockTrips, getTripById } from '@/data/mockTrips';

const LATENCY = 450;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

export async function getTrips(): Promise<Trip[]> {
  return delay([...mockTrips]);
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  return delay(getTripById(id));
}

export async function createTrip(input: Omit<Trip, 'id' | 'stops' | 'budget' | 'createdAt' | 'status'> & { status?: Trip['status'] }): Promise<Trip> {
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
    budget: {
      tripId: id,
      total: 0,
      averagePerDay: 0,
      dailyLimit: 0,
      lineItems: [],
      daily: [],
    },
    createdAt: new Date().toISOString(),
  };
  mockTrips.push(trip);
  return delay(trip);
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | undefined> {
  const idx = mockTrips.findIndex((t) => t.id === id);
  if (idx === -1) return delay(undefined);
  mockTrips[idx] = { ...mockTrips[idx], ...updates, id: mockTrips[idx].id };
  return delay(mockTrips[idx]);
}

export async function deleteTrip(id: string): Promise<boolean> {
  const idx = mockTrips.findIndex((t) => t.id === id);
  if (idx === -1) return delay(false);
  mockTrips.splice(idx, 1);
  return delay(true);
}
