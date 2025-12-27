import React from 'react';
import '../../styles/VoteButtons.css';

const VoteButtons = ({ votes, userVote, onVote, size = 'medium' }) => {
  const voteScore = (votes?.upvotes?.length || 0) - (votes?.downvotes?.length || 0);

  const handleVote = (type) => {
    // If clicking same vote, remove it (toggle off)
    const newVoteType = userVote === type ? 'none' : type;
    onVote(newVoteType);
  };

  return (
    <div className={`vote-buttons vote-${size}`}>
      <button
        className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
        onClick={() => handleVote('upvote')}
        title="Upvote"
      >
        ▲
      </button>
      <span className="vote-score">{voteScore}</span>
      <button
        className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
        onClick={() => handleVote('downvote')}
        title="Downvote"
      >
        ▼
      </button>
    </div>
  );
};

export default VoteButtons;
