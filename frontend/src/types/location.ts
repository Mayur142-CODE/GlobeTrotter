export interface Country {
  id: string; // ISO 2-letter code or UUID (e.g. 'IN', 'US')
  name: string;
  iso2: string;
  iso3: string;
  flag: string;
  region: string;
  currency?: string;
  phoneCode?: string;
}

export interface CityLocation {
  id: string;
  name: string;
  countryId: string;
  countryName: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}
