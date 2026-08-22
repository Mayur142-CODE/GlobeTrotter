import type { Trip } from '@/types/trip';
import type { Stop } from '@/types/stop';
import type { BudgetBreakdown } from '@/types/budget';
import { getCityById } from './mockCities';
import { getActivitiesByCity } from './mockActivities';

function buildBudget(tripId: string, total: number, days: number, overBudgetDays: number[] = []): BudgetBreakdown {
  const transport = Math.round(total * 0.32);
  const accommodation = Math.round(total * 0.28);
  const activities = Math.round(total * 0.22);
  const meals = Math.round(total * 0.13);
  const misc = total - transport - accommodation - activities - meals;
  const dailyLimit = Math.round(total / days);
  const daily = Array.from({ length: days }, (_, i) => {
    const variance = 0.7 + ((i * 37) % 60) / 100;
    const amount = Math.round(dailyLimit * variance);
    return {
      date: new Date(2025, 8, 12 + i).toISOString(),
      amount,
      overBudget: overBudgetDays.includes(i) || amount > dailyLimit * 1.1,
    };
  });
  return {
    tripId,
    total,
    averagePerDay: dailyLimit,
    dailyLimit,
    lineItems: [
      { category: 'Transport', amount: transport, percentage: Math.round((transport / total) * 100) },
      { category: 'Accommodation', amount: accommodation, percentage: Math.round((accommodation / total) * 100) },
      { category: 'Activities', amount: activities, percentage: Math.round((activities / total) * 100) },
      { category: 'Meals', amount: meals, percentage: Math.round((meals / total) * 100) },
      { category: 'Misc', amount: misc, percentage: Math.round((misc / total) * 100) },
    ],
    daily,
  };
}

function buildStop(
  tripId: string,
  cityId: string,
  order: number,
  startDate: string,
  endDate: string,
  activityIds: string[],
  notes?: string
): Stop {
  const city = getCityById(cityId)!;
  const allCityActivities = getActivitiesByCity(cityId);
  const activities = activityIds
    .map((id) => allCityActivities.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  return {
    id: `stop-${tripId}-${cityId}`,
    tripId,
    cityId,
    city,
    order,
    startDate,
    endDate,
    activities,
    notes,
  };
}

export const mockTrips: Trip[] = [
  {
    id: 'trip-001',
    name: 'Europe Summer Journal',
    description: 'A 12-day rail journey through three iconic European capitals, from Parisian boulevards to Prague\'s spires.',
    startDate: '2025-09-12',
    endDate: '2025-09-23',
    coverPhotoUrl: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg?auto=compress&cs=tinysrgb&w=1200',
    status: 'upcoming',
    createdAt: '2025-07-20T09:00:00Z',
    stops: [
      buildStop('trip-001', 'city-paris', 1, '2025-09-12', '2025-09-15', ['act-paris-eiffel', 'act-paris-louvre', 'act-paris-food'], 'Arrive CDG 10:00, check into Le Marais hotel.'),
      buildStop('trip-001', 'city-amsterdam', 2, '2025-09-15', '2025-09-19', ['act-ams-canal', 'act-ams-vanGogh', 'act-ams-bike'], 'Thalys train from Paris Nord.'),
      buildStop('trip-001', 'city-prague', 3, '2025-09-19', '2025-09-23', ['act-prague-castle', 'act-prague-beer'], 'Overnight EuroCity train.'),
    ],
    budget: buildBudget('trip-001', 142000, 12, [4, 7]),
  },
  {
    id: 'trip-002',
    name: 'Japan Spring Sojourn',
    description: 'Cherry blossoms and ancient temples across Tokyo and Kyoto in peak sakura season.',
    startDate: '2025-04-02',
    endDate: '2025-04-11',
    coverPhotoUrl: 'https://images.pexels.com/photos/161251/kyoto-japan-temple-zen-161251.jpeg?auto=compress&cs=tinysrgb&w=1200',
    status: 'active',
    createdAt: '2025-01-15T09:00:00Z',
    stops: [
      buildStop('trip-002', 'city-tokyo', 1, '2025-04-02', '2025-04-06', ['act-tokyo-shibuya', 'act-tokyo-sushi', 'act-tokyo-temple'], 'Land at Haneda, Narita Express to Shinjuku.'),
      buildStop('trip-002', 'city-kyoto', 2, '2025-04-06', '2025-04-11', ['act-kyoto-fushimi', 'act-kyoto-tea'], 'Shinkansen Nozomi to Kyoto Station.'),
    ],
    budget: buildBudget('trip-002', 168000, 10, [3]),
  },
  {
    id: 'trip-003',
    name: 'Mediterranean Escapade',
    description: 'A sun-drenched loop through Rome and Barcelona with pasta, Gaudí, and Mediterranean sunsets.',
    startDate: '2024-10-05',
    endDate: '2024-10-16',
    coverPhotoUrl: 'https://images.pexels.com/photos/819764/pexels-photo-819764.jpeg?auto=compress&cs=tinysrgb&w=1200',
    status: 'completed',
    createdAt: '2024-08-01T09:00:00Z',
    stops: [
      buildStop('trip-003', 'city-rome', 1, '2024-10-05', '2024-10-10', ['act-rome-colosseum', 'act-rome-pasta'], 'Vatican early-entry booked.'),
      buildStop('trip-003', 'city-barcelona', 2, '2024-10-10', '2024-10-16', ['act-bcn-sagrada', 'act-bcn-tapas'], 'Vueling flight FCO-BCN.'),
    ],
    budget: buildBudget('trip-003', 134000, 12),
  },
  {
    id: 'trip-004',
    name: 'Southeast Asia Discovery',
    description: 'A draft itinerary exploring Singapore\'s gardens and Bali\'s rice terraces — dates flexible.',
    startDate: '2026-01-15',
    endDate: '2026-01-28',
    coverPhotoUrl: 'https://images.pexels.com/photos/1802255/pexels-photo-1802255.jpeg?auto=compress&cs=tinysrgb&w=1200',
    status: 'draft',
    createdAt: '2025-08-10T09:00:00Z',
    stops: [
      buildStop('trip-004', 'city-singapore', 1, '2026-01-15', '2026-01-20', ['act-sg-gardens'], 'Stopover to acclimatize.'),
      buildStop('trip-004', 'city-bali', 2, '2026-01-20', '2026-01-28', ['act-bali-rice', 'act-bali-spa'], 'Scooter rental booked in Ubud.'),
    ],
    budget: buildBudget('trip-004', 98000, 14, [5, 6]),
  },
];

export function getTripById(id: string): Trip | undefined {
  return mockTrips.find((t) => t.id === id);
}
