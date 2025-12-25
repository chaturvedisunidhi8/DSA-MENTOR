import { useNavigate, NavLink, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import PermissionGuard from "./PermissionGuard";
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
          <span className="logo-icon">{"</>"}</span>
          <span className="logo-text">DSA MENTOR</span>
          <span className="admin-badge">ADMIN</span>
        </div>
        <nav>
          <NavLink to="/dashboard/admin" end>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          <PermissionGuard permission="manage:users">
            <NavLink to="/dashboard/admin/users">
              <span className="nav-icon">👥</span>
              <span className="nav-text">User Management</span>
            </NavLink>
          </PermissionGuard>
          <PermissionGuard permission="manage:roles">
            <NavLink to="/dashboard/admin/roles">
              <span className="nav-icon">🔐</span>
              <span className="nav-text">Roles & Permissions</span>
            </NavLink>
          </PermissionGuard>
          <PermissionGuard permissions={["read:problems", "create:problems", "update:problems", "delete:problems"]}>
            <NavLink to="/dashboard/admin/problems">
              <span className="nav-icon">📝</span>
              <span className="nav-text">Problems</span>
            </NavLink>
          </PermissionGuard>
          <PermissionGuard permission="view:analytics">
            <NavLink to="/dashboard/admin/analytics">
              <span className="nav-icon">📈</span>
              <span className="nav-text">Analytics</span>
            </NavLink>
          </PermissionGuard>
          <PermissionGuard permission="view:reports">
            <NavLink to="/dashboard/admin/reports">
              <span className="nav-icon">📋</span>
              <span className="nav-text">Reports</span>
            </NavLink>
          </PermissionGuard>
          <PermissionGuard permission="manage:settings">
            <NavLink to="/dashboard/admin/settings">
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </NavLink>
          </PermissionGuard>
        </nav>
        <div className="sidebar-footer">
          <div className="user-profile admin-profile">
            <div className="user-avatar admin-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <p className="user-name">{user?.username}</p>
              <p className="user-role">Super Admin</p>
            </div>
          </div>
        </div>
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
