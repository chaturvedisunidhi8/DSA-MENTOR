import { useState, useEffect } from "react";
import api from "../../utils/api";
const ProblemsPage = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Medium",
    topics: "",
    companies: "",
    constraints: "",
    inputFormat: "",
    outputFormat: "",
    hints: "",
  });
  const [sampleTestCases, setSampleTestCases] = useState([{ input: "", output: "" }]);
  const [hiddenTestCases, setHiddenTestCases] = useState([{ input: "", output: "" }]);
  const [starterCode, setStarterCode] = useState({
    javascript: "",
    python: "",
    java: "",
    cpp: "",
  });
  useEffect(() => {
    fetchProblems();
  }, []);
  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/problems/admin/all");
      setProblems(data.data);
    } catch (error) {
      console.error("Error fetching problems:", error);
      alert("Failed to fetch problems");
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleCodeChange = (language, value) => {
    setStarterCode({ ...starterCode, [language]: value });
  };
  const addSampleTestCase = () => {
    setSampleTestCases([...sampleTestCases, { input: "", output: "" }]);
  };
  const addHiddenTestCase = () => {
    setHiddenTestCases([...hiddenTestCases, { input: "", output: "" }]);
  };
  const updateSampleTestCase = (index, field, value) => {
    const updated = [...sampleTestCases];
    updated[index][field] = value;
    setSampleTestCases(updated);
  };
  const updateHiddenTestCase = (index, field, value) => {
    const updated = [...hiddenTestCases];
    updated[index][field] = value;
    setHiddenTestCases(updated);
  };
  const removeSampleTestCase = (index) => {
    setSampleTestCases(sampleTestCases.filter((_, i) => i !== index));
  };
  const removeHiddenTestCase = (index) => {
    setHiddenTestCases(hiddenTestCases.filter((_, i) => i !== index));
  };
  const openModal = (problem = null) => {
    if (problem) {
      setEditingProblem(problem);
      setFormData({
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        topics: problem.topics.join(", "),
        companies: problem.companies?.join(", ") || "",
        constraints: problem.constraints || "",
        inputFormat: problem.inputFormat || "",
        outputFormat: problem.outputFormat || "",
        hints: problem.hints?.join("\n") || "",
      });
      setSampleTestCases(problem.sampleTestCases || [{ input: "", output: "" }]);
      setHiddenTestCases(problem.hiddenTestCases || [{ input: "", output: "" }]);
      setStarterCode(problem.starterCode || { javascript: "", python: "", java: "", cpp: "" });
    } else {
      resetForm();
    }
    setShowModal(true);
  };
  const resetForm = () => {
    setEditingProblem(null);
    setFormData({
      title: "",
      description: "",
      difficulty: "Medium",
      topics: "",
      companies: "",
      constraints: "",
      inputFormat: "",
      outputFormat: "",
      hints: "",
    });
    setSampleTestCases([{ input: "", output: "" }]);
    setHiddenTestCases([{ input: "", output: "" }]);
    setStarterCode({ javascript: "", python: "", java: "", cpp: "" });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const problemData = {
      ...formData,
      topics: formData.topics.split(",").map((t) => t.trim()).filter(Boolean),
      companies: formData.companies.split(",").map((c) => c.trim()).filter(Boolean),
      hints: formData.hints.split("\n").filter(Boolean),
      sampleTestCases: sampleTestCases.filter((tc) => tc.input && tc.output),
      hiddenTestCases: hiddenTestCases.filter((tc) => tc.input && tc.output),
      starterCode,
    };
    try {
      if (editingProblem) {
        await api.put(`/problems/${editingProblem._id}`, problemData);
        alert("Problem updated successfully!");
      } else {
        await api.post("/problems", problemData);
        alert("Problem created successfully!");
      }
      setShowModal(false);
      fetchProblems();
      resetForm();
    } catch (error) {
      console.error("Error saving problem:", error);
      alert(error.response?.data?.message || "Failed to save problem");
    }
  };
  const handleDelete = async (problemId) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) return;
    try {
      await api.delete(`/problems/${problemId}`);
      alert("Problem deleted successfully!");
      fetchProblems();
    } catch (error) {
      console.error("Error deleting problem:", error);
      alert("Failed to delete problem");
    }
  };
  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (loading) {
    return <div className="loading">Loading problems...</div>;
  }
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>📝 Problem Management</h1>
        <p>Create and manage DSA problems with test cases</p>
      </div>
      <div className="problems-controls">
        <input
          type="text"
          placeholder="Search problems..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button className="add-problem-btn" onClick={() => openModal()}>
          ➕ Add New Problem
        </button>
      </div>
      <div className="problems-table-container">
        <table className="problems-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Topics</th>
              <th>Test Cases</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.map((problem) => (
              <tr key={problem._id}>
                <td>{problem.title}</td>
                <td>
                  <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td>{problem.topics.join(", ")}</td>
                <td>
                  {problem.sampleTestCases?.length || 0} sample,{" "}
                  {problem.hiddenTestCases?.length || 0} hidden
                </td>
                <td>
                  <span className={`status-badge ${problem.isActive ? "active" : "inactive"}`}>
                    {problem.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(problem.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      title="Edit"
                      onClick={() => openModal(problem)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete"
                      title="Delete"
                      onClick={() => handleDelete(problem._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredProblems.length === 0 && (
        <div className="no-results">
          <p>No problems found. Create your first problem!</p>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content problem-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingProblem ? "Edit Problem" : "Add New Problem"}</h2>
            <form className="problem-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Basic Information</h3>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Two Sum"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Difficulty *</label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Topics * (comma-separated)</label>
                    <input
                      type="text"
                      name="topics"
                      value={formData.topics}
                      onChange={handleInputChange}
                      placeholder="Arrays, Hash Table"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Companies (comma-separated)</label>
                  <input
                    type="text"
                    name="companies"
                    value={formData.companies}
                    onChange={handleInputChange}
                    placeholder="Google, Amazon, Microsoft"
                  />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Given an array of integers..."
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Constraints</label>
                  <textarea
                    name="constraints"
                    value={formData.constraints}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="1 ≤ n ≤ 10^5..."
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Input Format</label>
                    <textarea
                      name="inputFormat"
                      value={formData.inputFormat}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="First line contains n..."
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label>Output Format</label>
                    <textarea
                      name="outputFormat"
                      value={formData.outputFormat}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Print the result..."
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h3>Sample Test Cases</h3>
                {sampleTestCases.map((testCase, index) => (
                  <div key={index} className="test-case-group">
                    <div className="test-case-header">
                      <span>Test Case {index + 1}</span>
                      {sampleTestCases.length > 1 && (
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeSampleTestCase(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Input</label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) =>
                            updateSampleTestCase(index, "input", e.target.value)
                          }
                          rows="3"
                          placeholder="[2,7,11,15]\n9"
                        ></textarea>
                      </div>
                      <div className="form-group">
                        <label>Expected Output</label>
                        <textarea
                          value={testCase.output}
                          onChange={(e) =>
                            updateSampleTestCase(index, "output", e.target.value)
                          }
                          rows="3"
                          placeholder="[0,1]"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-test-case-btn"
                  onClick={addSampleTestCase}
                >
                  + Add Sample Test Case
                </button>
              </div>
              <div className="form-section">
                <h3>Hidden Test Cases</h3>
                {hiddenTestCases.map((testCase, index) => (
                  <div key={index} className="test-case-group">
                    <div className="test-case-header">
                      <span>Hidden Test Case {index + 1}</span>
                      {hiddenTestCases.length > 1 && (
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeHiddenTestCase(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Input</label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) =>
                            updateHiddenTestCase(index, "input", e.target.value)
                          }
                          rows="3"
                        ></textarea>
                      </div>
                      <div className="form-group">
                        <label>Expected Output</label>
                        <textarea
                          value={testCase.output}
                          onChange={(e) =>
                            updateHiddenTestCase(index, "output", e.target.value)
                          }
                          rows="3"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-test-case-btn"
                  onClick={addHiddenTestCase}
                >
                  + Add Hidden Test Case
                </button>
              </div>
              <div className="form-section">
                <h3>Starter Code (Optional)</h3>
                <div className="code-tabs">
                  {["javascript", "python", "java", "cpp"].map((lang) => (
                    <div key={lang} className="form-group">
                      <label>{lang.charAt(0).toUpperCase() + lang.slice(1)}</label>
                      <textarea
                        value={starterCode[lang]}
                        onChange={(e) => handleCodeChange(lang, e.target.value)}
                        rows="6"
                        placeholder={`function solution() {\n  // Your code here\n}`}
                        className="code-input"
                      ></textarea>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-section">
                <h3>Hints (Optional)</h3>
                <div className="form-group">
                  <label>One hint per line</label>
                  <textarea
                    name="hints"
                    value={formData.hints}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Try using a hash map\nThink about two pointers"
                  ></textarea>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingProblem ? "Update Problem" : "Create Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProblemsPage;
