import type { City, Region } from '@/types/city';
import { supabase } from '@/lib/supabase';

interface DestinationRow {
  id: string;
  name: string;
  country: string;
  region?: string | null;
  image_url?: string | null;
  cost_index?: number | null;
  popularity_score?: number | null;
  description?: string | null;
}

export interface CitySearchFilters {
  region?: Region | 'All';
  maxCostIndex?: number;
  sortBy?: 'popularity' | 'costLow' | 'costHigh' | 'name';
}

export interface CreateCityPayload {
  name: string;
  country: string;
  region: Region;
  description: string;
  imageUrl?: string;
  costIndex?: number;
  popularity?: number;
}

export async function searchCities(query: string, filters?: CitySearchFilters): Promise<City[]> {
  try {
    let sbQuery = supabase.from('destinations').select('*');

    if (query.trim()) {
      const q = `%${query.trim()}%`;
      sbQuery = sbQuery.or(`name.ilike.${q},country.ilike.${q},region.ilike.${q},description.ilike.${q}`);
    }

    if (filters?.region && filters.region !== 'All') {
      sbQuery = sbQuery.eq('region', filters.region);
    }

    if (filters?.maxCostIndex != null) {
      sbQuery = sbQuery.lte('cost_index', filters.maxCostIndex);
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'popularity':
          sbQuery = sbQuery.order('popularity_score', { ascending: false });
          break;
        case 'costLow':
          sbQuery = sbQuery.order('cost_index', { ascending: true });
          break;
        case 'costHigh':
          sbQuery = sbQuery.order('cost_index', { ascending: false });
          break;
        case 'name':
          sbQuery = sbQuery.order('name', { ascending: true });
          break;
      }
    } else {
      sbQuery = sbQuery.order('popularity_score', { ascending: false });
    }

    const { data, error } = await sbQuery;

    if (error || !data) {
      console.warn('[GlobeTrotter] Supabase searchCities notice:', error?.message);
      return [];
    }

    return (data as DestinationRow[]).map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      countryCode: d.country?.slice(0, 2).toUpperCase() || 'GL',
      region: (d.region as Region) || 'Asia',
      imageUrl: d.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      costIndex: d.cost_index || 50,
      popularity: d.popularity_score || 80,
      description: d.description || '',
      timezone: 'UTC',
    }));
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase searchCities exception:', err);
    return [];
  }
}

export async function createCity(payload: CreateCityPayload): Promise<City> {
  const { data, error } = await supabase
    .from('destinations')
    .insert({
      name: payload.name.trim(),
      country: payload.country.trim(),
      region: payload.region,
      description: payload.description.trim(),
      image_url: payload.imageUrl?.trim() || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      cost_index: payload.costIndex || 50,
      popularity_score: payload.popularity || 85,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create destination in Supabase.');
  }

  const d = data as DestinationRow;
  return {
    id: d.id,
    name: d.name,
    country: d.country,
    countryCode: d.country?.slice(0, 2).toUpperCase() || 'GL',
    region: (d.region as Region) || 'Asia',
    imageUrl: d.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    costIndex: d.cost_index || 50,
    popularity: d.popularity_score || 85,
    description: d.description || '',
    timezone: 'UTC',
  };
}

export async function updateCity(id: string, updates: Partial<CreateCityPayload>): Promise<City> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.country !== undefined) payload.country = updates.country.trim();
  if (updates.region !== undefined) payload.region = updates.region;
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl.trim();
  if (updates.costIndex !== undefined) payload.cost_index = updates.costIndex;
  if (updates.popularity !== undefined) payload.popularity_score = updates.popularity;

  const { data, error } = await supabase
    .from('destinations')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update destination in Supabase.');
  }

  const d = data as DestinationRow;
  return {
    id: d.id,
    name: d.name,
    country: d.country,
    countryCode: d.country?.slice(0, 2).toUpperCase() || 'GL',
    region: (d.region as Region) || 'Asia',
    imageUrl: d.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
    costIndex: d.cost_index || 50,
    popularity: d.popularity_score || 85,
    description: d.description || '',
    timezone: 'UTC',
  };
}

export async function deleteCity(id: string): Promise<boolean> {
  const { data, error } = await supabase.from('destinations').delete().eq('id', id).select('id');
  if (error) {
    throw new Error(error.message);
  }
  return true;
}
