import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import '../styles/CareerTrackDetail.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CareerTrackDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [track, setTrack] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState([]);

  useEffect(() => {
    fetchTrackDetails();
  }, [slug]);

  const fetchTrackDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/career-tracks/${slug}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setTrack(response.data.track);
      setUserProgress(response.data.userProgress);
      
      // Auto-expand first unlocked module
      if (response.data.track?.modules) {
        const firstUnlocked = response.data.track.modules.find(m => m.isUnlocked);
        if (firstUnlocked) {
          setExpandedModules([firstUnlocked._id]);
        }
      }
    } catch (error) {
      console.error('Error fetching track:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(
        `${API_BASE_URL}/career-tracks/${track._id}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchTrackDetails();
    } catch (error) {
      console.error('Error enrolling:', error);
      alert(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleStartLesson = (moduleId, lessonId, problemId) => {
    navigate(`/dashboard/practice/${problemId}`);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  if (loading) return <Loading />;
  if (!track) return <div className="error">Track not found</div>;

  const completionPercentage = userProgress
    ? Math.round((userProgress.completedLessons.length / track.totalLessons) * 100)
    : 0;

  return (
    <div className="track-detail-page">
      <div className="track-hero" style={{ borderColor: track.color }}>
        <div className="hero-content">
          <div className="hero-icon" style={{ background: track.color }}>
            {track.icon || '📚'}
          </div>
          <div className="hero-text">
            <h1>{track.title}</h1>
            <p className="hero-description">{track.description}</p>
            
            <div className="hero-meta">
              <span className="meta-item">
                <span className="icon">📝</span>
                {track.totalProblems} Problems
              </span>
              <span className="meta-item">
                <span className="icon">📚</span>
                {track.modules.length} Modules
              </span>
              <span className="meta-item">
                <span className="icon">⏱️</span>
                {track.estimatedDuration || 'Self-paced'}
              </span>
              <span className="meta-item">
                <span className="icon">👥</span>
                {track.enrollmentCount} enrolled
              </span>
            </div>

            {!userProgress && (
              <Button onClick={handleEnroll} className="enroll-btn" size="large">
                Enroll in Track
              </Button>
            )}
          </div>
        </div>

        {userProgress && (
          <div className="progress-card">
            <h3>Your Progress</h3>
            <div className="progress-bar-large">
              <div
                className="progress-fill"
                style={{ width: `${completionPercentage}%`, background: track.color }}
              />
            </div>
            <div className="progress-stats">
              <span>{userProgress.completedLessons.length} / {track.totalLessons} lessons completed</span>
              <span className="percentage">{completionPercentage}%</span>
            </div>
            <div className="status-badge status-{userProgress.status}">
              {userProgress.status.replace('-', ' ')}
            </div>
          </div>
        )}
      </div>

      {track.longDescription && (
        <Card className="description-card">
          <h2>About This Track</h2>
          <p>{track.longDescription}</p>
          
          {track.targetRole && (
            <div className="target-info">
              <h3>Target Role</h3>
              <p>💼 {track.targetRole}</p>
            </div>
          )}

          {track.tags && track.tags.length > 0 && (
            <div className="tags">
              {track.tags.map(tag => (
                <span key={tag} className="tag" style={{ borderColor: track.color }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="modules-section">
        <h2>Course Modules</h2>
        
        {track.modules.map((module, moduleIndex) => {
          const isExpanded = expandedModules.includes(module._id);
          const isUnlocked = module.isUnlocked !== false; // Default to unlocked if not specified
          const completedLessonsCount = userProgress
            ? module.lessons.filter(l => l.isCompleted).length
            : 0;
          const moduleProgress = module.lessons.length > 0
            ? Math.round((completedLessonsCount / module.lessons.length) * 100)
            : 0;

          return (
            <Card
              key={module._id}
              className={`module-card ${isUnlocked ? '' : 'locked'} ${isExpanded ? 'expanded' : ''}`}
            >
              <div
                className="module-header"
                onClick={() => isUnlocked && toggleModule(module._id)}
                style={{ cursor: isUnlocked ? 'pointer' : 'not-allowed' }}
              >
                <div className="module-info">
                  <div className="module-number" style={{ background: track.color }}>
                    {moduleIndex + 1}
                  </div>
                  <div className="module-text">
                    <h3>
                      {isUnlocked ? '' : '🔒 '}
                      {module.icon} {module.title}
                    </h3>
                    {module.description && <p>{module.description}</p>}
                  </div>
                </div>

                <div className="module-meta">
                  <span className="lesson-count">{module.lessons.length} lessons</span>
                  {userProgress && (
                    <div className="module-progress-mini">
                      <div
                        className="progress-bar-mini"
                        style={{ width: `${moduleProgress}%`, background: track.color }}
                      />
                      <span>{moduleProgress}%</span>
                    </div>
                  )}
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>

              {!isUnlocked && module.unlockRequirement && (
                <div className="unlock-requirement">
                  <span className="lock-icon">🔒</span>
                  <span>
                    {module.unlockRequirement.type === 'module_completed'
                      ? 'Complete previous module to unlock'
                      : module.unlockRequirement.type === 'problems_solved'
                      ? `Solve ${module.unlockRequirement.count} problems to unlock`
                      : 'Complete requirements to unlock'}
                  </span>
                </div>
              )}

              {isExpanded && isUnlocked && (
                <div className="lessons-list">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isCompleted = lesson.isCompleted || false;
                    
                    return (
                      <div
                        key={lesson._id}
                        className={`lesson-item ${isCompleted ? 'completed' : ''}`}
                      >
                        <div className="lesson-info">
                          <span className="lesson-number">{lessonIndex + 1}</span>
                          <div className="lesson-details">
                            <h4>
                              {isCompleted && <span className="checkmark">✓</span>}
                              {lesson.title}
                            </h4>
                            {lesson.description && <p>{lesson.description}</p>}
                            {lesson.estimatedTime && (
                              <span className="estimated-time">
                                ⏱️ {lesson.estimatedTime} min
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="lesson-actions">
                          {lesson.resources && lesson.resources.length > 0 && (
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => {
                                // Open resources modal or dropdown
                                alert('Resources: ' + lesson.resources.map(r => r.title).join(', '));
                              }}
                            >
                              📚 Resources
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => handleStartLesson(module._id, lesson._id, lesson.problemId._id || lesson.problemId)}
                            size="small"
                          >
                            {isCompleted ? 'Review' : 'Start'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {userProgress && userProgress.status === 'completed' && (
        <Card className="completion-card">
          <h2>🎉 Congratulations!</h2>
          <p>You've completed the {track.title} track!</p>
          
          <div className="completion-stats">
            <div className="stat">
              <span className="stat-value">{track.totalLessons}</span>
              <span className="stat-label">Lessons Completed</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {Math.round((userProgress.completedAt - userProgress.enrolledAt) / (1000 * 60 * 60 * 24))}
              </span>
              <span className="stat-label">Days</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {Math.round(userProgress.totalTimeSpent / 3600)}
              </span>
              <span className="stat-label">Hours Spent</span>
            </div>
          </div>

          {!userProgress.rating && (
            <div className="rate-track">
              <h3>Rate This Track</h3>
              <p>Help others by sharing your experience</p>
              <Button onClick={() => {/* Open rating modal */}}>
                Leave a Rating
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default CareerTrackDetailPage;
