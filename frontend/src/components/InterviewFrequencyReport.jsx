import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/InterviewFrequencyReport.css';

const InterviewFrequencyReport = ({ problemSlug }) => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [frequencyData, setFrequencyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company: '',
    interviewDate: '',
    position: '',
    interviewRound: 'Other'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFrequencyData();
  }, [problemSlug]);

  const fetchFrequencyData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/problems/${problemSlug}/frequency`);
      setFrequencyData(data.data);
    } catch (error) {
      console.error('Error fetching frequency:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post(`/api/problems/${problemSlug}/report-interview`, formData);
      alert('Thank you for contributing! Your report helps the community.');
      setShowReportForm(false);
      setFormData({
        company: '',
        interviewDate: '',
        position: '',
        interviewRound: 'Other'
      });
      fetchFrequencyData(); // Refresh data
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="frequency-loading">Loading frequency data...</div>;
  }

  return (
    <div className="interview-frequency-section">
      <div className="frequency-header">
        <div className="frequency-title">
          <h3>📊 Interview Frequency</h3>
          <p className="frequency-subtitle">
            Crowdsourced from {frequencyData?.totalReports || 0} real interview reports
          </p>
        </div>
        <button 
          className="report-button"
          onClick={() => setShowReportForm(!showReportForm)}
        >
          {showReportForm ? '✕ Cancel' : '+ Report Interview'}
        </button>
      </div>

      {showReportForm && (
        <div className="report-form-container">
          <form onSubmit={handleSubmit} className="report-form">
            <h4>Report This Problem in Your Interview</h4>
            <p className="form-help">Help others by sharing where this problem was asked</p>

            <div className="form-group">
              <label>Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g., Google, Microsoft, Amazon"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Interview Date *</label>
                <input
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Interview Round</label>
                <select
                  value={formData.interviewRound}
                  onChange={(e) => setFormData({ ...formData, interviewRound: e.target.value })}
                >
                  <option value="Phone Screen">Phone Screen</option>
                  <option value="Technical Round 1">Technical Round 1</option>
                  <option value="Technical Round 2">Technical Round 2</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Final Round">Final Round</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Position (Optional)</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Software Engineer, SDE-2"
              />
            </div>

            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      )}

      {frequencyData && frequencyData.totalReports > 0 ? (
        <div className="frequency-data">
          <div className="frequency-summary">
            <div className="summary-card">
              <span className="summary-label">Total Reports</span>
              <span className="summary-value">{frequencyData.totalReports}</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">{frequencyData.period}</span>
              <span className="summary-value">{frequencyData.recentReports}</span>
            </div>
          </div>

          {frequencyData.topCompanies && frequencyData.topCompanies.length > 0 && (
            <div className="top-companies">
              <h4>Top Companies Asking This Problem</h4>
              <div className="companies-list">
                {frequencyData.topCompanies.map((item, idx) => (
                  <div key={idx} className="company-item">
                    <span className="company-rank">#{idx + 1}</span>
                    <span className="company-name">{item.company}</span>
                    <div className="company-bar">
                      <div 
                        className="company-bar-fill"
                        style={{ 
                          width: `${(item.count / frequencyData.topCompanies[0].count) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="company-count">{item.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {frequencyData.roundDistribution && Object.keys(frequencyData.roundDistribution).length > 0 && (
            <div className="round-distribution">
              <h4>Interview Round Distribution</h4>
              <div className="rounds-list">
                {Object.entries(frequencyData.roundDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([round, count]) => (
                    <div key={round} className="round-item">
                      <span className="round-name">{round}</span>
                      <span className="round-count">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {frequencyData.recentInterviews && frequencyData.recentInterviews.length > 0 && (
            <div className="recent-interviews">
              <h4>Recent Interview Reports</h4>
              <div className="interviews-list">
                {frequencyData.recentInterviews.map((interview, idx) => (
                  <div key={idx} className="interview-item">
                    <span className="interview-company">{interview.company}</span>
                    <span className="interview-date">
                      {new Date(interview.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    {interview.position && (
                      <span className="interview-position">{interview.position}</span>
                    )}
                    <span className="interview-round">{interview.round}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-data">
          <p>🔍 No interview reports yet for this problem.</p>
          <p>Be the first to contribute and help the community!</p>
        </div>
      )}
    </div>
  );
};

export default InterviewFrequencyReport;
