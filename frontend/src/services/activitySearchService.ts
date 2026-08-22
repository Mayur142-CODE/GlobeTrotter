import type { Activity, ActivityCategory } from '@/types/activity';
import { supabase } from '@/lib/supabase';

interface ActivityRow {
  id: string;
  destination_id?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  estimated_cost?: number | string | null;
  currency?: string | null;
  duration_minutes?: number | null;
  rating?: number | string | null;
}

export interface ActivitySearchFilters {
  category?: ActivityCategory | 'All';
  maxPrice?: number;
  maxDuration?: number;
  sortBy?: 'popularity' | 'priceLow' | 'priceHigh' | 'duration';
}

export interface CreateActivityPayload {
  cityId: string;
  name: string;
  category: ActivityCategory;
  description: string;
  imageUrl?: string;
  price: number;
  durationHours: number;
  rating?: number;
}

export async function searchActivities(
  cityId: string,
  query: string,
  filters?: ActivitySearchFilters
): Promise<Activity[]> {
  try {
    let sbQuery = supabase.from('activities').select('*');

    if (cityId && cityId !== 'all') {
      sbQuery = sbQuery.eq('destination_id', cityId);
    }

    if (query.trim()) {
      const q = `%${query.trim()}%`;
      sbQuery = sbQuery.or(`name.ilike.${q},description.ilike.${q},category.ilike.${q}`);
    }

    if (filters?.category && filters.category !== 'All') {
      sbQuery = sbQuery.eq('category', filters.category);
    }

    if (filters?.maxPrice != null) {
      sbQuery = sbQuery.lte('estimated_cost', filters.maxPrice);
    }

    if (filters?.maxDuration != null) {
      sbQuery = sbQuery.lte('duration_minutes', filters.maxDuration * 60);
    }

    const { data, error } = await sbQuery;

    if (error || !data) {
      console.warn('[GlobeTrotter] Supabase searchActivities notice:', error?.message);
      return [];
    }

    const results: Activity[] = (data as ActivityRow[]).map((a) => ({
      id: a.id,
      cityId: a.destination_id || cityId,
      name: a.name,
      description: a.description || '',
      category: (a.category as ActivityCategory) || 'Sightseeing',
      imageUrl: a.image_url || 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
      price: Number(a.estimated_cost) || 0,
      currency: a.currency || 'INR',
      durationHours: a.duration_minutes ? Math.round((a.duration_minutes / 60) * 10) / 10 : 2,
      rating: Number(a.rating) || 4.8,
      reviewCount: 120,
      popularity: Math.round((Number(a.rating) || 4.8) * 20),
      location: a.name,
    }));

    if (filters?.sortBy) {
      switch (filters.sortBy) {
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
    } else {
      // Default: sort newest or by rating
      results.sort((a, b) => b.rating - a.rating);
    }

    return results;
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase searchActivities exception:', err);
    return [];
  }
}

export async function createActivity(payload: CreateActivityPayload): Promise<Activity> {
  const duration_minutes = Math.round((payload.durationHours || 1) * 60);

  const { data, error } = await supabase
    .from('activities')
    .insert({
      destination_id: payload.cityId,
      name: payload.name.trim(),
      category: payload.category,
      description: payload.description.trim(),
      image_url: payload.imageUrl?.trim() || 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
      estimated_cost: payload.price || 0,
      duration_minutes,
      rating: payload.rating || 4.8,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create activity in Supabase.');
  }

  const a = data as ActivityRow;
  return {
    id: a.id,
    cityId: a.destination_id || payload.cityId,
    name: a.name,
    description: a.description || '',
    category: (a.category as ActivityCategory) || 'Sightseeing',
    imageUrl: a.image_url || 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
    price: Number(a.estimated_cost) || 0,
    currency: a.currency || 'INR',
    durationHours: a.duration_minutes ? Math.round((a.duration_minutes / 60) * 10) / 10 : 2,
    rating: Number(a.rating) || 4.8,
    reviewCount: 1,
    popularity: Math.round((Number(a.rating) || 4.8) * 20),
    location: a.name,
  };
}

export async function updateActivity(
  id: string,
  updates: Partial<CreateActivityPayload>
): Promise<Activity> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.description !== undefined) payload.description = updates.description.trim();
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl.trim();
  if (updates.price !== undefined) payload.estimated_cost = updates.price;
  if (updates.durationHours !== undefined) payload.duration_minutes = Math.round(updates.durationHours * 60);
  if (updates.cityId !== undefined) payload.destination_id = updates.cityId;

  const { data, error } = await supabase
    .from('activities')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update activity in Supabase.');
  }

  const a = data as ActivityRow;
  return {
    id: a.id,
    cityId: a.destination_id || '',
    name: a.name,
    description: a.description || '',
    category: (a.category as ActivityCategory) || 'Sightseeing',
    imageUrl: a.image_url || 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
    price: Number(a.estimated_cost) || 0,
    currency: a.currency || 'INR',
    durationHours: a.duration_minutes ? Math.round((a.duration_minutes / 60) * 10) / 10 : 2,
    rating: Number(a.rating) || 4.8,
    reviewCount: 1,
    popularity: Math.round((Number(a.rating) || 4.8) * 20),
    location: a.name,
  };
}

export async function deleteActivity(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(error.message);
  }
  if (!data || data.length === 0) {
    console.warn(`[GlobeTrotter] No activity found in Supabase matching ID ${id}`);
  }
  return true;
}
