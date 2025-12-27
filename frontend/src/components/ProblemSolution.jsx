import React, { useState } from 'react';
import '../../styles/ProblemSolution.css';

const ProblemSolution = ({ problem, userHasSolved }) => {
  const [showSolution, setShowSolution] = useState(false);

  if (!problem.solution || !problem.solution.approach) {
    return (
      <div className="solution-empty">
        <div className="empty-icon">💡</div>
        <h3>No Editorial Available Yet</h3>
        <p>The official editorial for this problem is coming soon.</p>
        <p>Meanwhile, check out the Discussions tab for community solutions!</p>
      </div>
    );
  }

  const handleRevealSolution = () => {
    if (!userHasSolved) {
      const confirmed = window.confirm(
        "⚠️ Are you sure you want to view the solution?\n\n" +
        "Seeing the solution before attempting the problem yourself might reduce your learning. " +
        "We recommend trying the problem first and checking hints if you're stuck.\n\n" +
        "Continue anyway?"
      );
      if (!confirmed) return;
    }
    setShowSolution(true);
  };

  return (
    <div className="problem-solution-container">
      {!showSolution ? (
        <div className="solution-locked">
          <div className="lock-icon">🔒</div>
          <h3>Editorial Available</h3>
          <p>
            {userHasSolved
              ? "Great job solving this problem! Click below to view the official editorial."
              : "An official editorial is available for this problem."}
          </p>
          {!userHasSolved && (
            <div className="warning-box">
              <strong>⚠️ Recommended:</strong> Try solving the problem yourself first for maximum learning benefit.
            </div>
          )}
          <button className="reveal-btn" onClick={handleRevealSolution}>
            👁️ {userHasSolved ? 'View Editorial' : 'Reveal Solution'}
          </button>
        </div>
      ) : (
        <div className="solution-content">
          <div className="solution-header">
            <h2>📖 Official Editorial</h2>
            {userHasSolved && <span className="solved-badge">✓ Solved</span>}
          </div>

          <div className="solution-section">
            <h3>💡 Approach</h3>
            <div className="approach-content">
              {problem.solution.approach.split('\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>

          {problem.solution.timeComplexity && (
            <div className="solution-section complexity-section">
              <div className="complexity-item">
                <h4>⏱️ Time Complexity</h4>
                <code className="complexity-code">{problem.solution.timeComplexity}</code>
              </div>
              {problem.solution.spaceComplexity && (
                <div className="complexity-item">
                  <h4>💾 Space Complexity</h4>
                  <code className="complexity-code">{problem.solution.spaceComplexity}</code>
                </div>
              )}
            </div>
          )}

          {problem.solution.code && (
            <div className="solution-section">
              <h3>💻 Implementation</h3>
              <pre className="solution-code">
                <code>{problem.solution.code}</code>
              </pre>
            </div>
          )}

          <div className="solution-footer">
            <div className="info-box">
              <strong>💡 Pro Tip:</strong> Try implementing this solution yourself and experiment with variations to deepen your understanding.
            </div>
            <button 
              className="discussions-link-btn"
              onClick={() => {
                // Trigger tab change to discussions
                const event = new CustomEvent('changeProblemTab', { detail: 'discussions' });
                window.dispatchEvent(event);
              }}
            >
              💬 Discuss This Solution
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemSolution;
