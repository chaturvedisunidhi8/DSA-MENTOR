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
    let isMounted = true;
    if (isMounted) {
      fetchProblems();
    }
    return () => { isMounted = false; };
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
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProblemClick = (slug) => {
    navigate(`/dashboard/practice/${slug}`);
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Problems</h2>
          <p>{error}</p>
          <button onClick={fetchProblems} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content practice-page">
      <div className="page-header">
        <div className="header-content">
          <h1>📝 Practice Problems</h1>
          <p>Solve problems to improve your DSA skills and ace your interviews</p>
        </div>
        <div className="header-stats">
          <div className="stat-pill">
            <span className="stat-value">{problems.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-pill">
            <span className="stat-value">{filteredProblems.length}</span>
            <span className="stat-label">Showing</span>
          </div>
        </div>
      </div>

      <div className="practice-filters-section">
        <div className="search-bar-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by title or description..."
            className="search-input-practice"
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>
              <span className="filter-icon">📚</span>
              Topic:
            </label>
            <select 
              value={selectedTopic} 
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">All Topics</option>
              <option value="Arrays">Arrays</option>
              <option value="Strings">Strings</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
              <option value="Graphs">Graphs</option>
              <option value="Trees">Trees</option>
              <option value="Hash Table">Hash Table</option>
              <option value="Sorting">Sorting</option>
              <option value="Binary Search">Binary Search</option>
              <option value="Stack">Stack</option>
              <option value="Queue">Queue</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <span className="filter-icon">⚡</span>
              Difficulty:
            </label>
            <select 
              value={selectedDifficulty} 
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="Easy">🟢 Easy</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Hard">🔴 Hard</option>
            </select>
          </div>

          {(selectedTopic !== 'all' || selectedDifficulty !== 'all' || searchQuery) && (
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSelectedTopic('all');
                setSelectedDifficulty('all');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {filteredProblems.length === 0 ? (
        <div className="no-problems-container">
          <div className="no-problems-icon">🔍</div>
          <h3>No Problems Found</h3>
          <p>Try adjusting your filters or search query</p>
          <button 
            className="reset-filters-btn"
            onClick={() => {
              setSelectedTopic('all');
              setSelectedDifficulty('all');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="problems-grid">
          {filteredProblems.map((problem) => (
            <div
              key={problem._id}
              className="problem-card"
            >
              <div className="problem-card-header">
                <div className="problem-status-icon">
                  {getDifficultyIcon(problem.difficulty)}
                </div>
                <div className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty}
                </div>
              </div>

              <div className="problem-card-body">
                <h3 className="problem-title">{problem.title}</h3>
                
                {problem.description && (
                  <p className="problem-description">
                    {problem.description.length > 100 
                      ? `${problem.description.substring(0, 100)}...` 
                      : problem.description}
                  </p>
                )}

                <div className="problem-topics">
                  {problem.topics && problem.topics.slice(0, 3).map((topic, idx) => (
                    <span key={idx} className="topic-tag">
                      {topic}
                    </span>
                  ))}
                  {problem.topics && problem.topics.length > 3 && (
                    <span className="topic-tag more">+{problem.topics.length - 3}</span>
                  )}
                </div>
              </div>

              <div className="problem-card-footer">
                {problem.acceptanceRate > 0 && (
                  <div className="acceptance-info">
                    <span className="acceptance-icon">✓</span>
                    <span>{problem.acceptanceRate}%</span>
                  </div>
                )}
                <button 
                  className="solve-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('Button clicked, navigating to:', problem.slug);
                    navigate(problem.slug);
                  }}
                >
                  Solve <span className="arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticePage;
