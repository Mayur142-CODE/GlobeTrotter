import { supabase } from '@/lib/supabase';
import type { City, Region } from '@/types/city';

export interface SavedDestinationRecord {
  id: string;
  user_id: string;
  destination_id: string;
  created_at: string;
  destinations?: {
    id: string;
    name: string;
    country: string;
    region?: string | null;
    image_url?: string | null;
    cost_index?: number | null;
    popularity_score?: number | null;
    description?: string | null;
  };
}

/**
 * Fetch all saved destinations for a given user from Supabase.
 */
export async function getSavedDestinations(userId?: string): Promise<City[]> {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: userData } = await supabase.auth.getUser();
      targetUserId = userData.user?.id;
    }

    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('saved_destinations')
      .select(`
        id,
        user_id,
        destination_id,
        created_at,
        destinations (
          id,
          name,
          country,
          region,
          image_url,
          cost_index,
          popularity_score,
          description
        )
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('[GlobeTrotter] getSavedDestinations notice:', error?.message);
      return [];
    }

    return (data as unknown as SavedDestinationRecord[])
      .filter((item) => !!item.destinations)
      .map((item) => {
        const d = item.destinations!;
        return {
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
        };
      });
  } catch (err) {
    console.warn('[GlobeTrotter] getSavedDestinations exception:', err);
    return [];
  }
}

/**
 * Get just the list of saved destination IDs for fast checks.
 */
export async function getSavedDestinationIds(userId?: string): Promise<string[]> {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: userData } = await supabase.auth.getUser();
      targetUserId = userData.user?.id;
    }

    if (!targetUserId) return [];

    const { data, error } = await supabase
      .from('saved_destinations')
      .select('destination_id')
      .eq('user_id', targetUserId);

    if (error || !data) return [];
    return data.map((d: { destination_id: string }) => d.destination_id);
  } catch {
    return [];
  }
}

/**
 * Save / Bookmark a destination for the current user.
 */
export async function saveDestination(destinationId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to save destinations.');

  const { error } = await supabase.from('saved_destinations').insert({
    user_id: userId,
    destination_id: destinationId,
  });

  if (error && error.code !== '23505') {
    // 23505 is unique violation (already saved), which is fine
    throw new Error(error.message || 'Failed to save destination');
  }
  return true;
}

/**
 * Unsave / Remove bookmark for a destination.
 */
export async function unsaveDestination(destinationId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('You must be signed in to modify saved destinations.');

  const { error } = await supabase
    .from('saved_destinations')
    .delete()
    .eq('user_id', userId)
    .eq('destination_id', destinationId);

  if (error) {
    throw new Error(error.message || 'Failed to remove saved destination');
  }
  return true;
}
