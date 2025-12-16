import { useState, useEffect } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import api from "../utils/api";
import ThemeToggle from "./ThemeToggle";
import "../styles/Dashboard.css";

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
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

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">{"</>"}</span>
          <span className="logo-text">DSA MENTOR</span>
        </div>
        <nav>
          <NavLink to="/dashboard/client" end>
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </NavLink>
          <NavLink to="/dashboard/client/practice">
            <span className="nav-icon">📝</span>
            <span className="nav-text">Practice</span>
          </NavLink>
          <NavLink to="/dashboard/client/mentor">
            <span className="nav-icon">👨‍🏫</span>
            <span className="nav-text">AI Mentor</span>
          </NavLink>
          <NavLink to="/dashboard/client/analytics">
            <span className="nav-icon">📊</span>
            <span className="nav-text">Analytics</span>
          </NavLink>
          <NavLink to="/dashboard/client/achievements">
            <span className="nav-icon">🏆</span>
            <span className="nav-text">Achievements</span>
          </NavLink>
          <NavLink to="/dashboard/client/settings">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <p className="user-name">{user?.username}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="search-bar">
            <input type="text" placeholder="Search problems, topics..." />
          </div>
          <div className="user-info">
            <ThemeToggle />
            <span className="streak">
              Streak: {dashboardData?.stats?.streak || 0} 🔥
            </span>
            <div className="avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} className="logout-btn">
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
