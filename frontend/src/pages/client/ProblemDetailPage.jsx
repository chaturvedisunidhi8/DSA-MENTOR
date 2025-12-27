import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
const ProblemDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [runResults, setRunResults] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  
  useEffect(() => {
    let isMounted = true;
    if (isMounted && slug) {
      fetchProblem();
    }
    return () => { isMounted = false; };
  }, [slug]);
  const fetchProblem = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/problems/${slug}`);
      setProblem(data.data);
      setCode(data.data.starterCode?.[selectedLanguage] || "");
    } catch (error) {
      console.error("Error fetching problem:", error);
      alert("Failed to fetch problem");
      navigate("/dashboard/practice");
    } finally {
      setLoading(false);
    }
  };
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setCode(problem.starterCode?.[lang] || "");
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      alert("Please write some code first!");
      return;
    }

    try {
      const { data } = await api.post(`/problems/${slug}/run`, {
        code,
        language: selectedLanguage,
      });

      setRunResults(data);

      const summary = `${data.passedTests}/${data.totalTests} sample tests passed`;
      alert(`Run complete\n\n${summary}`);
    } catch (error) {
      console.error("Code execution error:", error);
      const message = error.response?.data?.message || "Failed to run code";
      alert(message);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert("Please write some code first!");
      return;
    }

    const confirmed = window.confirm(
      "Submit your solution?\n\n" +
      "Your code will be tested against all test cases (including hidden ones).\n" +
      "This will count towards your statistics."
    );

    if (!confirmed) return;

    try {
      const response = await api.post(`/problems/${slug}/submit`, {
        code,
        language: selectedLanguage,
      });

      if (response.data.success) {
        const { passed, score, passedTests, totalTests, message, newlySolved, results } = response.data;
        setRunResults({ passedTests, totalTests, results });

        alert(
          `${passed ? '✅' : '❌'} Submission Result\n\n` +
          `${message}\n\n` +
          `Score: ${score}%\n` +
          `Test Cases: ${passedTests}/${totalTests} passed\n` +
          (newlySolved ? '\n🎉 Added to your solved problems!' : '')
        );

        if (newlySolved) {
          setTimeout(() => {
            navigate('/dashboard/client');
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert(
        "Failed to submit solution\n\n" +
        (error.response?.data?.message || "Please try again")
      );
    }
  };
  if (loading) {
    return <div className="loading">Loading problem...</div>;
  }
  if (!problem) {
    return <div className="error">Problem not found</div>;
  }
  return (
    <div className="problem-detail-page">
      <div className="problem-container">
        <div className="problem-left">
          <div className="problem-header">
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div className="problem-title-group">
              <h1>{problem.title}</h1>
              <div className="problem-meta-info">
                <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty}
                </span>
                {problem.acceptanceRate > 0 && (
                  <span className="acceptance-stat">
                    <span className="stat-icon">✓</span>
                    {problem.acceptanceRate}% Acceptance
                  </span>
                )}
                {problem.stats?.totalAttempts > 0 && (
                  <span className="attempts-stat">
                    <span className="stat-icon">👥</span>
                    {problem.stats.totalAttempts} Attempts
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="problem-tabs">
            <button
              className={activeTab === "description" ? "active" : ""}
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              className={activeTab === "solutions" ? "active" : ""}
              onClick={() => setActiveTab("solutions")}
            >
              Solutions
            </button>
            <button
              className={activeTab === "submissions" ? "active" : ""}
              onClick={() => setActiveTab("submissions")}
            >
              Submissions
            </button>
          </div>
          <div className="problem-content">
            {activeTab === "description" && (
              <>
                <div className="problem-description">
                  <h3>Problem Description</h3>
                  <p>{problem.description}</p>
                </div>
                
                <div className="problem-formats-grid">
                  {problem.inputFormat && (
                    <div className="problem-section format-section">
                      <h3>📥 Input Format</h3>
                      <div className="format-content">
                        <p>{problem.inputFormat}</p>
                      </div>
                    </div>
                  )}
                  {problem.outputFormat && (
                    <div className="problem-section format-section">
                      <h3>📤 Output Format</h3>
                      <div className="format-content">
                        <p>{problem.outputFormat}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {problem.constraints && (
                  <div className="problem-section">
                    <h3>⚠️ Constraints</h3>
                    <pre className="constraints-box">{problem.constraints}</pre>
                  </div>
                )}
                {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
                  <div className="problem-section">
                    <h3>📝 Sample Test Cases</h3>
                    <div className="test-cases-grid">
                      {problem.sampleTestCases.map((testCase, idx) => (
                        <div key={idx} className="test-case">
                          <div className="test-case-header">
                            <h4>Example {idx + 1}</h4>
                          </div>
                          <div className="test-case-content">
                            <div className="test-case-item">
                              <strong>Input:</strong>
                              <pre>{testCase.input}</pre>
                            </div>
                            <div className="test-case-item">
                              <strong>Output:</strong>
                              <pre>{testCase.output}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {problem.hints && problem.hints.length > 0 && (
                  <div className="problem-section">
                    <h3>Hints</h3>
                    {problem.hints.map((hint, idx) => (
                      <div key={idx} className="hint">
                        💡 {hint}
                      </div>
                    ))}
                  </div>
                )}
                <div className="problem-meta-sections">
                  <div className="problem-section">
                    <h3>🏷️ Topics</h3>
                    <div className="topic-tags">
                      {problem.topics.map((topic, idx) => (
                        <span key={idx} className="topic-tag">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  {problem.companies && problem.companies.length > 0 && (
                    <div className="problem-section">
                      <h3>🏢 Companies</h3>
                      <div className="company-tags">
                        {problem.companies.map((company, idx) => (
                          <span key={idx} className="company-tag">
                            {company}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {activeTab === "solutions" && (
              <div className="solutions-tab">
                <p>Solutions will be available after solving the problem.</p>
              </div>
            )}
            {activeTab === "submissions" && (
              <div className="submissions-tab">
                <p>Your submissions will appear here.</p>
              </div>
            )}
          </div>
        </div>
        <div className="problem-right">
          <div className="code-editor-header">
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="language-select"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <div className="code-editor">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your solution here..."
              className="code-textarea"
            ></textarea>
          </div>
          <div className="code-actions">
            <button className="run-btn" onClick={handleRunCode}>
              ▶ Run Code
            </button>
            <button className="submit-btn" onClick={handleSubmit}>
              ✓ Submit
            </button>
          </div>
          {runResults && (
            <div className="execution-results">
              <h4>Latest Execution</h4>
              <p>
                Passed {runResults.passedTests}/{runResults.totalTests} test cases
              </p>
              <div className="results-table">
                <div className="results-row header">
                  <span>#</span>
                  <span>Status</span>
                  <span>Stdout</span>
                  <span>Stderr</span>
                </div>
                {runResults.results?.map((result) => (
                  <div key={result.index} className="results-row">
                    <span>{result.index + 1}</span>
                    <span className={result.passed ? "pass" : "fail"}>
                      {result.passed ? "Pass" : "Fail"}
                      {result.isHidden ? " (hidden)" : ""}
                    </span>
                    <span><pre>{result.stdout || ""}</pre></span>
                    <span><pre>{result.stderr || ""}</pre></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ProblemDetailPage;

