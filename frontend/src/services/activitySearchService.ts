import type { Activity, ActivityCategory } from '@/types/activity';
import { mockActivities } from '@/data/mockActivities';

const LATENCY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

export interface ActivitySearchFilters {
  category?: ActivityCategory | 'All';
  maxPrice?: number;
  maxDuration?: number;
  sortBy?: 'popularity' | 'priceLow' | 'priceHigh' | 'duration';
}

export async function searchActivities(cityId: string, query: string, filters?: ActivitySearchFilters): Promise<Activity[]> {
  let results = mockActivities.filter((a) => a.cityId === cityId);
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }
  if (filters?.category && filters.category !== 'All') {
    results = results.filter((a) => a.category === filters.category);
  }
  if (filters?.maxPrice != null) {
    results = results.filter((a) => a.price <= filters.maxPrice!);
  }
  if (filters?.maxDuration != null) {
    results = results.filter((a) => a.durationHours <= filters.maxDuration!);
  }
  switch (filters?.sortBy) {
    case 'popularity':
      results.sort((a, b) => b.popularity - a.popularity);
      break;
    case 'priceLow':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'priceHigh':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'duration':
      results.sort((a, b) => a.durationHours - b.durationHours);
      break;
  }
  return delay(results);
}
