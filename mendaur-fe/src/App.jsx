import { lazy, Suspense, useEffect } from 'react'
import {Routes, Route, Navigate} from 'react-router-dom'
import "./index.css"
import { useAuth } from './Components/Pages/context/AuthContext'
import BottomNav from './Components/BottomNav/bottomNav'
import OfflineIndicator from './Components/OfflineIndicator/OfflineIndicator'

// Loading component for Suspense - Optimized with minimal render
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: '16px',
    background: '#f9fafb'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #16a34a',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <span style={{ color: '#6b7280', fontSize: '14px' }}>Memuat...</span>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Auth Pages - Load immediately (small, critical for first paint)
import Login from "./Components/Pages/login/login"

// Lazy load with prefetch support - User Critical Pages
const Layout = lazy(() => import("./Components/Pages/home/Layout"))
const HomeContent = lazy(() => import("./Components/Pages/home/homeContent"))

// Lazy load other pages for faster initial load
const Landing = lazy(() => import('./Components/Pages/Landing/Landing'))
const Daftar = lazy(() => import('./Components/Pages/daftar/daftar'))
const Register = lazy(() => import('./Components/Pages/register/register'))
const ForgotPassword = lazy(() => import('./Components/Pages/forgotPassword/forgotPassword'))

// User Pages - Lazy load with prefetch hints
const ArtikelPage = lazy(() => import('./Components/Pages/artikel/artikelPage'))
const ArtikelDetail = lazy(() => import('./Components/Pages/artikelDetail/artikelDetail'))
const Profil = lazy(() => import("./Components/Pages/profil/profil"))
const TabungSampah = lazy(() => import('./Components/Pages/tabungSampah/tabungSampah'))
const RiwayatTabung = lazy(() => import('./Components/Pages/tabungSampah/riwayatTabung'))
const Produk = lazy(() => import("./Components/Pages/produk/produk"))
const ProdukDetail = lazy(() => import('./Components/Pages/produk/produkDetail'))
const TukarPoin = lazy(() => import("./Components/Pages/tukarPoin/tukarPoin"))
const Leaderboard = lazy(() => import("./Components/Pages/leaderboard/leaderboard"))
const RiwayatTransaksi = lazy(() => import('./Components/Pages/riwayatTransaksi/riwayatTransaksi'))

// Admin Point System Components - Lazy load
const AdminPointDashboard = lazy(() => import('./Components/Pages/pointDashboard/pointDashboard'))
const AdminStatsCard = lazy(() => import('./Components/Pages/pointCard/pointCard'))
const AllUsersHistory = lazy(() => import('./Components/Pages/pointHistory/pointHistory'))
const PointBreakdown = lazy(() => import('./Components/Pages/pointBreakdown/pointBreakdown'))
const AllRedemptions = lazy(() => import('./Components/Pages/redeemHistory/redeemHistory'))

// Admin Dashboard Component - Lazy load
const AdminDashboard = lazy(() => import('./Components/Pages/adminDashboard/AdminDashboard'))

// Prefetch critical user routes after initial render
const prefetchUserRoutes = () => {
  // Only prefetch if user is likely logged in
  const token = localStorage.getItem('token');
  if (token) {
    // Prefetch common user pages after a short delay
    setTimeout(() => {
      import('./Components/Pages/tabungSampah/tabungSampah');
      import('./Components/Pages/profil/profil');
      import('./Components/Pages/leaderboard/leaderboard');
    }, 2000);
  }
};

// Call prefetch on module load (runs once)
if (typeof window !== 'undefined') {
  // Wait for initial render to complete
  requestIdleCallback ? requestIdleCallback(prefetchUserRoutes) : setTimeout(prefetchUserRoutes, 3000);
}

// Protected Route Components
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Admin-only routes
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // User routes - block admins from accessing user dashboard
  if (requiredRole === 'user' && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Prefetch common user pages after login
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      // Prefetch common user pages after a short delay for faster navigation
      const timer = setTimeout(() => {
        import('./Components/Pages/tabungSampah/tabungSampah');
        import('./Components/Pages/profil/profil');
        import('./Components/Pages/leaderboard/leaderboard');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isAdmin]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      {/* Offline Status Indicator */}
      <OfflineIndicator />
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root Route - Redirect based on auth status */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />

        {/* Public Auth Routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/daftar" element={<Daftar />} />

        {/* User Dashboard Routes (Protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="user">
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeContent />} />
        <Route path="artikel" element={<ArtikelPage />} />
        <Route path="artikel/:id" element={<ArtikelDetail />} />
        <Route path="profil" element={<Profil />} />
        <Route path="tabungSampah" element={<TabungSampah/>} />
        <Route path="riwayatTabung" element={<RiwayatTabung/>} />
        <Route path="produk" element={<Produk />} />
        <Route path="produk/:id" element={<ProdukDetail />} />
        <Route path="tukarPoin" element={<TukarPoin />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="riwayatTransaksi" element={<RiwayatTransaksi />} />
      </Route>

      {/* Admin Dashboard Routes (Protected) */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Point System Routes (Protected) */}
      <Route
        path="/admin/dashboard/points"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPointDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard/points/stats"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminStatsCard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard/points/history"
        element={
          <ProtectedRoute requiredRole="admin">
            <AllUsersHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard/points/breakdown"
        element={
          <ProtectedRoute requiredRole="admin">
            <PointBreakdown />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard/points/redemptions"
        element={
          <ProtectedRoute requiredRole="admin">
            <AllRedemptions />
          </ProtectedRoute>
        }
      />

      {/* Catch-all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </>
  );
};

export default App
