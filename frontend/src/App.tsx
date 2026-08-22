import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useParams } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/hooks/use-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const MyTrips = lazy(() => import('@/pages/MyTrips'));
const CreateTrip = lazy(() => import('@/pages/CreateTrip'));
const ItineraryBuilder = lazy(() => import('@/pages/ItineraryBuilder'));
const ItineraryView = lazy(() => import('@/pages/ItineraryView'));
const CitySearch = lazy(() => import('@/pages/CitySearch'));
const ActivitySearch = lazy(() => import('@/pages/ActivitySearch'));
const TripBudget = lazy(() => import('@/pages/TripBudget'));
const TripCalendar = lazy(() => import('@/pages/TripCalendar'));
const SharedItinerary = lazy(() => import('@/pages/SharedItinerary'));
const Profile = lazy(() => import('@/pages/Profile'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function TripRedirect() {
  const { tripId } = useParams();
  return <Navigate to={`/itinerary/${tripId}/view`} replace />;
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-parchment">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 pb-16 md:pb-0">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function PublicLayout() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Outlet />
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication & Callback Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/register" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/shared/:tripId" element={<SharedItinerary />} />
            </Route>

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trips" element={<MyTrips />} />
                <Route path="/trips/create" element={<CreateTrip />} />
                <Route path="/trips/:tripId" element={<TripRedirect />} />
                <Route path="/itinerary/:tripId" element={<ItineraryBuilder />} />
                <Route path="/itinerary/:tripId/view" element={<ItineraryView />} />
                <Route path="/search/cities" element={<CitySearch />} />
                <Route path="/search/activities" element={<ActivitySearch />} />
                <Route path="/trip/:tripId/budget" element={<TripBudget />} />
                <Route path="/trip/:tripId/calendar" element={<TripCalendar />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* Default Navigation */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
