import { useState, useEffect } from "react";
import api from "../../utils/api";

const AdminAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("30days");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/analytics/admin");
      setAnalytics(data.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!analytics) return;

    const reportData = [
      ["Metric", "Value"],
      ["Daily Active Users", analytics.userActivity.daily.toString()],
      ["Weekly Active Users", analytics.userActivity.weekly.toString()],
      ["Monthly Active Users", analytics.userActivity.monthly.toString()],
      ["Total Problems", analytics.problemStats.totalProblems.toString()],
      ["Total Interviews", analytics.problemStats.totalInterviews.toString()],
      ["Total Submissions", analytics.problemStats.totalSubmissions.toString()],
      ["Success Rate", `${analytics.problemStats.successRate}%`],
      ["System Uptime", analytics.systemHealth.uptime],
    ];

    const csv = reportData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="page-content"><div className="loading">Loading analytics...</div></div>;
  }

  if (!analytics) {
    return <div className="page-content"><div className="error">Failed to load analytics</div></div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>📈 Platform Analytics</h1>
        <p>Monitor platform performance and user engagement</p>
      </div>

      <div className="analytics-controls">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="3months">Last 3 Months</option>
          <option value="all">All Time</option>
        </select>
        <button className="export-btn" onClick={handleExportReport}>📊 Export Report</button>
      </div>

      <div className="admin-analytics-grid">
        <div className="analytics-card large">
          <h3>📈 User Growth (Last 30 Days)</h3>
          <div className="chart-placeholder">
            <div className="line-chart">
              {analytics.userActivity.growth && analytics.userActivity.growth.length > 0 ? (
                <div className="chart-line">
                  {analytics.userActivity.growth.map((item, index) => {
                    const maxCount = Math.max(...analytics.userActivity.growth.map(i => i.count), 1);
                    const bottom = (item.count / maxCount) * 80;
                    const left = (index / (analytics.userActivity.growth.length - 1)) * 90;
                    return (
                      <div
                        key={index}
                        className="point"
                        style={{ left: `${left}%`, bottom: `${bottom}%` }}
                        title={`${item.date}: ${item.count} new users`}
                      ></div>
                    );
                  })}
                </div>
              ) : (
                <p>No growth data available</p>
              )}
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>👥 User Activity</h3>
          <div className="activity-stats">
            <div className="stat-row">
              <span>Daily Active Users</span>
              <span className="stat-value">{analytics.userActivity.daily}</span>
            </div>
            <div className="stat-row">
              <span>Weekly Active Users</span>
              <span className="stat-value">{analytics.userActivity.weekly}</span>
            </div>
            <div className="stat-row">
              <span>Monthly Active Users</span>
              <span className="stat-value">{analytics.userActivity.monthly}</span>
            </div>
            <div className="stat-row">
              <span>Total Users</span>
              <span className="stat-value">{analytics.systemHealth.totalUsers}</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>📝 Problem Stats</h3>
          <div className="problem-analytics">
            <div className="stat-row">
              <span>Total Problems</span>
              <span className="stat-value">{analytics.problemStats.totalProblems}</span>
            </div>
            <div className="stat-row">
              <span>Total Interviews</span>
              <span className="stat-value">{analytics.problemStats.totalInterviews}</span>
            </div>
            <div className="stat-row">
              <span>Total Submissions</span>
              <span className="stat-value">{analytics.problemStats.totalSubmissions}</span>
            </div>
            <div className="stat-row">
              <span>Success Rate</span>
              <span className="stat-value success">{analytics.problemStats.successRate}%</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>🔥 Popular Topics</h3>
          <div className="topic-popularity">
            {analytics.topicPopularity && analytics.topicPopularity.length > 0 ? (
              analytics.topicPopularity.slice(0, 5).map((topic, index) => (
                <div key={index} className="topic-bar">
                  <span>{topic.topic}</span>
                  <div className="bar">
                    <div className="fill" style={{ width: `${topic.percentage}%` }}></div>
                  </div>
                  <span>{topic.count}</span>
                </div>
              ))
            ) : (
              <p>No topic data available</p>
            )}
          </div>
        </div>

        <div className="analytics-card large">
          <h3>🎯 User Performance Distribution</h3>
          <div className="distribution-chart">
            {analytics.performanceDistribution && analytics.performanceDistribution.length > 0 ? (
              <div className="bar-group">
                {analytics.performanceDistribution.map((item, index) => {
                  const maxCount = Math.max(...analytics.performanceDistribution.map(i => i.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="bar" style={{ height: `${height}%` }}>
                      <span>{item.range}</span>
                      <span className="count">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>No performance data available</p>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h3>⚡ System Health</h3>
          <div className="system-health">
            <div className="health-item">
              <span className={`health-indicator ${parseInt(analytics.systemHealth.apiResponseTime) < 100 ? 'good' : 'warning'}`}>●</span>
              <span>API Response Time</span>
              <span className="health-value">{analytics.systemHealth.apiResponseTime}</span>
            </div>
            <div className="health-item">
              <span className={`health-indicator ${analytics.systemHealth.dbPerformance === 'Excellent' || analytics.systemHealth.dbPerformance === 'Good' ? 'good' : 'warning'}`}>●</span>
              <span>Database Performance</span>
              <span className="health-value">{analytics.systemHealth.dbPerformance}</span>
            </div>
            <div className="health-item">
              <span className="health-indicator good">●</span>
              <span>Server Status</span>
              <span className="health-value">{analytics.systemHealth.activeConnections}</span>
            </div>
            <div className="health-item">
              <span className="health-indicator good">●</span>
              <span>System Uptime</span>
              <span className="health-value">{analytics.systemHealth.uptime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;

