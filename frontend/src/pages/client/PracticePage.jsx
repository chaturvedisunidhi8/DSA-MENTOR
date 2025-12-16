import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
const PracticePage = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    fetchProblems();
  }, [selectedTopic, selectedDifficulty]);
  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedTopic !== "all") params.topic = selectedTopic;
      if (selectedDifficulty !== "all") params.difficulty = selectedDifficulty;
      const { data } = await api.get("/problems", { params });
      setProblems(data.data);
    } catch (error) {
      console.error("Error fetching problems:", error);
      setError(error.response?.data?.message || "Failed to load problems. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const filteredProblems = problems.filter((problem) =>
    problem.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleProblemClick = (slug) => {
    navigate(`/dashboard/practice/${slug}`);
  };
  if (loading) {
    return <div className="loading">Loading problems...</div>;
  }
  if (error) {
    return (
      <div className="practice-page">
        <div className="error-container">
          <h2>⚠️ Error Loading Problems</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }  return (
    <div className="page-content">
      <div className="page-header">
        <h1>📝 Practice Problems</h1>
        <p>Solve problems to improve your DSA skills</p>
      </div>
      <div className="filters">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems..."
            className="search-input-small"
          />
        </div>
        <div className="filter-group">
          <label>Topic:</label>
          <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
            <option value="all">All Topics</option>
            <option value="Arrays">Arrays</option>
            <option value="Strings">Strings</option>
            <option value="Dynamic Programming">Dynamic Programming</option>
            <option value="Graphs">Graphs</option>
            <option value="Trees">Trees</option>
            <option value="Hash Table">Hash Table</option>
            <option value="Sorting">Sorting</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Difficulty:</label>
          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
            <option value="all">All Levels</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>
      <div className="problems-list">
        {filteredProblems.map((problem) => (
          <div
            key={problem._id}
            className="problem-item"
            onClick={() => handleProblemClick(problem.slug)}
          >
            <div className="problem-status">⭕</div>
            <div className="problem-info">
              <h3>{problem.title}</h3>
              <div className="problem-meta">
                <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty}
                </span>
                {problem.topics.map((topic, idx) => (
                  <span key={idx} className="topic-badge">
                    {topic}
                  </span>
                ))}
                {problem.acceptanceRate > 0 && (
                  <span className="acceptance-rate">
                    Acceptance: {problem.acceptanceRate}%
                  </span>
                )}
              </div>
            </div>
            <button className="solve-problem-btn">Solve</button>
          </div>
        ))}
      </div>
      {filteredProblems.length === 0 && (
        <div className="no-results">
          <p>No problems found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};
export default PracticePage;
