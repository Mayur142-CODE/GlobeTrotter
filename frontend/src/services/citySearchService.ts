import type { City, Region } from '@/types/city';
import { mockCities } from '@/data/mockCities';

const LATENCY = 400;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

export interface CitySearchFilters {
  region?: Region | 'All';
  maxCostIndex?: number;
  sortBy?: 'popularity' | 'costLow' | 'costHigh' | 'name';
}

export async function searchCities(query: string, filters?: CitySearchFilters): Promise<City[]> {
  let results = [...mockCities];
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }
  if (filters?.region && filters.region !== 'All') {
    results = results.filter((c) => c.region === filters.region);
  }
  if (filters?.maxCostIndex != null) {
    results = results.filter((c) => c.costIndex <= filters.maxCostIndex!);
  }
  switch (filters?.sortBy) {
    case 'popularity':
      results.sort((a, b) => b.popularity - a.popularity);
      break;
    case 'costLow':
      results.sort((a, b) => a.costIndex - b.costIndex);
      break;
    case 'costHigh':
      results.sort((a, b) => b.costIndex - a.costIndex);
      break;
    case 'name':
      results.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  return delay(results);
}
