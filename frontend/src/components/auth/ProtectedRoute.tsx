import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Plane } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isEmailVerified, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-midnight text-parchment-50 px-4">
        <div className="w-14 h-14 rounded-2xl bg-teal/20 border border-teal/40 flex items-center justify-center mb-4 animate-pulse">
          <Plane className="w-7 h-7 text-teal animate-bounce" />
        </div>
        <h2 className="font-serif text-xl font-semibold mb-1">GlobeTrotter</h2>
        <p className="font-sans text-xs text-parchment-100/60">Preparing your journey...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
