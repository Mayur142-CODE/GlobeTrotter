/**
 * authService.js
 *
 * Mock authentication service.
 * All methods are async and return { data, error } to mirror Supabase client shape.
 * Replace each method body with real Supabase calls when the backend is ready.
 *
 * Example future replacement for login:
 *   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
 *   return { data, error };
 */

// Simulated network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock user store (in-memory)
const mockUsers = [
  {
    id: 'mock-user-001',
    email: 'traveler@globetrotter.app',
    password: 'password123',
    firstName: 'Alex',
    lastName: 'Mercer',
  },
];

export const authService = {
  /**
   * Login with email and password.
   * @param {{ email: string, password: string }} credentials
   * @returns {Promise<{ data: object|null, error: Error|null }>}
   */
  login: async ({ email, password }) => {
    await delay(1500); // Simulate network latency

    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return {
        data: null,
        error: new Error('Invalid email or password. Please try again.'),
      };
    }

    const { password: _pwd, ...safeUser } = user;
    return {
      data: { user: safeUser, session: { token: 'mock-token-xyz', userId: user.id } },
      error: null,
    };
  },

  /**
   * Register a new user account.
   * @param {{ firstName: string, lastName: string, email: string, password: string, phone?: string, city?: string, country?: string, additionalInfo?: string }} userData
   * @returns {Promise<{ data: object|null, error: Error|null }>}
   */
  register: async (userData) => {
    await delay(1800); // Simulate network latency

    const existingUser = mockUsers.find((u) => u.email === userData.email);
    if (existingUser) {
      return {
        data: null,
        error: new Error('An account with this email already exists.'),
      };
    }

    const newUser = {
      id: `mock-user-${Date.now()}`,
      ...userData,
    };

    mockUsers.push(newUser);

    const { password: _pwd, ...safeUser } = newUser;
    return {
      data: { user: safeUser },
      error: null,
    };
  },

  /**
   * Log out the current user.
   * @returns {Promise<{ error: Error|null }>}
   */
  logout: async () => {
    await delay(300);
    return { error: null };
  },

  /**
   * Get the current session (mock always returns null — no persistence).
   * @returns {Promise<{ data: { session: null }, error: null }>}
   */
  getSession: async () => {
    return { data: { session: null }, error: null };
  },
};
