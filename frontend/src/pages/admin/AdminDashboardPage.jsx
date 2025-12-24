import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../utils/api";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivity();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get("/dashboard/superadmin");
      setDashboardData(data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await api.get("/dashboard/recent-activity?limit=5");
      setRecentActivity(data.data || []);
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // difference in seconds

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="page-content">
      <div className="welcome">
        <h1>Welcome back, {user?.username}! 👑</h1>
        <p>System Overview & Management Console</p>
      </div>

      <div className="stats-grid admin-stats">
        <div className="stat-card admin-card">
          <div className="stat-icon">👥</div>
          <h3>Total Users</h3>
          <p className="stat-value">
            {dashboardData?.stats?.totalUsers || 0}
          </p>
        </div>
        <div className="stat-card admin-card">
          <div className="stat-icon">👤</div>
          <h3>Client Users</h3>
          <p className="stat-value">
            {dashboardData?.stats?.clientUsers || 0}
          </p>
        </div>
        <div className="stat-card admin-card">
          <div className="stat-icon">🔐</div>
          <h3>Super Admins</h3>
          <p className="stat-value">
            {dashboardData?.stats?.superAdmins || 0}
          </p>
        </div>
        <div className="stat-card admin-card">
          <div className="stat-icon">⚡</div>
          <h3>Active Users (24h)</h3>
          <p className="stat-value">
            {dashboardData?.stats?.activeUsers || 0}
          </p>
        </div>
        <div className="stat-card admin-card">
          <div className="stat-icon">📈</div>
          <h3>Avg Problems Solved</h3>
          <p className="stat-value">
            {dashboardData?.stats?.avgProblemsSolved || 0}
          </p>
        </div>
        <div className="stat-card admin-card">
          <div className="stat-icon">🎯</div>
          <h3>Avg Accuracy</h3>
          <p className="stat-value">
            {dashboardData?.stats?.avgAccuracy || 0}%
          </p>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={() => navigate("/dashboard/admin/users")}>
            <span className="action-icon">➕</span>
            <span>Add New User</span>
          </button>
          <button className="action-card" onClick={() => navigate("/dashboard/admin/problems")}>
            <span className="action-icon">📝</span>
            <span>Create Problem</span>
          </button>
          <button className="action-card" onClick={() => navigate("/dashboard/admin/reports")}>
            <span className="action-icon">📊</span>
            <span>Generate Report</span>
          </button>
          <button className="action-card" onClick={() => navigate("/dashboard/admin/settings")}>
            <span className="action-icon">⚙️</span>
            <span>System Config</span>
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-icon">{activity.icon}</span>
                <div className="activity-content">
                  <p>{activity.message}</p>
                  <span className="activity-time">{getTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-activity">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

