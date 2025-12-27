import React, { useState, useEffect } from 'react';
import DiscussionCard from './DiscussionCard';
import DiscussionForm from './DiscussionForm';
import { discussionAPI } from '../../utils/api';
import useAuth from '../../hooks/useAuth';
import '../../styles/DiscussionList.css';

const DiscussionList = ({ problemId, onDiscussionClick }) => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState(null);
  const [sortBy, setSortBy] = useState('hot');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDiscussions();
  }, [problemId, filterType, sortBy, page]);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const params = {
        type: filterType,
        sortBy,
        page,
        limit: 10
      };
      const response = await discussionAPI.getDiscussionsByProblem(problemId, params);
      setDiscussions(response.data);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteUpdate = (discussionId, updatedDiscussion) => {
    setDiscussions(discussions.map(d => 
      d._id === discussionId ? { ...d, ...updatedDiscussion } : d
    ));
  };

  const handleFormSuccess = () => {
    fetchDiscussions();
  };

  return (
    <div className="discussion-list-container">
      <div className="discussion-header">
        <h2>Discussions</h2>
        {user && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + New Discussion
          </button>
        )}
      </div>

      <div className="discussion-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${!filterType ? 'active' : ''}`}
            onClick={() => setFilterType(null)}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filterType === 'question' ? 'active' : ''}`}
            onClick={() => setFilterType('question')}
          >
            ❓ Questions
          </button>
          <button 
            className={`filter-btn ${filterType === 'solution' ? 'active' : ''}`}
            onClick={() => setFilterType('solution')}
          >
            💡 Solutions
          </button>
          <button 
            className={`filter-btn ${filterType === 'discussion' ? 'active' : ''}`}
            onClick={() => setFilterType('discussion')}
          >
            💬 Discussions
          </button>
          <button 
            className={`filter-btn ${filterType === 'bug-report' ? 'active' : ''}`}
            onClick={() => setFilterType('bug-report')}
          >
            🐛 Bugs
          </button>
        </div>

        <div className="sort-dropdown">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="hot">🔥 Hot</option>
            <option value="top">⬆️ Top</option>
            <option value="new">🆕 New</option>
            <option value="trending">📈 Trending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading discussions...</div>
      ) : discussions.length === 0 ? (
        <div className="empty-state">
          <p>No discussions yet. Be the first to start one!</p>
        </div>
      ) : (
        <>
          <div className="discussion-list">
            {discussions.map(discussion => (
              <DiscussionCard
                key={discussion._id}
                discussion={discussion}
                onDiscussionClick={onDiscussionClick}
                onVote={handleVoteUpdate}
                currentUser={user}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <DiscussionForm
          problemId={problemId}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default DiscussionList;
