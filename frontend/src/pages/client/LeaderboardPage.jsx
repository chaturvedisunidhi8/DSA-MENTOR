import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import '../../styles/Leaderboard.css';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'all',
    category: 'problems',
    page: 1
  });

  useEffect(() => {
    fetchLeaderboard();
    if (user) {
      fetchMyPosition();
    }
    fetchStats();
  }, [filters]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/leaderboard', {
        params: filters
      });
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPosition = async () => {
    try {
      const { data } = await axios.get('/api/leaderboard/me', {
        params: { category: filters.category }
      });
      setMyPosition(data);
    } catch (error) {
      console.error('Error fetching position:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/leaderboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getStatValue = (user, category) => {
    switch (category) {
      case 'problems':
        return `${user.problemsSolved || 0} solved`;
      case 'accuracy':
        return `${(user.accuracy || 0).toFixed(1)}%`;
      case 'interviews':
        return `${user.interviewsCompleted || 0} interviews`;
      case 'streaks':
        return `${user.currentStreak || 0} 🔥`;
      default:
        return user.problemsSolved || 0;
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p>Compete with the best problem solvers</p>
      </div>

      {/* Top Performers Showcase */}
      {stats && (
        <div className="stats-showcase">
          <div className="stat-card">
            <h3>🚀 Top Problem Solvers</h3>
            <div className="top-three">
              {stats.topSolvers.map((user, idx) => (
                <div key={user._id} className={`podium-card rank-${idx + 1}`}>
                  <span className="medal">{getMedalEmoji(idx + 1)}</span>
                  <img 
                    src={user.profilePicture || '/default-avatar.png'} 
                    alt={user.username}
                    className="avatar-small"
                  />
                  <p className="username">{user.username}</p>
                  <p className="stat-value">{user.problemsSolved} solved</p>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <h3>🎯 Highest Accuracy</h3>
            <div className="top-three">
              {stats.topAccuracy.map((user, idx) => (
                <div key={user._id} className={`podium-card rank-${idx + 1}`}>
                  <span className="medal">{getMedalEmoji(idx + 1)}</span>
                  <img 
                    src={user.profilePicture || '/default-avatar.png'} 
                    alt={user.username}
                    className="avatar-small"
                  />
                  <p className="username">{user.username}</p>
                  <p className="stat-value">{user.accuracy.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <h3>🔥 Current Streaks</h3>
            <div className="top-three">
              {stats.topStreakers.map((user, idx) => (
                <div key={user._id} className={`podium-card rank-${idx + 1}`}>
                  <span className="medal">{getMedalEmoji(idx + 1)}</span>
                  <img 
                    src={user.profilePicture || '/default-avatar.png'} 
                    alt={user.username}
                    className="avatar-small"
                  />
                  <p className="username">{user.username}</p>
                  <p className="stat-value">{user.currentStreak} days 🔥</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Position Card */}
      {user && myPosition && (
        <div className="my-position-card">
          <h3>Your Position</h3>
          <div className="position-details">
            <div className="rank-badge">#{myPosition.currentUser.rank}</div>
            <div className="user-stats">
              <p className="stat-label">Problems Solved</p>
              <p className="stat-value">{myPosition.currentUser.problemsSolved}</p>
            </div>
            <div className="user-stats">
              <p className="stat-label">Accuracy</p>
              <p className="stat-value">{myPosition.currentUser.accuracy.toFixed(1)}%</p>
            </div>
            <div className="user-stats">
              <p className="stat-label">Current Streak</p>
              <p className="stat-value">{myPosition.currentUser.currentStreak} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="leaderboard-filters">
        <div className="filter-group">
          <label>Period:</label>
          <select 
            value={filters.period} 
            onChange={(e) => handleFilterChange('period', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="monthly">This Month</option>
            <option value="weekly">This Week</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={filters.category} 
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="problems">Problems Solved</option>
            <option value="accuracy">Accuracy</option>
            <option value="interviews">Interviews</option>
            <option value="streaks">Streaks</option>
          </select>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="leaderboard-table">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Problems Solved</th>
                <th>Accuracy</th>
                <th>Current Streak</th>
                <th>Achievements</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr 
                  key={entry._id} 
                  className={user && entry._id === user._id ? 'current-user' : ''}
                >
                  <td className="rank-cell">
                    <span className="rank">{getMedalEmoji(entry.rank)}</span>
                  </td>
                  <td className="user-cell">
                    <img 
                      src={entry.profilePicture || '/default-avatar.png'} 
                      alt={entry.username}
                      className="avatar"
                    />
                    <div className="user-info">
                      <p className="username">{entry.username}</p>
                      {entry.fullName && <p className="full-name">{entry.fullName}</p>}
                    </div>
                  </td>
                  <td>{entry.problemsSolved || 0}</td>
                  <td>{(entry.accuracy || 0).toFixed(1)}%</td>
                  <td>{entry.currentStreak || 0} 🔥</td>
                  <td>
                    <span className="badge-count">
                      {entry.achievements?.length || 0} 🏅
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
