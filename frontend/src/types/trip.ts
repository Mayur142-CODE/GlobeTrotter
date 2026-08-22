import type { Stop } from './stop';
import type { BudgetBreakdown } from './budget';

export type TripStatus = 'upcoming' | 'active' | 'completed' | 'draft';

export interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO
  endDate: string; // ISO
  coverPhotoUrl: string;
  status: TripStatus;
  stops: Stop[];
  budget: BudgetBreakdown;
  createdAt: string;
}
