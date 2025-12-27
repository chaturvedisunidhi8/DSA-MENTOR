import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/MentorDashboard.css';

const MentorDashboardPage = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/mentor/dashboard');
      setDashboardData(data);
      setStudents(data.students);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/mentor/students', { studentEmail: newStudentEmail });
      setShowAddModal(false);
      setNewStudentEmail('');
      fetchDashboard();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm('Are you sure you want to remove this student?')) return;
    
    try {
      await axios.delete(`/api/mentor/students/${studentId}`);
      fetchDashboard();
    } catch (error) {
      alert('Failed to remove student');
    }
  };

  const viewStudentProgress = (studentId) => {
    navigate(`/mentor/students/${studentId}/progress`);
  };

  if (loading) {
    return <div className="loading">Loading mentor dashboard...</div>;
  }

  return (
    <div className="mentor-dashboard">
      <div className="dashboard-header">
        <h1>👨‍🏫 Mentor Dashboard</h1>
        {dashboardData?.mentor && (
          <div className="mentor-info">
            <p className="organization">{dashboardData.mentor.organization || 'Independent Mentor'}</p>
            {dashboardData.mentor.isVerified && <span className="verified-badge">✓ Verified</span>}
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Total Students</p>
            <p className="stat-value">{dashboardData?.stats.totalStudents || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <p className="stat-label">Active Students</p>
            <p className="stat-value">{dashboardData?.stats.activeStudents || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💻</div>
          <div className="stat-content">
            <p className="stat-label">Avg Problems Solved</p>
            <p className="stat-value">{dashboardData?.stats.avgProblemsSolved || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <p className="stat-label">Avg Accuracy</p>
            <p className="stat-value">{dashboardData?.stats.avgAccuracy || 0}%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
        <button 
          className={activeTab === 'assign' ? 'active' : ''}
          onClick={() => setActiveTab('assign')}
        >
          Assignments
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <h2>Student Performance Overview</h2>
          <div className="performance-chart">
            {students.length === 0 ? (
              <div className="empty-state">
                <p>No students added yet</p>
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  Add Your First Student
                </button>
              </div>
            ) : (
              <div className="student-grid">
                {students.slice(0, 6).map((student) => (
                  <div key={student._id} className="student-card-mini">
                    <h4>{student.username}</h4>
                    <div className="mini-stats">
                      <div>
                        <span className="label">Problems:</span>
                        <span className="value">{student.problemsSolved}</span>
                      </div>
                      <div>
                        <span className="label">Accuracy:</span>
                        <span className="value">{student.accuracy}%</span>
                      </div>
                      <div>
                        <span className="label">Streak:</span>
                        <span className="value">{student.currentStreak} 🔥</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="tab-content">
          <div className="students-header">
            <h2>Manage Students</h2>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add Student
            </button>
          </div>

          <div className="students-table">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Problems Solved</th>
                  <th>Accuracy</th>
                  <th>Current Streak</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td className="student-name-cell">
                      <div className="student-name">
                        <strong>{student.username}</strong>
                        {student.fullName && <span className="full-name">{student.fullName}</span>}
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>{student.problemsSolved || 0}</td>
                    <td>{(student.accuracy || 0).toFixed(1)}%</td>
                    <td>{student.currentStreak || 0} 🔥</td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => viewStudentProgress(student._id)}
                        className="btn-view"
                      >
                        View Progress
                      </button>
                      <button 
                        onClick={() => handleRemoveStudent(student._id)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="tab-content">
          <h2>Create Assignments</h2>
          <div className="assignment-section">
            <p>Assignment features coming soon. You'll be able to:</p>
            <ul>
              <li>Assign specific problems to students</li>
              <li>Create custom problem sets</li>
              <li>Set due dates and track completion</li>
              <li>Assign career tracks to students</li>
            </ul>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Student</h3>
            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label>Student Email:</label>
                <input 
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Add Student</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDashboardPage;
