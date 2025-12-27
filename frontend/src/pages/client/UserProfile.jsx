import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { socialAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/UserProfile.css';

const UserProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [social, setSocial] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialAPI.getUserProfile(username);
      setProfile(data.profile);
      setSocial(data.social);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      alert('Please login to follow users');
      return;
    }

    try {
      setFollowLoading(true);
      if (social.isFollowing) {
        await socialAPI.unfollowUser(profile._id);
      } else {
        await socialAPI.followUser(profile._id);
      }
      await fetchProfile(); // Refresh profile
    } catch (err) {
      console.error('Error following/unfollowing:', err);
      alert(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const formatActivityType = (type) => {
    const types = {
      solved_problem: '✅ Solved',
      earned_achievement: '🏆 Earned',
      started_track: '📚 Started',
      completed_interview: '💼 Completed',
      posted_discussion: '💬 Posted'
    };
    return types[type] || type;
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  };

  if (loading) {
    return (
      <div className="user-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-error">
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.userId === profile._id;

  return (
    <div className="user-profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt={profile.username} />
            ) : (
              <div className="avatar-placeholder">
                {profile.username?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h1>{profile.fullName || profile.username}</h1>
            <p className="profile-username">@{profile.username}</p>
            <p className="profile-level">{profile.currentLevel}</p>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}

            <div className="profile-links">
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-github"></i> GitHub
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-linkedin"></i> LinkedIn
                </a>
              )}
            </div>

            {!isOwnProfile && currentUser && (
              <button
                className={`btn-follow ${social.isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? '...' : social.isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{profile.problemsSolved}</span>
              <span className="stat-label">Problems Solved</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profile.accuracy}%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profile.streak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{social.followersCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{social.followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Recent Activity
        </button>
        <button
          className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills & Achievements
        </button>
        <button
          className={`tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({social.followersCount})
        </button>
        <button
          className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Following ({social.followingCount})
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === 'activity' && (
          <div className="activity-feed">
            <h2>Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="no-activity">No recent activity</p>
            ) : (
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <span className="activity-type">{formatActivityType(activity.type)}</span>
                    <span className="activity-details">{activity.details}</span>
                    <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="skills-achievements">
            <div className="skills-section">
              <h2>Skills</h2>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="skills-tags">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="no-data">No skills listed</p>
              )}
            </div>

            <div className="badges-section">
              <h2>Badges</h2>
              <div className="badges-grid">
                <div className="badge-item">
                  <span className="badge-icon">🥉</span>
                  <span className="badge-count">{profile.badges.bronze}</span>
                  <span className="badge-name">Bronze</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">🥈</span>
                  <span className="badge-count">{profile.badges.silver}</span>
                  <span className="badge-name">Silver</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">🥇</span>
                  <span className="badge-count">{profile.badges.gold}</span>
                  <span className="badge-name">Gold</span>
                </div>
                <div className="badge-item">
                  <span className="badge-icon">💎</span>
                  <span className="badge-count">{profile.badges.platinum}</span>
                  <span className="badge-name">Platinum</span>
                </div>
              </div>
            </div>

            <div className="achievements-section">
              <h2>Achievements ({profile.achievements.length})</h2>
              {profile.achievements.length > 0 ? (
                <div className="achievements-grid">
                  {profile.achievements.slice(0, 9).map((achievement, index) => (
                    <div key={index} className="achievement-card">
                      <span className="achievement-id">{achievement.achievementId}</span>
                      <span className="achievement-date">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No achievements yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="followers-list">
            <h2>Followers</h2>
            {social.followers.length === 0 ? (
              <p className="no-data">No followers yet</p>
            ) : (
              <div className="users-grid">
                {social.followers.map((follower) => (
                  <Link key={follower._id} to={`/profile/${follower.username}`} className="user-card">
                    <div className="user-avatar">
                      {follower.profilePicture ? (
                        <img src={follower.profilePicture} alt={follower.username} />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {follower.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <h3>{follower.fullName || follower.username}</h3>
                      <p>@{follower.username}</p>
                      <p className="user-stats">{follower.problemsSolved} problems solved</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="following-list">
            <h2>Following</h2>
            {social.following.length === 0 ? (
              <p className="no-data">Not following anyone yet</p>
            ) : (
              <div className="users-grid">
                {social.following.map((user) => (
                  <Link key={user._id} to={`/profile/${user.username}`} className="user-card">
                    <div className="user-avatar">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.username} />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <h3>{user.fullName || user.username}</h3>
                      <p>@{user.username}</p>
                      <p className="user-stats">{user.problemsSolved} problems solved</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
