import type { City } from './city';
import type { Activity } from './activity';

export interface Stop {
  id: string;
  tripId: string;
  cityId: string;
  city: City;
  order: number;
  startDate: string; // ISO
  endDate: string; // ISO
  activities: Activity[];
  notes?: string;
}
