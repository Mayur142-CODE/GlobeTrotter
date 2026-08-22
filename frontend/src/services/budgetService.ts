import type { BudgetBreakdown } from '@/types/budget';
import { getTripById } from '@/data/mockTrips';

const LATENCY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

export async function getBudgetBreakdown(tripId: string): Promise<BudgetBreakdown | undefined> {
  const trip = getTripById(tripId);
  return delay(trip ? trip.budget : undefined);
}
