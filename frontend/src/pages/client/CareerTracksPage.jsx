import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import '../styles/CareerTracks.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CareerTracksPage = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: 'all', difficulty: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTracks();
  }, [filter]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const params = {};
      
      if (filter.category !== 'all') params.category = filter.category;
      if (filter.difficulty !== 'all') params.difficulty = filter.difficulty;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get(`${API_BASE_URL}/career-tracks`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setTracks(response.data.tracks || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (trackId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(
        `${API_BASE_URL}/career-tracks/${trackId}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh tracks to show enrollment
      fetchTracks();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert(error.response?.data?.message || 'Failed to enroll in track');
    }
  };

  const handleViewTrack = (slug) => {
    navigate(`/dashboard/career-tracks/${slug}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTracks();
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#22c55e',
      intermediate: '#f59e0b',
      advanced: '#ef4444',
      mixed: '#8b5cf6'
    };
    return colors[difficulty] || '#6366f1';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'interview-prep': '🎯',
      'role-specific': '💼',
      'company-specific': '🏢',
      'topic-mastery': '📚',
      'bootcamp': '🚀'
    };
    return icons[category] || '📖';
  };

  if (loading) return <Loading />;

  return (
    <div className="career-tracks-page">
      <div className="tracks-header">
        <div className="header-content">
          <h1>Career Tracks</h1>
          <p>Curated learning paths to help you achieve your career goals</p>
        </div>

        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>

        <div className="filters">
          <div className="filter-group">
            <label>Category:</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            >
              <option value="all">All Categories</option>
              <option value="interview-prep">Interview Prep</option>
              <option value="role-specific">Role-Specific</option>
              <option value="company-specific">Company-Specific</option>
              <option value="topic-mastery">Topic Mastery</option>
              <option value="bootcamp">Bootcamp</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Difficulty:</label>
            <select
              value={filter.difficulty}
              onChange={(e) => setFilter({ ...filter, difficulty: e.target.value })}
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="no-tracks">
          <p>No career tracks found matching your criteria.</p>
        </div>
      ) : (
        <div className="tracks-grid">
          {tracks.map((track) => (
            <Card key={track._id} className="track-card">
              <div className="track-header">
                <div className="track-icon" style={{ background: track.color }}>
                  {track.icon || getCategoryIcon(track.category)}
                </div>
                <div className="track-badges">
                  <span
                    className="difficulty-badge"
                    style={{ background: getDifficultyColor(track.difficulty) }}
                  >
                    {track.difficulty}
                  </span>
                  {track.isPremium && <span className="premium-badge">⭐ Premium</span>}
                </div>
              </div>

              <h3>{track.title}</h3>
              <p className="track-description">{track.description}</p>

              {track.targetRole && (
                <div className="target-role">
                  <span className="role-icon">💼</span>
                  <span>{track.targetRole}</span>
                </div>
              )}

              <div className="track-stats">
                <div className="stat">
                  <span className="stat-icon">📝</span>
                  <span>{track.totalProblems || track.modules?.reduce((sum, m) => sum + m.lessons.length, 0) || 0} Problems</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">📚</span>
                  <span>{track.modules?.length || 0} Modules</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">⏱️</span>
                  <span>{track.estimatedDuration || 'Self-paced'}</span>
                </div>
              </div>

              <div className="track-meta">
                <div className="rating">
                  <span className="star">⭐</span>
                  <span>{track.rating?.average?.toFixed(1) || 'New'}</span>
                  {track.rating?.count > 0 && (
                    <span className="rating-count">({track.rating.count})</span>
                  )}
                </div>
                <div className="enrollment">
                  <span>{track.enrollmentCount || 0} enrolled</span>
                </div>
              </div>

              {track.userProgress ? (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${track.userProgress.completionPercentage || 0}%`,
                        background: track.color
                      }}
                    />
                  </div>
                  <div className="progress-text">
                    <span>{track.userProgress.completionPercentage || 0}% complete</span>
                    <span className="status-badge status-{track.userProgress.status}">
                      {track.userProgress.status}
                    </span>
                  </div>
                  <Button onClick={() => handleViewTrack(track.slug)} className="continue-btn">
                    Continue Learning
                  </Button>
                </div>
              ) : (
                <div className="actions">
                  <Button onClick={() => handleViewTrack(track.slug)} variant="secondary">
                    View Details
                  </Button>
                  <Button onClick={() => handleEnroll(track._id)}>
                    Enroll Now
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareerTracksPage;
