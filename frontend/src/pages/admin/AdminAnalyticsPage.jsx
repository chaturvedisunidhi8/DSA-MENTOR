import { useState } from "react";

const AdminAnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("7days");

  const handleExportReport = () => {
    const reportData = [
      ["Metric", "Value"],
      ["Daily Active Users", "234"],
      ["Weekly Active Users", "1,456"],
      ["Monthly Active Users", "4,832"],
      ["Avg Session Duration", "24m"],
      ["Total Problems", "1,234"],
      ["Total Submissions", "45,678"],
      ["Success Rate", "76%"],
      ["Avg Solve Time", "22m"],
    ];

    const csv = reportData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeRange}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
          <h3>📈 User Growth</h3>
          <div className="chart-placeholder">
            <div className="line-chart">
              <div className="chart-line">
                <div className="point" style={{ left: "10%", bottom: "30%" }}></div>
                <div className="point" style={{ left: "25%", bottom: "45%" }}></div>
                <div className="point" style={{ left: "40%", bottom: "40%" }}></div>
                <div className="point" style={{ left: "55%", bottom: "60%" }}></div>
                <div className="point" style={{ left: "70%", bottom: "75%" }}></div>
                <div className="point" style={{ left: "85%", bottom: "85%" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>👥 User Activity</h3>
          <div className="activity-stats">
            <div className="stat-row">
              <span>Daily Active Users</span>
              <span className="stat-value">234</span>
            </div>
            <div className="stat-row">
              <span>Weekly Active Users</span>
              <span className="stat-value">1,456</span>
            </div>
            <div className="stat-row">
              <span>Monthly Active Users</span>
              <span className="stat-value">4,832</span>
            </div>
            <div className="stat-row">
              <span>Avg Session Duration</span>
              <span className="stat-value">24m</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>📝 Problem Stats</h3>
          <div className="problem-analytics">
            <div className="stat-row">
              <span>Total Problems</span>
              <span className="stat-value">1,234</span>
            </div>
            <div className="stat-row">
              <span>Total Submissions</span>
              <span className="stat-value">45,678</span>
            </div>
            <div className="stat-row">
              <span>Success Rate</span>
              <span className="stat-value success">76%</span>
            </div>
            <div className="stat-row">
              <span>Avg Solve Time</span>
              <span className="stat-value">22m</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>🔥 Popular Topics</h3>
          <div className="topic-popularity">
            <div className="topic-bar">
              <span>Arrays</span>
              <div className="bar">
                <div className="fill" style={{ width: "92%" }}></div>
              </div>
              <span>92%</span>
            </div>
            <div className="topic-bar">
              <span>Graphs</span>
              <div className="bar">
                <div className="fill" style={{ width: "78%" }}></div>
              </div>
              <span>78%</span>
            </div>
            <div className="topic-bar">
              <span>Dynamic Programming</span>
              <div className="bar">
                <div className="fill" style={{ width: "65%" }}></div>
              </div>
              <span>65%</span>
            </div>
            <div className="topic-bar">
              <span>Trees</span>
              <div className="bar">
                <div className="fill" style={{ width: "83%" }}></div>
              </div>
              <span>83%</span>
            </div>
          </div>
        </div>

        <div className="analytics-card large">
          <h3>🎯 User Performance Distribution</h3>
          <div className="distribution-chart">
            <div className="bar-group">
              <div className="bar" style={{ height: "40%" }}>
                <span>Beginner</span>
              </div>
              <div className="bar" style={{ height: "70%" }}>
                <span>Intermediate</span>
              </div>
              <div className="bar" style={{ height: "50%" }}>
                <span>Advanced</span>
              </div>
              <div className="bar" style={{ height: "25%" }}>
                <span>Expert</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>⚡ System Health</h3>
          <div className="system-health">
            <div className="health-item">
              <span className="health-indicator good">●</span>
              <span>API Response Time</span>
              <span className="health-value">45ms</span>
            </div>
            <div className="health-item">
              <span className="health-indicator good">●</span>
              <span>Database Performance</span>
              <span className="health-value">Good</span>
            </div>
            <div className="health-item">
              <span className="health-indicator warning">●</span>
              <span>Server Load</span>
              <span className="health-value">Medium</span>
            </div>
            <div className="health-item">
              <span className="health-indicator good">●</span>
              <span>Uptime</span>
              <span className="health-value">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;

