/**
 * useAuth.js
 *
 * React hook providing authentication state and actions.
 * Wraps authService to keep page components clean and auth-logic-free.
 */

import { useState, useCallback } from 'react';
import { authService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    const { data, error: authError } = await authService.login(credentials);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return { success: false, error: authError.message };
    }
    setUser(data.user);
    return { success: true, data };
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    const { data, error: authError } = await authService.register(userData);
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return { success: false, error: authError.message };
    }
    return { success: true, data };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    clearError,
  };
}
