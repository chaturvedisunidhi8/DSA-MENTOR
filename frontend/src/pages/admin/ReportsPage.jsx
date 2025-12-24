import { useState, useEffect } from "react";
import api from "../../utils/api";

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState("user-activity");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedReport) {
      fetchReportData(selectedReport);
    }
  }, [selectedReport]);

  const fetchReportData = async (reportType) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/reports/${reportType}`);
      setReportData(data.data);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    alert("PDF download will be available soon! This requires a PDF generation service like Puppeteer.");
    // TODO: Implement PDF generation
    // const reportName = reports.find((r) => r.id === selectedReport)?.name;
    // window.open(`/api/reports/${selectedReport}/pdf`, '_blank');
  };

  const handleDownloadCSV = () => {
    if (!reportData) return;

    let csvData = [];
    
    if (reportData.type === "user-activity" && reportData.metrics) {
      csvData = [
        ["Metric", "Current", "Previous", "Change"],
        ...reportData.metrics.map((m) => [
          m.name,
          m.current,
          m.previous,
          `${m.change > 0 ? '+' : ''}${m.change}%`,
        ]),
      ];
    } else if (reportData.type === "problem-performance" && reportData.metrics) {
      csvData = [
        ["Category", "Value", "Percentage"],
        ...reportData.metrics.map((m) => [m.name, m.value, `${m.percentage}%`]),
      ];
    } else if (reportData.type === "system-usage" && reportData.metrics) {
      csvData = [
        ["Metric", "Value", "Status"],
        ...reportData.metrics.map((m) => [m.name, m.value, m.status]),
      ];
    } else if (reportData.type === "user-progress" && reportData.performers) {
      csvData = [
        ["Rank", "Username", "Problems Solved", "Accuracy", "Streak", "Score"],
        ...reportData.performers.map((p) => [
          p.rank,
          p.username,
          p.problemsSolved,
          `${p.accuracy}%`,
          p.streak,
          p.score,
        ]),
      ];
    }

    const csv = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    fetchReportData(selectedReport);
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
          {loading ? (
            <div className="loading">Loading report data...</div>
          ) : !reportData ? (
            <div className="error">Failed to load report data</div>
          ) : (
            <>
              {selectedReport === "user-activity" && reportData.type === "user-activity" && (
                <div className="report-section">
                  <h3>{reportData.title}</h3>
                  <p className="report-period">Period: {reportData.period}</p>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Current</th>
                        <th>Previous</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.metrics.map((metric, index) => (
                        <tr key={index}>
                          <td>{metric.name}</td>
                          <td>{metric.current.toLocaleString()} {metric.unit}</td>
                          <td>{metric.previous.toLocaleString()} {metric.unit}</td>
                          <td className={metric.change >= 0 ? "positive" : "negative"}>
                            {metric.change > 0 ? '+' : ''}{metric.change}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedReport === "problem-performance" && reportData.type === "problem-performance" && (
                <div className="report-section">
                  <h3>{reportData.title}</h3>
                  <p className="report-period">Period: {reportData.period}</p>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Count</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.metrics.map((metric, index) => (
                        <tr key={index}>
                          <td>
                            {metric.name.includes("Easy") && <span className="difficulty-badge easy">{metric.name}</span>}
                            {metric.name.includes("Medium") && <span className="difficulty-badge medium">{metric.name}</span>}
                            {metric.name.includes("Hard") && <span className="difficulty-badge hard">{metric.name}</span>}
                            {!metric.name.includes("Easy") && !metric.name.includes("Medium") && !metric.name.includes("Hard") && metric.name}
                          </td>
                          <td>{metric.value}</td>
                          <td>{metric.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedReport === "system-usage" && reportData.type === "system-usage" && (
                <div className="report-section">
                  <h3>{reportData.title}</h3>
                  <p className="report-period">Period: {reportData.period}</p>
                  <div className="metrics-grid">
                    {reportData.metrics.map((metric, index) => (
                      <div key={index} className="metric-box">
                        <span className="metric-label">{metric.name}</span>
                        <span className="metric-value">{metric.value}</span>
                        <span className={`metric-status ${metric.status.toLowerCase()}`}>{metric.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport === "user-progress" && reportData.type === "user-progress" && (
                <div className="report-section">
                  <h3>{reportData.title}</h3>
                  <p className="report-period">Period: {reportData.period}</p>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Username</th>
                        <th>Problems Solved</th>
                        <th>Accuracy</th>
                        <th>Streak</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.performers && reportData.performers.length > 0 ? (
                        reportData.performers.map((user) => (
                          <tr key={user.rank}>
                            <td>
                              <span className={`rank-badge rank-${user.rank <= 3 ? user.rank : 'other'}`}>
                                #{user.rank}
                              </span>
                            </td>
                            <td>{user.username}</td>
                            <td>{user.problemsSolved}</td>
                            <td>{user.accuracy}%</td>
                            <td>{user.streak} days</td>
                            <td><strong>{user.score}</strong></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center' }}>No user data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

