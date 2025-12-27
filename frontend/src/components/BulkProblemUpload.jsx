import React, { useState } from 'react';
import { Card } from './ui';
import '../styles/BulkProblemUpload.css';

const BulkProblemUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel'];
      const validExtensions = ['.csv', '.json'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
        setSelectedFile(file);
        setUploadResult(null);
      } else {
        alert('Please select a valid CSV or JSON file');
        e.target.value = null;
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('bulkFile', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/problems/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          ...data
        });
        setSelectedFile(null);
        // Reset file input
        document.getElementById('bulkFileInput').value = null;
      } else {
        setUploadResult({
          success: false,
          message: data.message || 'Upload failed'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error.message || 'An error occurred during upload'
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `title,description,difficulty,topics,companies,constraints,inputFormat,outputFormat,sampleInput1,sampleOutput1,sampleInput2,sampleOutput2
"Two Sum","Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.","Easy","Array,Hash Table","Google,Amazon,Microsoft","1 ≤ nums.length ≤ 10^4","First line: n (array length) and target. Second line: n space-separated integers.","Print two space-separated indices (0-indexed), or -1 if no solution exists.","5 9
2 7 11 15","0 1","4 6
3 2 4","0 2"
"Reverse String","Write a function that reverses a string.","Easy","String,Two Pointers","Amazon,Facebook","1 ≤ s.length ≤ 10^5","A single string s","Print the reversed string","hello","olleh","DSA","ASD"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'problem_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadJSONTemplate = () => {
    const jsonContent = {
      problems: [
        {
          title: "Two Sum",
          description: "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",
          difficulty: "Easy",
          topics: ["Array", "Hash Table"],
          companies: ["Google", "Amazon", "Microsoft"],
          constraints: "1 ≤ nums.length ≤ 10^4",
          inputFormat: "First line: n (array length) and target. Second line: n space-separated integers.",
          outputFormat: "Print two space-separated indices (0-indexed), or -1 if no solution exists.",
          hints: ["Use a hash map to store complements", "One-pass solution is possible"],
          sampleTestCases: [
            {
              input: "5 9\n2 7 11 15",
              output: "0 1",
              isHidden: false
            },
            {
              input: "4 6\n3 2 4",
              output: "0 2",
              isHidden: false
            }
          ],
          starterCode: {
            javascript: "function twoSum(nums, target) {\n  // Your code here\n}",
            python: "def two_sum(nums, target):\n    # Your code here\n    pass"
          }
        },
        {
          title: "Reverse String",
          description: "Write a function that reverses a string. The input string is given as an array of characters.",
          difficulty: "Easy",
          topics: ["String", "Two Pointers"],
          companies: ["Amazon", "Facebook"],
          constraints: "1 ≤ s.length ≤ 10^5",
          inputFormat: "A single string s",
          outputFormat: "Print the reversed string",
          hints: ["Use two pointers approach", "Swap characters from both ends"],
          sampleTestCases: [
            {
              input: "hello",
              output: "olleh",
              isHidden: false
            }
          ]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'problem_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadFailedProblems = () => {
    if (!uploadResult || !uploadResult.details) return;

    const failedData = {
      duplicates: uploadResult.details.duplicates || [],
      failed: uploadResult.details.failed || []
    };

    const blob = new Blob([JSON.stringify(failedData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_problems.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="bulk-upload-card">
      <div className="bulk-upload-container">
        <div className="bulk-upload-header">
          <h2>Bulk Problem Upload</h2>
          <p className="bulk-upload-subtitle">
            Upload multiple problems at once using CSV or JSON format
          </p>
        </div>

        {/* Instructions Section */}
        <div className="bulk-upload-section">
          <h3>Instructions</h3>
          <ul className="bulk-upload-instructions">
            <li>Download a template file (CSV or JSON format)</li>
            <li>Fill in your problem data following the template structure</li>
            <li>Upload the completed file using the form below</li>
            <li>Duplicate problems (based on title) will be automatically skipped</li>
          </ul>
        </div>

        {/* Template Downloads */}
        <div className="bulk-upload-section">
          <h3>Download Templates</h3>
          <div className="template-buttons">
            <button 
              className="btn btn-outline"
              onClick={downloadCSVTemplate}
            >
              📄 Download CSV Template
            </button>
            <button 
              className="btn btn-outline"
              onClick={downloadJSONTemplate}
            >
              📋 Download JSON Template
            </button>
            <button 
              className="btn btn-text"
              onClick={() => setShowTemplate(!showTemplate)}
            >
              {showTemplate ? '▼ Hide Format Details' : '▶ Show Format Details'}
            </button>
          </div>

          {showTemplate && (
            <div className="template-info">
              <h4>Required Fields:</h4>
              <ul>
                <li><strong>title</strong>: Problem title (must be unique)</li>
                <li><strong>description</strong>: Problem description</li>
                <li><strong>difficulty</strong>: Easy, Medium, or Hard</li>
                <li><strong>topics</strong>: Comma-separated list (e.g., "Array,Hash Table")</li>
              </ul>
              <h4>Optional Fields:</h4>
              <ul>
                <li><strong>companies</strong>: Comma-separated company names</li>
                <li><strong>constraints</strong>: Problem constraints</li>
                <li><strong>inputFormat</strong>: Input format description</li>
                <li><strong>outputFormat</strong>: Expected output format</li>
                <li><strong>sampleInput1, sampleOutput1</strong>: First test case</li>
                <li><strong>sampleInput2, sampleOutput2</strong>: Second test case (add more as needed)</li>
                <li><strong>hints</strong>: Pipe-separated hints (CSV) or array (JSON)</li>
              </ul>
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="bulk-upload-section">
          <h3>Upload File</h3>
          <div className="file-upload-area">
            <input
              id="bulkFileInput"
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="bulkFileInput" className="file-label">
              {selectedFile ? (
                <span>📁 {selectedFile.name}</span>
              ) : (
                <span>📁 Choose CSV or JSON file...</span>
              )}
            </label>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Problems'}
            </button>
          </div>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`bulk-upload-result ${uploadResult.success ? 'success' : 'error'}`}>
            <h3>{uploadResult.success ? '✅ Upload Complete' : '❌ Upload Failed'}</h3>
            <p className="result-message">{uploadResult.message}</p>
            
            {uploadResult.summary && (
              <div className="result-summary">
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Processed:</span>
                    <span className="summary-value">{uploadResult.summary.totalProcessed}</span>
                  </div>
                  <div className="summary-item success">
                    <span className="summary-label">✅ Successful:</span>
                    <span className="summary-value">{uploadResult.summary.successful}</span>
                  </div>
                  <div className="summary-item warning">
                    <span className="summary-label">⚠️ Duplicates:</span>
                    <span className="summary-value">{uploadResult.summary.duplicates}</span>
                  </div>
                  <div className="summary-item error">
                    <span className="summary-label">❌ Failed:</span>
                    <span className="summary-value">{uploadResult.summary.failed}</span>
                  </div>
                </div>

                {(uploadResult.details?.duplicates?.length > 0 || uploadResult.details?.failed?.length > 0) && (
                  <div className="result-details">
                    {uploadResult.details.duplicates?.length > 0 && (
                      <div className="detail-section">
                        <h4>Duplicate Problems (Skipped):</h4>
                        <ul>
                          {uploadResult.details.duplicates.map((item, index) => (
                            <li key={index}>
                              <strong>{item.title}</strong> - {item.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {uploadResult.details.failed?.length > 0 && (
                      <div className="detail-section">
                        <h4>Failed Problems:</h4>
                        <ul>
                          {uploadResult.details.failed.map((item, index) => (
                            <li key={index}>
                              <strong>{item.title}</strong> - {item.reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button 
                      className="btn btn-outline"
                      onClick={downloadFailedProblems}
                    >
                      💾 Download Failed Problems Report
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default BulkProblemUpload;
