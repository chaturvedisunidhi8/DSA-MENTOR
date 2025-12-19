import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "../../styles/InterviewResults.css";

const InterviewResultsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async () => {
    try {
      const { data } = await api.get(`/interview/results/${sessionId}`);
      setResults(data.results);
    } catch (error) {
      console.error("Failed to fetch results:", error);
      alert("Failed to load interview results");
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeInterview = () => {
    navigate("/dashboard/client/interview");
  };

  const handleBackToHome = () => {
    navigate("/dashboard/client");
  };

  if (loading) {
    return <div className="loading">Loading interview results...</div>;
  }

  if (!results) {
    return <div className="error">Results not found</div>;
  }

  const overallScore = results.overallScore || 0;
  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Average";
    return "Needs Improvement";
  };

  return (
    <div className="interview-results">
      <div className="results-header">
        <h1>🎯 Interview Results</h1>
        <p>Here's how you performed in your AI interview</p>
      </div>

      <div className="results-container">
        {/* Overall Score Card */}
        <div className="score-card">
          <div className="score-circle">
            <svg width="200" height="200">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="12"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={getScoreColor(overallScore)}
                strokeWidth="12"
                strokeDasharray={`${(overallScore / 100) * 502.4} 502.4`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="score-text">
              <span className="score-value">{overallScore}</span>
              <span className="score-label">Overall Score</span>
            </div>
          </div>
          <div className="performance-level">
            <h3>{getPerformanceLevel(overallScore)}</h3>
            <p>{results.summary}</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-value">{results.timeSpent || "0m"}</div>
            <div className="metric-label">Time Spent</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-value">
              {results.questionsCompleted || 0}/{results.totalQuestions || 0}
            </div>
            <div className="metric-label">Questions Solved</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">🎯</div>
            <div className="metric-value">{results.accuracy || 0}%</div>
            <div className="metric-label">Accuracy</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon">💡</div>
            <div className="metric-value">{results.hintsUsed || 0}</div>
            <div className="metric-label">Hints Used</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="breakdown-section">
          <h2>📊 Performance Breakdown</h2>
          <div className="breakdown-grid">
            <div className="breakdown-card">
              <h4>Problem Solving</h4>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${results.problemSolvingScore || 0}%`,
                    background: getScoreColor(results.problemSolvingScore || 0),
                  }}
                />
              </div>
              <span>{results.problemSolvingScore || 0}%</span>
            </div>
            <div className="breakdown-card">
              <h4>Code Quality</h4>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${results.codeQualityScore || 0}%`,
                    background: getScoreColor(results.codeQualityScore || 0),
                  }}
                />
              </div>
              <span>{results.codeQualityScore || 0}%</span>
            </div>
            <div className="breakdown-card">
              <h4>Communication</h4>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${results.communicationScore || 0}%`,
                    background: getScoreColor(results.communicationScore || 0),
                  }}
                />
              </div>
              <span>{results.communicationScore || 0}%</span>
            </div>
            <div className="breakdown-card">
              <h4>Time Management</h4>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${results.timeManagementScore || 0}%`,
                    background: getScoreColor(results.timeManagementScore || 0),
                  }}
                />
              </div>
              <span>{results.timeManagementScore || 0}%</span>
            </div>
          </div>
        </div>

        {/* Question-wise Analysis */}
        <div className="questions-section">
          <h2>📝 Question-wise Analysis</h2>
          {results.questions &&
            results.questions.map((question, index) => (
              <div key={index} className="question-result">
                <div className="question-header">
                  <div className="question-title">
                    <h4>
                      {index + 1}. {question.title}
                    </h4>
                    <span className={`difficulty ${question.difficulty}`}>
                      {question.difficulty}
                    </span>
                  </div>
                  <div className="question-score">
                    <span
                      style={{ color: getScoreColor(question.score || 0) }}
                    >
                      {question.score || 0}/100
                    </span>
                  </div>
                </div>
                <div className="question-feedback">
                  <p>{question.feedback}</p>
                </div>
                {question.strengths && question.strengths.length > 0 && (
                  <div className="strengths">
                    <strong>✅ Strengths:</strong>
                    <ul>
                      {question.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {question.improvements && question.improvements.length > 0 && (
                  <div className="improvements">
                    <strong>📈 Areas for Improvement:</strong>
                    <ul>
                      {question.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {question.timeComplexity && (
                  <div className="complexity">
                    <span>
                      <strong>Time Complexity:</strong> {question.timeComplexity}
                    </span>
                    <span>
                      <strong>Space Complexity:</strong>{" "}
                      {question.spaceComplexity}
                    </span>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* AI Feedback */}
        <div className="ai-feedback-section">
          <h2>🤖 AI Interviewer's Feedback</h2>
          <div className="feedback-card">
            <p>{results.detailedFeedback}</p>
          </div>
        </div>

        {/* Recommendations */}
        {results.recommendations && results.recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2>💡 Recommendations</h2>
            <div className="recommendations-grid">
              {results.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="rec-icon">{rec.icon || "📚"}</div>
                  <h4>{rec.title}</h4>
                  <p>{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="results-actions">
          <button className="secondary-btn" onClick={handleBackToHome}>
            Back to Dashboard
          </button>
          <button className="primary-btn" onClick={handleRetakeInterview}>
            Take Another Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewResultsPage;
