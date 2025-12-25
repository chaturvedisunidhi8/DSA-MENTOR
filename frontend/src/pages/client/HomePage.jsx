import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import api from "../../utils/api";
import { SkeletonStats, SkeletonCard, PageLoader } from "../../components/ui/Loading";
import Button from "../../components/ui/Button";

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentProblems, setRecentProblems] = useState([]);
  const [interviewStats, setInterviewStats] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      if (isMounted) {
        await Promise.all([
          fetchDashboardData(),
          fetchRecentProblems(),
          fetchInterviewStats()
        ]);
      }
    };
    fetchAllData();
    return () => { isMounted = false; };
  }, []);
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const { data } = await api.get("/dashboard/client");
      setDashboardData(data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError(error.response?.data?.message || "Failed to load dashboard data. Please try again.");
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

  const fetchInterviewStats = async () => {
    try {
      const { data } = await api.get("/interview/stats");
      setInterviewStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch interview stats:", error);
    }
  };
  if (loading) {
    return (
      <div className="page-content">
        <h1>Welcome back, {user?.username}! 👋</h1>
        <SkeletonStats count={4} />
        <div style={{ marginTop: '2rem' }}>
          <SkeletonCard count={2} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-state">
          <h2>⚠️ Error Loading Dashboard</h2>
          <p>{error}</p>
          <Button onClick={fetchDashboardData} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="page-content">
      <div className="welcome welcome-animated">
        <h1>Hey {user?.username}! <span className="wave">👋</span></h1>
        <p>Welcome back to your DSA journey</p>
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate("/dashboard/client/practice")}>
            <span>📝</span> Start Practicing
          </button>
          <button className="btn-secondary" onClick={() => navigate("/dashboard/client/interview")}>
            <span>🎤</span> AI Interview
          </button>
          <button className="btn-secondary" onClick={() => navigate("/dashboard/client/analytics")}>
            <span>📊</span> View Analytics
          </button>
          <button className="btn-secondary" onClick={() => navigate("/dashboard/client/mentor")}>
            <span>👨‍🏫</span> AI Mentor
          </button>
        </div>
      </div>

      {/* AI Interview Section */}
      <div className="interview-banner">
        <div className="interview-content">
          <h2>🎤 Ready for an AI Interview?</h2>
          <p>Practice real interview scenarios with our AI interviewer</p>
          {interviewStats && interviewStats.totalInterviews > 0 && (
            <div className="interview-quick-stats">
              <span>📊 {interviewStats.totalInterviews} interviews taken</span>
              <span>⭐ {interviewStats.averageScore}% avg score</span>
              <span>🏆 {interviewStats.bestScore}% best score</span>
            </div>
          )}
          <button 
            className="btn-interview" 
            onClick={() => navigate("/dashboard/client/interview")}
          >
            Start AI Interview →
          </button>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="contribution-section">
        <h2>Your Activity 📈</h2>
        <div className="contribution-graph">
          {Array.from({ length: 52 }, (_, weekIndex) => (
            <div key={weekIndex} className="contribution-week">
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const intensity = Math.floor(Math.random() * 5);
                return (
                  <div
                    key={dayIndex}
                    className={`contribution-day intensity-${intensity}`}
                    data-tooltip={`${intensity} contributions`}
                    aria-label={`Day ${weekIndex * 7 + dayIndex + 1}: ${intensity} contributions`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="contribution-legend">
          <span>Less</span>
          <div className="legend-squares">
            <div className="contribution-day intensity-0" />
            <div className="contribution-day intensity-1" />
            <div className="contribution-day intensity-2" />
            <div className="contribution-day intensity-3" />
            <div className="contribution-day intensity-4" />
          </div>
          <span>More</span>
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
