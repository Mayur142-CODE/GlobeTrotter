import type { Country, CityLocation } from '@/types/location';
import { countriesData } from '@/data/countriesData';
import { citiesData } from '@/data/citiesData';
import { supabase } from '@/lib/supabase';

interface DestinationRow {
  id: string;
  name: string;
  country: string;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Fetch all available countries sorted alphabetically.
 */
export async function getCountries(): Promise<Country[]> {
  try {
    const sorted = [...countriesData].sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  } catch (err) {
    console.error('Error fetching countries:', err);
    throw new Error('Unable to load countries. Please try again.');
  }
}

/**
 * Search countries matching query (by name, iso2, or iso3).
 */
export async function searchCountries(query: string): Promise<Country[]> {
  try {
    const q = query.trim().toLowerCase();
    if (!q) {
      return await getCountries();
    }
    const filtered = countriesData
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.iso2.toLowerCase().includes(q) ||
          c.iso3.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      });
    return filtered;
  } catch (err) {
    console.error('Error searching countries:', err);
    throw new Error('Unable to search countries.');
  }
}

/**
 * Find country by its identifier or ISO code.
 */
export function getCountryById(countryId: string): Country | undefined {
  if (!countryId) return undefined;
  const idLower = countryId.toLowerCase();
  return countriesData.find(
    (c) => c.id.toLowerCase() === idLower || c.iso2.toLowerCase() === idLower || c.name.toLowerCase() === idLower
  );
}

/**
 * Dynamic search for cities within a selected country (queries Supabase destinations table).
 */
export async function searchCities(countryId: string, query = ''): Promise<CityLocation[]> {
  if (!countryId) {
    return [];
  }

  const country = getCountryById(countryId);
  const targetCountryId = country?.id || countryId;

  try {
    const countryName = country?.name || countryId;

    // Try fetching from Supabase destinations
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .ilike('country', `%${countryName}%`);

    if (!error && data && data.length > 0) {
      let results: CityLocation[] = (data as DestinationRow[]).map((d) => ({
        id: d.id,
        countryId: targetCountryId,
        countryName: d.country || countryName,
        name: d.name,
        state: d.region || '',
        latitude: Number(d.latitude) || 0,
        longitude: Number(d.longitude) || 0,
      }));

      const q = query.trim().toLowerCase();
      if (q) {
        results = results.filter((c) => c.name.toLowerCase().includes(q));
      }
      return results;
    }
  } catch (err) {
    console.warn('[GlobeTrotter] Supabase searchCities location notice:', err);
  }

  // Fallback to local citiesData
  let countryCities = citiesData.filter(
    (city) => city.countryId.toLowerCase() === targetCountryId.toLowerCase()
  );

  const q = query.trim().toLowerCase();
  if (q) {
    countryCities = countryCities.filter(
      (city) =>
        city.name.toLowerCase().includes(q) ||
        (city.state && city.state.toLowerCase().includes(q))
    );
  }

  return countryCities;
}

/**
 * Find city by its identifier.
 */
export function getCityById(cityId: string): CityLocation | undefined {
  if (!cityId) return undefined;
  return citiesData.find((c) => c.id.toLowerCase() === cityId.toLowerCase());
}
