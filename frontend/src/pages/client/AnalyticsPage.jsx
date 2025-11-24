import { useState, useEffect } from "react";
import api from "../../utils/api";
import useAuth from "../../hooks/useAuth";
const AnalyticsPage = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7days");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchStats();
  }, [timeRange]);
  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/dashboard/client");
      setStats(data.data?.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>📊 Analytics</h1>
        <p>Track your progress and performance metrics</p>
      </div>
      <div className="analytics-controls">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="3months">Last 3 Months</option>
          <option value="all">All Time</option>
        </select>
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>📊 Your Statistics</h3>
          <div className="stats-list">
            <div className="stat-row">
              <span>Problems Solved:</span>
              <strong>{stats?.problemsSolved || 0}</strong>
            </div>
            <div className="stat-row">
              <span>Accuracy:</span>
              <strong>{stats?.accuracy || 0}%</strong>
            </div>
            <div className="stat-row">
              <span>Current Streak:</span>
              <strong>{stats?.streak || 0} days</strong>
            </div>
            <div className="stat-row">
              <span>Level:</span>
              <strong>{stats?.currentLevel || "Beginner"}</strong>
            </div>
          </div>
        </div>
        <div className="analytics-card">
          <h3>🎯 Focus Areas</h3>
          {stats?.focusAreas && stats.focusAreas.length > 0 ? (
            <div className="focus-areas-list">
              {stats.focusAreas.map((area, idx) => (
                <div key={idx} className="focus-area-item">
                  📌 {area}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-message">
              Start solving problems to identify your focus areas!
            </p>
          )}
        </div>
        <div className="analytics-card full-width">
          <h3>📈 Advanced Analytics Coming Soon</h3>
          <div className="coming-soon-box">
            <p>🚀 We're building advanced analytics features including:</p>
            <ul>
              <li>✅ Performance trend charts</li>
              <li>✅ Topic-wise mastery breakdown</li>
              <li>✅ Difficulty progression tracking</li>
              <li>✅ Time spent analysis</li>
              <li>✅ Comparison with peers</li>
            </ul>
            <p>Keep solving problems, and we'll track your progress!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsPage;
