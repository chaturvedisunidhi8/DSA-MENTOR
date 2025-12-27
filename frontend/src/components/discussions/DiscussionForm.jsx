import React, { useState } from 'react';
import { discussionAPI } from '../../utils/api';
import '../../styles/DiscussionForm.css';

const DiscussionForm = ({ problemId, onClose, onSuccess, editDiscussion = null }) => {
  const [formData, setFormData] = useState({
    title: editDiscussion?.title || '',
    content: editDiscussion?.content || '',
    type: editDiscussion?.type || 'discussion',
    language: editDiscussion?.language || '',
    code: editDiscussion?.code || '',
    tags: editDiscussion?.tags?.join(', ') || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        problemId,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editDiscussion) {
        await discussionAPI.updateDiscussion(editDiscussion._id, payload);
      } else {
        await discussionAPI.createDiscussion(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit discussion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="discussion-form-overlay" onClick={onClose}>
      <div className="discussion-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>{editDiscussion ? 'Edit Discussion' : 'New Discussion'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Type</label>
            <select 
              name="type" 
              value={formData.type} 
              onChange={handleChange}
              required
            >
              <option value="question">Question</option>
              <option value="solution">Solution</option>
              <option value="discussion">General Discussion</option>
              <option value="bug-report">Bug Report</option>
            </select>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a descriptive title..."
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Share your thoughts, solution, or question..."
              required
              rows={8}
            />
          </div>

          {(formData.type === 'solution' || formData.type === 'bug-report') && (
            <>
              <div className="form-group">
                <label>Programming Language</label>
                <select 
                  name="language" 
                  value={formData.language} 
                  onChange={handleChange}
                >
                  <option value="">Select language...</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className="form-group">
                <label>Code {formData.type === 'solution' ? '(Optional)' : ''}</label>
                <textarea
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="Paste your code here..."
                  rows={10}
                  className="code-textarea"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., array, dynamic-programming, optimization"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : (editDiscussion ? 'Update' : 'Post Discussion')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscussionForm;
