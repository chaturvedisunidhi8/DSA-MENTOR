import { useState } from "react";

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState("user-activity");

  const handleDownloadPDF = () => {
    alert("PDF download will be available soon! This requires a report generation service.");
    // TODO: Implement PDF generation
    // const reportName = reports.find((r) => r.id === selectedReport)?.name;
    // window.open(`/api/reports/${selectedReport}/pdf`, '_blank');
  };

  const handleDownloadCSV = () => {
    // Generate a simple CSV for demo
    const reportData = [
      ["Metric", "This Week", "Last Week", "Change"],
      ["Active Users", "1,456", "1,234", "+18%"],
      ["New Registrations", "89", "76", "+17%"],
      ["Problems Solved", "3,456", "3,120", "+11%"],
      ["Avg Session Time", "24m", "26m", "-8%"],
    ];

    const csv = reportData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    alert("Report data refreshed!");
    // TODO: Implement actual data refresh from API
  };

  const reports = [
    {
      id: "user-activity",
      name: "User Activity Report",
      description: "Detailed user engagement and activity metrics",
      icon: "👥",
    },
    {
      id: "problem-performance",
      name: "Problem Performance Report",
      description: "Statistics on problem difficulty and completion rates",
      icon: "📝",
    },
    {
      id: "system-usage",
      name: "System Usage Report",
      description: "System resources and performance metrics",
      icon: "💻",
    },
    {
      id: "user-progress",
      name: "User Progress Report",
      description: "Individual user learning progress and achievements",
      icon: "📊",
    },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>📋 Reports</h1>
        <p>Generate and view system reports</p>
      </div>

      <div className="reports-grid">
        {reports.map((report) => (
          <div
            key={report.id}
            className={`report-card ${selectedReport === report.id ? "active" : ""}`}
            onClick={() => setSelectedReport(report.id)}
          >
            <div className="report-icon">{report.icon}</div>
            <h3>{report.name}</h3>
            <p>{report.description}</p>
          </div>
        ))}
      </div>

      <div className="report-viewer">
        <div className="report-header">
          <h2>{reports.find((r) => r.id === selectedReport)?.name}</h2>
          <div className="report-actions">
            <button className="btn-download" onClick={handleDownloadPDF}>⬇️ Download PDF</button>
            <button className="btn-download" onClick={handleDownloadCSV}>📊 Download CSV</button>
            <button className="btn-refresh" onClick={handleRefresh}>🔄 Refresh</button>
          </div>
        </div>

        <div className="report-content">
          {selectedReport === "user-activity" && (
            <div className="report-section">
              <h3>User Activity Summary</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>This Week</th>
                    <th>Last Week</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Active Users</td>
                    <td>1,456</td>
                    <td>1,234</td>
                    <td className="positive">+18%</td>
                  </tr>
                  <tr>
                    <td>New Registrations</td>
                    <td>89</td>
                    <td>76</td>
                    <td className="positive">+17%</td>
                  </tr>
                  <tr>
                    <td>Problems Solved</td>
                    <td>3,456</td>
                    <td>3,120</td>
                    <td className="positive">+11%</td>
                  </tr>
                  <tr>
                    <td>Avg Session Time</td>
                    <td>24m</td>
                    <td>26m</td>
                    <td className="negative">-8%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === "problem-performance" && (
            <div className="report-section">
              <h3>Problem Performance Summary</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Difficulty</th>
                    <th>Total Problems</th>
                    <th>Avg Completion Rate</th>
                    <th>Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="difficulty-badge easy">Easy</span></td>
                    <td>456</td>
                    <td>87%</td>
                    <td>12m</td>
                  </tr>
                  <tr>
                    <td><span className="difficulty-badge medium">Medium</span></td>
                    <td>523</td>
                    <td>64%</td>
                    <td>28m</td>
                  </tr>
                  <tr>
                    <td><span className="difficulty-badge hard">Hard</span></td>
                    <td>255</td>
                    <td>38%</td>
                    <td>45m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedReport === "system-usage" && (
            <div className="report-section">
              <h3>System Usage Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">CPU Usage</span>
                  <span className="metric-value">45%</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Memory Usage</span>
                  <span className="metric-value">62%</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Database Size</span>
                  <span className="metric-value">2.4 GB</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">API Calls</span>
                  <span className="metric-value">125K</span>
                </div>
              </div>
            </div>
          )}

          {selectedReport === "user-progress" && (
            <div className="report-section">
              <h3>Top Performers</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Problems Solved</th>
                    <th>Accuracy</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>🥇</td>
                    <td>alice_codes</td>
                    <td>456</td>
                    <td>94%</td>
                    <td>Expert</td>
                  </tr>
                  <tr>
                    <td>🥈</td>
                    <td>bob_solver</td>
                    <td>423</td>
                    <td>91%</td>
                    <td>Advanced</td>
                  </tr>
                  <tr>
                    <td>🥉</td>
                    <td>charlie_dev</td>
                    <td>398</td>
                    <td>89%</td>
                    <td>Advanced</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

