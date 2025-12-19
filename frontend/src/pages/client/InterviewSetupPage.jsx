import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "../../styles/InterviewSetup.css";

const InterviewSetupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    difficulty: "medium",
    topics: [],
    duration: 45,
    questionCount: 2,
    interviewType: "conversational",
  });

  const topicOptions = [
    "Arrays",
    "Strings",
    "Linked Lists",
    "Stacks",
    "Queues",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Recursion",
    "Sorting",
    "Searching",
    "Hash Tables",
    "Greedy",
    "Backtracking",
  ];

  const handleTopicToggle = (topic) => {
    setConfig((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const handleStartInterview = async () => {
    if (config.topics.length === 0) {
      alert("Please select at least one topic");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/interview/create", config);
      navigate(`/dashboard/client/interview/session/${data.sessionId}`);
    } catch (error) {
      console.error("Failed to create interview session:", error);
      alert("Failed to start interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interview-setup">
      <div className="setup-header">
        <h1>🎤 AI Interview Setup</h1>
        <p>Configure your personalized DSA interview session</p>
      </div>

      <div className="setup-container">
        <div className="setup-card">
          <div className="setup-section">
            <h3>Interview Type</h3>
            <div className="interview-types">
              <div
                className={`type-card ${
                  config.interviewType === "conversational" ? "selected" : ""
                }`}
                onClick={() =>
                  setConfig({ ...config, interviewType: "conversational" })
                }
              >
                <div className="type-icon">💬</div>
                <h4>Conversational</h4>
                <p>AI asks questions, you explain your approach and code</p>
              </div>
              <div
                className={`type-card ${
                  config.interviewType === "timed" ? "selected" : ""
                }`}
                onClick={() =>
                  setConfig({ ...config, interviewType: "timed" })
                }
              >
                <div className="type-icon">⏱️</div>
                <h4>Timed Challenge</h4>
                <p>Solve problems under time pressure with AI hints</p>
              </div>
              <div
                className={`type-card ${
                  config.interviewType === "mock" ? "selected" : ""
                }`}
                onClick={() => setConfig({ ...config, interviewType: "mock" })}
              >
                <div className="type-icon">🎯</div>
                <h4>Mock Interview</h4>
                <p>Full interview experience with behavioral questions</p>
              </div>
            </div>
          </div>

          <div className="setup-section">
            <h3>Difficulty Level</h3>
            <div className="difficulty-buttons">
              <button
                className={`difficulty-btn easy ${
                  config.difficulty === "easy" ? "selected" : ""
                }`}
                onClick={() => setConfig({ ...config, difficulty: "easy" })}
              >
                Easy
              </button>
              <button
                className={`difficulty-btn medium ${
                  config.difficulty === "medium" ? "selected" : ""
                }`}
                onClick={() => setConfig({ ...config, difficulty: "medium" })}
              >
                Medium
              </button>
              <button
                className={`difficulty-btn hard ${
                  config.difficulty === "hard" ? "selected" : ""
                }`}
                onClick={() => setConfig({ ...config, difficulty: "hard" })}
              >
                Hard
              </button>
              <button
                className={`difficulty-btn mixed ${
                  config.difficulty === "mixed" ? "selected" : ""
                }`}
                onClick={() => setConfig({ ...config, difficulty: "mixed" })}
              >
                Mixed
              </button>
            </div>
          </div>

          <div className="setup-section">
            <h3>Topics ({config.topics.length} selected)</h3>
            <div className="topics-grid">
              {topicOptions.map((topic) => (
                <div
                  key={topic}
                  className={`topic-chip ${
                    config.topics.includes(topic) ? "selected" : ""
                  }`}
                  onClick={() => handleTopicToggle(topic)}
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>

          <div className="setup-section">
            <div className="setup-row">
              <div className="setup-control">
                <h3>Duration</h3>
                <select
                  value={config.duration}
                  onChange={(e) =>
                    setConfig({ ...config, duration: parseInt(e.target.value) })
                  }
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                </select>
              </div>
              <div className="setup-control">
                <h3>Questions</h3>
                <select
                  value={config.questionCount}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      questionCount: parseInt(e.target.value),
                    })
                  }
                >
                  <option value={1}>1 question</option>
                  <option value={2}>2 questions</option>
                  <option value={3}>3 questions</option>
                  <option value={4}>4 questions</option>
                </select>
              </div>
            </div>
          </div>

          <div className="setup-actions">
            <button
              className="start-interview-btn"
              onClick={handleStartInterview}
              disabled={loading || config.topics.length === 0}
            >
              {loading ? "Starting..." : "Start Interview"}
            </button>
          </div>
        </div>

        <div className="setup-tips">
          <h3>💡 Interview Tips</h3>
          <ul>
            <li>🎧 Use a quiet environment for best experience</li>
            <li>🗣️ Think out loud - explain your approach to the AI</li>
            <li>❓ Don't hesitate to ask for hints or clarifications</li>
            <li>⏰ Manage your time wisely across all questions</li>
            <li>✅ Test your code with examples before submitting</li>
            <li>📝 Practice explaining time/space complexity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetupPage;
