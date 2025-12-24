import { useState, useEffect } from "react";
import api from "../../utils/api";
import useAuth from "../../hooks/useAuth";
const AnalyticsPage = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7days");
  const [stats, setStats] = useState(null);
  const [interviewStats, setInterviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      if (isMounted) {
        await Promise.all([fetchStats(), fetchInterviewStats()]);
      }
    };
    fetchAllData();
    return () => { isMounted = false; };
  }, [timeRange]);
  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/dashboard/client");
      setStats(data.data?.stats || data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      // Fallback to user data if API fails
      if (user) {
        setStats({
          problemsSolved: user.problemsSolved || 0,
          accuracy: user.accuracy || 0,
          streak: user.streak || 0,
          currentLevel: user.currentLevel || "Beginner",
          focusAreas: user.focusAreas || []
        });
      }
    } finally {
      setLoading(false);
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
    return <div className="loading">Loading analytics...</div>;
  }
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>📊 Analytics</h1>
        <p>Track your progress and performance metrics</p>
      </div>
      <div className="analytics-controls">
        <label htmlFor="timeRange" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
          Time Range:
        </label>
        <select 
          id="timeRange"
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
        >
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

        {/* Interview Analytics */}
        {interviewStats && interviewStats.totalInterviews > 0 && (
          <>
            <div className="analytics-card">
              <h3>🎤 Interview Performance</h3>
              <div className="stats-list">
                <div className="stat-row">
                  <span>Total Interviews:</span>
                  <strong>{interviewStats.totalInterviews}</strong>
                </div>
                <div className="stat-row">
                  <span>Average Score:</span>
                  <strong>{interviewStats.averageScore}%</strong>
                </div>
                <div className="stat-row">
                  <span>Best Score:</span>
                  <strong>{interviewStats.bestScore}%</strong>
                </div>
                <div className="stat-row">
                  <span>Questions Attempted:</span>
                  <strong>{interviewStats.totalQuestionsAttempted}</strong>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>📚 Interview Topics</h3>
              {interviewStats.topicDistribution && Object.keys(interviewStats.topicDistribution).length > 0 ? (
                <div className="topic-distribution">
                  {Object.entries(interviewStats.topicDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([topic, count]) => (
                      <div key={topic} className="topic-bar">
                        <span className="topic-name">{topic}</span>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ width: `${(count / interviewStats.totalInterviews) * 100}%` }}
                          />
                        </div>
                        <span className="topic-count">{count}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="empty-message">No topic data available yet.</p>
              )}
            </div>
          </>
        )}

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
