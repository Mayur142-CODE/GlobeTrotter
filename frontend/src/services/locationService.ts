import type { Country, CityLocation } from '@/types/location';
import { countriesData } from '@/data/countriesData';
import { citiesData } from '@/data/citiesData';

const LATENCY = 150;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Fetch all available countries sorted alphabetically.
 */
export async function getCountries(): Promise<Country[]> {
  try {
    const sorted = [...countriesData].sort((a, b) => a.name.localeCompare(b.name));
    return await delay(sorted);
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
        // Prioritize exact prefix match
        const aStarts = a.name.toLowerCase().startsWith(q);
        const bStarts = b.name.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
      });
    return await delay(filtered, 80);
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
 * Dynamic search for cities within a selected country.
 * Returns matching cities filtered by name or state (case-insensitive, trimmed).
 */
export async function searchCities(countryId: string, query = ''): Promise<CityLocation[]> {
  try {
    if (!countryId) {
      return [];
    }

    const country = getCountryById(countryId);
    const targetCountryId = country?.id || countryId;

    // Filter cities by selected country
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

    // Sort: exact matches first, then prefix matches, then alphabetical
    countryCities.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();
      if (aLower === q) return -1;
      if (bLower === q) return 1;
      const aStarts = aLower.startsWith(q);
      const bStarts = bLower.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    return await delay(countryCities, 120);
  } catch (err) {
    console.error(`Error searching cities for country ${countryId}:`, err);
    throw new Error('Unable to load cities.');
  }
}

/**
 * Find city by its identifier.
 */
export function getCityById(cityId: string): CityLocation | undefined {
  if (!cityId) return undefined;
  return citiesData.find((c) => c.id.toLowerCase() === cityId.toLowerCase());
}
