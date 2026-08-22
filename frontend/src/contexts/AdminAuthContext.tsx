import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  adminEmail: string | null;
  adminLogin: (email: string, pass: string) => Promise<boolean>;
  adminLogout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = 'globetrotter_admin_session';
const VALID_ADMIN_EMAIL = 'admin@globaltrotter.com';
const VALID_ADMIN_PASS = 'admin#123';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY) || sessionStorage.getItem(ADMIN_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      return stored === 'true' ? VALID_ADMIN_EMAIL : null;
    } catch {
      return null;
    }
  });

  const adminLogin = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (cleanEmail === VALID_ADMIN_EMAIL.toLowerCase() && cleanPass === VALID_ADMIN_PASS) {
      try {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      } catch (err) {
        console.warn('[GlobeTrotter Admin] Storage notice:', err);
      }
      setIsAdminAuthenticated(true);
      setAdminEmail(VALID_ADMIN_EMAIL);
      return true;
    }

    return false;
  };

  const adminLogout = () => {
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch (err) {
      console.warn('[GlobeTrotter Admin] Storage cleanup notice:', err);
    }
    setIsAdminAuthenticated(false);
    setAdminEmail(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAdminAuthenticated,
        adminEmail,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
