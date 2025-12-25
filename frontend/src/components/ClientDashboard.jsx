import { useState, useEffect } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../utils/api";
import ThemeToggle from "./ThemeToggle";
import PermissionGuard from "./PermissionGuard";
import "../styles/Dashboard.css";
import "../styles/Dashboard-mobile.css";

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get("/dashboard/client");
      setDashboardData(data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="dashboard">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="logo">
          <span className="logo-icon">{"</>"}</span>
          <span className="logo-text">DSA MENTOR</span>
        </div>
        <nav>
          <NavLink to="/dashboard/client" end onClick={closeSidebar} aria-label="Go to Home">
            <span className="nav-icon" aria-hidden="true">🏠</span>
            <span className="nav-text">Home</span>
          </NavLink>
          <NavLink to="/dashboard/client/practice" onClick={closeSidebar} aria-label="Go to Practice">
            <span className="nav-icon" aria-hidden="true">📝</span>
            <span className="nav-text">Practice</span>
          </NavLink>
          <NavLink to="/dashboard/client/mentor" onClick={closeSidebar} aria-label="Go to AI Mentor">
            <span className="nav-icon" aria-hidden="true">👨‍🏫</span>
            <span className="nav-text">AI Mentor</span>
          </NavLink>
          <NavLink to="/dashboard/client/interview" onClick={closeSidebar} aria-label="Go to AI Interview">
            <span className="nav-icon" aria-hidden="true">🎤</span>
            <span className="nav-text">AI Interview</span>
          </NavLink>
          <NavLink to="/dashboard/client/analytics" onClick={closeSidebar} aria-label="Go to Analytics">
            <span className="nav-icon" aria-hidden="true">📊</span>
            <span className="nav-text">Analytics</span>
          </NavLink>
          <NavLink to="/dashboard/client/achievements" onClick={closeSidebar} aria-label="Go to Achievements">
            <span className="nav-icon" aria-hidden="true">🏆</span>
            <span className="nav-text">Achievements</span>
          </NavLink>
          <NavLink to="/dashboard/client/settings" onClick={closeSidebar} aria-label="Go to Settings">
            <span className="nav-icon" aria-hidden="true">⚙️</span>
            <span className="nav-text">Settings</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.username} />
              ) : (
                user?.username?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          {/* Hamburger Menu for Mobile */}
          <button 
            className="hamburger-menu" 
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            aria-expanded={isSidebarOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="search-bar" role="search">
            <input 
              type="text" 
              placeholder="Search problems, topics..." 
              aria-label="Search problems and topics"
            />
          </div>
          <div className="user-info">
            <ThemeToggle />
            <span className="streak" aria-label={`Current streak: ${dashboardData?.stats?.streak || 0} days`}>
              Streak: {dashboardData?.stats?.streak || 0} 🔥
            </span>
            <div className="avatar" aria-label={`User avatar for ${user?.username}`}>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.username} />
              ) : (
                user?.username?.charAt(0).toUpperCase()
              )}
            </div>
            <button onClick={handleLogout} className="logout-btn" aria-label="Logout from account">
              Logout
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default ClientDashboard;
