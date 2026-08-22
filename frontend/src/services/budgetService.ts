import type { BudgetBreakdown } from '@/types/budget';
import { getTripById } from '@/data/mockTrips';
import { getTrip } from './tripService';

export async function getBudgetBreakdown(tripId: string): Promise<BudgetBreakdown | undefined> {
  try {
    const trip = await getTrip(tripId);
    if (trip && trip.budget) {
      return trip.budget;
    }
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase getBudgetBreakdown notice:', err);
  }

  const mockTrip = getTripById(tripId);
  return mockTrip ? mockTrip.budget : undefined;
}
