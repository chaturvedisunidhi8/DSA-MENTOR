import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./components/Login";
import ClientDashboard from "./components/ClientDashboard";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import LandingPage from "./pages/LandingPage";
import useAuth from "./hooks/useAuth";

// Client Pages
import HomePage from "./pages/client/HomePage";
import PracticePage from "./pages/client/PracticePage";
import ProblemDetailPage from "./pages/client/ProblemDetailPage";
import MentorPage from "./pages/client/MentorPage";
import AnalyticsPage from "./pages/client/AnalyticsPage";
import AchievePage from "./pages/client/AchievePage";
import SettingsPage from "./pages/client/SettingsPage";

// Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import UsersPage from "./pages/admin/UsersPage";
import ProblemsPage from "./pages/admin/ProblemsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // If user is not the required role, redirect to their appropriate dashboard
    if (user?.role === "superadmin") {
      return <Navigate to="/dashboard/admin" replace />;
    }
    return <Navigate to="/dashboard/client" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated) {
    if (user?.role === "superadmin") {
      return <Navigate to="/dashboard/admin" replace />;
    }
    return <Navigate to="/dashboard/client" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Login Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
      {/* Client Dashboard Routes */}
      <Route
        path="/dashboard/client"
        element={
          <ProtectedRoute>
            <ClientDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="practice/:slug" element={<ProblemDetailPage />} />
        <Route path="mentor" element={<MentorPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="achievements" element={<AchievePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Admin Dashboard Routes */}
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute requiredRole="superadmin">
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="problems" element={<ProblemsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
      
      {/* Legacy route redirects */}
      <Route path="/dashboard" element={<Navigate to="/dashboard/client" replace />} />
      <Route path="/superadmin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
      
      {/* Catch all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
