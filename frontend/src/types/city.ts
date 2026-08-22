export type Region = 'Europe' | 'Asia' | 'Middle East' | 'Southeast Asia' | 'North America';

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: Region;
  imageUrl: string;
  costIndex: number; // 1-100, higher = more expensive
  popularity: number; // 0-100
  description: string;
  timezone: string;
}
