export type ActivityCategory =
  | 'Sightseeing'
  | 'Food & Drink'
  | 'Adventure'
  | 'Culture'
  | 'Nature'
  | 'Nightlife'
  | 'Shopping'
  | 'Relaxation';

export interface Activity {
  id: string;
  cityId: string;
  name: string;
  category: ActivityCategory;
  description: string;
  imageUrl: string;
  price: number; // INR
  durationHours: number;
  popularity: number; // 0-100
  rating: number; // 0-5
  scheduledDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  currency?: string;
  reviewCount?: number;
  location?: string;
}
