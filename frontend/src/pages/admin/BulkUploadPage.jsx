import React from 'react';
import { useNavigate } from 'react-router-dom';
import BulkProblemUpload from '../../components/BulkProblemUpload';
import '../../styles/Dashboard.css';

const BulkUploadPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/dashboard/admin')}>
          ← Back to Dashboard
        </button>
        <h1>Bulk Problem Upload</h1>
        <p className="page-subtitle">
          Upload multiple problems at once to quickly populate your problem library
        </p>
      </div>

      <BulkProblemUpload />

      <div className="help-section" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--background-secondary, #f8f9fa)', borderRadius: '8px' }}>
        <h3>💡 Tips for Successful Bulk Upload</h3>
        <ul style={{ marginLeft: '1.5rem', color: 'var(--text-primary, #333)' }}>
          <li>Use curated problem sets like Blind 75, NeetCode 150, or Striver's SDE Sheet</li>
          <li>Ensure all required fields (title, description, difficulty, topics) are filled</li>
          <li>Verify difficulty values are exactly "Easy", "Medium", or "Hard"</li>
          <li>Use comma-separated values for topics and companies in CSV format</li>
          <li>Test with a small batch (5-10 problems) before uploading large sets</li>
          <li>Duplicate problems (same title) will be automatically skipped</li>
          <li>Review the upload report to identify any failed entries</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkUploadPage;
