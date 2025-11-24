import { useNavigate, NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import "../styles/Dashboard.css";

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard superadmin">
      <aside className="sidebar admin-sidebar">
        <div className="logo">
          <span>{"</>"}</span>
          <span className="admin-badge">ADMIN</span>
        </div>
        <nav>
          <NavLink to="/superadmin/dashboard" end>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          <NavLink to="/superadmin/dashboard/users">
            <span className="nav-icon">👥</span>
            <span className="nav-text">Users</span>
          </NavLink>
          <NavLink to="/superadmin/dashboard/problems">
            <span className="nav-icon">📝</span>
            <span className="nav-text">Problems</span>
          </NavLink>
          <NavLink to="/superadmin/dashboard/analytics">
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics</span>
          </NavLink>
          <NavLink to="/superadmin/dashboard/reports">
            <span className="nav-icon">📋</span>
            <span className="nav-text">Reports</span>
          </NavLink>
          <NavLink to="/superadmin/dashboard/settings">
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
          <div className="user-info">
            <ThemeToggle />
            <span className="role-badge">SuperAdmin</span>
            <div className="avatar">{user?.username?.charAt(0).toUpperCase()}</div>
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

export default SuperAdminDashboard;
