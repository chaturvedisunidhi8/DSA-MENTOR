import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../utils/api";

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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
          <button className="action-card" onClick={() => navigate("/superadmin/dashboard/users")}>
            <span className="action-icon">➕</span>
            <span>Add New User</span>
          </button>
          <button className="action-card" onClick={() => navigate("/superadmin/dashboard/problems")}>
            <span className="action-icon">📝</span>
            <span>Create Problem</span>
          </button>
          <button className="action-card" onClick={() => navigate("/superadmin/dashboard/reports")}>
            <span className="action-icon">📊</span>
            <span>Generate Report</span>
          </button>
          <button className="action-card" onClick={() => navigate("/superadmin/dashboard/settings")}>
            <span className="action-icon">⚙️</span>
            <span>System Config</span>
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-icon">👤</span>
            <div className="activity-content">
              <p><strong>New user registered:</strong> john_doe</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-icon">✅</span>
            <div className="activity-content">
              <p><strong>Problem solved:</strong> alice solved "Two Sum"</p>
              <span className="activity-time">3 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <span className="activity-icon">🏆</span>
            <div className="activity-content">
              <p><strong>Achievement unlocked:</strong> bob earned "Week Warrior"</p>
              <span className="activity-time">5 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

