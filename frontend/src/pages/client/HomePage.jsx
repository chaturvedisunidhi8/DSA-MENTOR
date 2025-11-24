import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../utils/api";
const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentProblems, setRecentProblems] = useState([]);
  useEffect(() => {
    fetchDashboardData();
    fetchRecentProblems();
  }, []);
  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get("/dashboard/client");
      setDashboardData(data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchRecentProblems = async () => {
    try {
      const { data } = await api.get("/problems?limit=3");
      setRecentProblems(data.data || []);
    } catch (error) {
      console.error("Failed to fetch recent problems:", error);
    }
  };
  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }
  return (
    <div className="page-content">
      <div className="welcome">
        <h1>Hey {user?.username}! 👋</h1>
        <p>Welcome back to your DSA journey</p>
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate("/dashboard/practice")}>
            <span>📝</span> Start Practicing
          </button>
          <button className="btn-secondary" onClick={() => navigate("/dashboard/analytics")}>
            <span>📊</span> View Analytics
          </button>
          <button className="btn-secondary" onClick={() => navigate("/dashboard/mentor")}>
            <span>👨‍🏫</span> AI Mentor
          </button>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <h3>Problems Solved</h3>
          <p className="stat-value">
            {dashboardData?.stats?.problemsSolved || 0}
          </p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <h3>Accuracy</h3>
          <p className="stat-value">{dashboardData?.stats?.accuracy || 0}%</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <h3>Current Streak</h3>
          <p className="stat-value">{dashboardData?.stats?.streak || 0} days</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <h3>Current Level</h3>
          <p className="stat-value">
            {dashboardData?.stats?.currentLevel || "Beginner"}
          </p>
        </div>
      </div>
      {recentProblems.length > 0 && (
        <div className="recommendations">
          <h3>Recent Problems</h3>
          <div className="recommendation-cards">
            {recentProblems.map((problem) => (
              <div key={problem._id} className="recommendation-card">
                <h4>{problem.title}</h4>
                <p>{problem.description.substring(0, 100)}...</p>
                <div className="tags">
                  {problem.topics.slice(0, 2).map((topic, idx) => (
                    <span key={idx} className="tag">{topic}</span>
                  ))}
                  <span className={`tag difficulty ${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                </div>
                <button 
                  className="solve-btn"
                  onClick={() => navigate(`/dashboard/practice/${problem.slug}`)}
                >
                  Solve Now →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {recentProblems.length === 0 && (
        <div className="empty-state">
          <p>🎯 No problems available yet.</p>
          <p>Contact your admin to add some DSA problems!</p>
        </div>
      )}
    </div>
  );
};
export default HomePage;
