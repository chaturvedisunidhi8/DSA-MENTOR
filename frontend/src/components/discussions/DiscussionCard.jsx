import React from 'react';
import VoteButtons from './VoteButtons';
import { discussionAPI } from '../../utils/api';
import '../../styles/DiscussionCard.css';

const DiscussionCard = ({ discussion, onDiscussionClick, onVote, currentUser }) => {
  const {
    _id,
    title,
    type,
    author,
    votes,
    userVote,
    replyCount,
    views,
    isPinned,
    isAccepted,
    createdAt,
    tags
  } = discussion;

  const handleVote = async (voteType) => {
    try {
      const result = await discussionAPI.voteDiscussion(_id, voteType);
      onVote(_id, result.data);
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'question': return '❓';
      case 'solution': return '💡';
      case 'discussion': return '💬';
      case 'bug-report': return '🐛';
      default: return '📄';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'question': return 'type-question';
      case 'solution': return 'type-solution';
      case 'discussion': return 'type-discussion';
      case 'bug-report': return 'type-bug';
      default: return '';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const time = new Date(date);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className={`discussion-card ${isPinned ? 'pinned' : ''}`}>
      <div className="discussion-vote">
        <VoteButtons 
          votes={votes} 
          userVote={userVote} 
          onVote={handleVote}
          size="small"
        />
      </div>

      <div className="discussion-content" onClick={() => onDiscussionClick(_id)}>
        <div className="discussion-header">
          <div className="discussion-meta">
            <span className={`discussion-type ${getTypeColor()}`}>
              {getTypeIcon()} {type}
            </span>
            {isPinned && <span className="discussion-badge pinned">📌 Pinned</span>}
            {isAccepted && <span className="discussion-badge accepted">✓ Accepted</span>}
          </div>
          <h3 className="discussion-title">{title}</h3>
        </div>

        <div className="discussion-footer">
          <div className="discussion-author">
            <img 
              src={author?.profilePicture || '/default-avatar.png'} 
              alt={author?.username}
              className="author-avatar"
            />
            <span className="author-name">{author?.username || 'Anonymous'}</span>
            {author?.badges?.length > 0 && (
              <span className="author-badge">{author.badges[0]}</span>
            )}
          </div>

          <div className="discussion-stats">
            <span className="stat" title="Replies">💬 {replyCount || 0}</span>
            <span className="stat" title="Views">👁️ {views || 0}</span>
            <span className="stat time">{formatTimeAgo(createdAt)}</span>
          </div>
        </div>

        {tags && tags.length > 0 && (
          <div className="discussion-tags">
            {tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionCard;
