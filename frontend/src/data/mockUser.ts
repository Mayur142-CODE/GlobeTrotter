import type { User } from '@/types/user';

export const mockUser: User = {
  id: 'user-001',
  name: 'Aarav Mehta',
  email: 'aarav.mehta@globetrotter.app',
  avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
  language: 'English',
  savedDestinationIds: ['city-kyoto', 'city-bali', 'city-prague'],
  role: 'traveler',
  joinedAt: '2024-03-15T10:00:00Z',
};
