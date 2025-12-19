import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "../../styles/InterviewSession.css";

const InterviewSessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [messages, setMessages] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeTab, setActiveTab] = useState("chat"); // For mobile tabs
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (session && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session, timeRemaining]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSession = async () => {
    try {
      const { data } = await api.get(`/interview/session/${sessionId}`);
      setSession(data.session);
      setMessages(data.session.messages || []);
      setTimeRemaining(data.session.timeRemaining || data.session.duration * 60);
      
      if (data.session.currentQuestion) {
        setCode(data.session.currentQuestion.starterCode[language] || "");
      }
      
      // Add initial AI greeting if no messages
      if (!data.session.messages || data.session.messages.length === 0) {
        addAIMessage(
          `Hello! I'm your AI interviewer. Let's begin with your first question. Take your time to read it carefully, and feel free to ask me any clarifying questions before you start coding.`
        );
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      alert("Failed to load interview session");
      navigate("/dashboard/client/interview");
    } finally {
      setLoading(false);
    }
  };

  const addAIMessage = (content) => {
    const newMessage = {
      role: "ai",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addUserMessage = (content) => {
    const newMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || sendingMessage) return;

    const message = userMessage;
    setUserMessage("");
    addUserMessage(message);
    setSendingMessage(true);

    try {
      const { data } = await api.post(`/interview/session/${sessionId}/message`, {
        message,
        code,
      });
      addAIMessage(data.response);
    } catch (error) {
      console.error("Failed to send message:", error);
      addAIMessage("I'm having trouble responding. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRunCode = async () => {
    addUserMessage("Running my code...");
    setSendingMessage(true);

    try {
      const { data } = await api.post(`/interview/session/${sessionId}/run`, {
        code,
        language,
      });
      
      if (data.success) {
        addAIMessage(
          `Great! Your code passed ${data.passedTests}/${data.totalTests} test cases.\n\n${data.feedback}`
        );
      } else {
        addAIMessage(
          `Your code didn't pass all tests. ${data.passedTests}/${data.totalTests} passed.\n\nError: ${data.error}\n\n${data.feedback}`
        );
      }
    } catch (error) {
      console.error("Failed to run code:", error);
      addAIMessage("I couldn't run your code. Please check for syntax errors.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!code.trim()) {
      alert("Please write some code before submitting");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to submit this solution? You won't be able to modify it after submission."
    );
    if (!confirmed) return;

    try {
      const { data } = await api.post(`/interview/session/${sessionId}/submit`, {
        code,
        language,
        questionIndex: currentQuestionIndex,
      });

      addAIMessage(data.feedback);

      // Move to next question or end interview
      if (data.hasNextQuestion) {
        setTimeout(() => {
          setCurrentQuestionIndex(data.nextQuestionIndex);
          setCode(data.nextQuestion.starterCode[language] || "");
          addAIMessage(
            `Let's move on to the next question. Take a moment to read through it.`
          );
        }, 2000);
      } else {
        setTimeout(() => {
          handleEndInterview();
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to submit solution:", error);
      alert("Failed to submit solution. Please try again.");
    }
  };

  const handleEndInterview = async () => {
    try {
      await api.post(`/interview/session/${sessionId}/end`);
      navigate(`/dashboard/client/interview/results/${sessionId}`);
    } catch (error) {
      console.error("Failed to end interview:", error);
      navigate(`/dashboard/client/interview/results/${sessionId}`);
    }
  };

  const handleRequestHint = async () => {
    addUserMessage("Can you give me a hint?");
    setSendingMessage(true);

    try {
      const { data } = await api.post(`/interview/session/${sessionId}/hint`, {
        code,
      });
      addAIMessage(data.hint);
    } catch (error) {
      console.error("Failed to get hint:", error);
      addAIMessage("Let me think about that... Try breaking the problem into smaller steps.");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="loading">Loading interview session...</div>;
  }

  if (!session) {
    return <div className="error">Session not found</div>;
  }

  const currentQuestion = session.questions[currentQuestionIndex];

  return (
    <div className="interview-session">
      <div className="session-header">
        <div className="session-info">
          <h2>🎤 AI Interview in Progress</h2>
          <span className="question-progress">
            Question {currentQuestionIndex + 1} of {session.questions.length}
          </span>
        </div>
        <div className="session-controls">
          <div className={`timer ${timeRemaining < 300 ? "warning" : ""}`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
          <button className="end-btn" onClick={handleEndInterview}>
            End Interview
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="mobile-tabs">
        <button 
          className={`mobile-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button 
          className={`mobile-tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          💻 Code
        </button>
      </div>

      <div className="session-content">
        {/* Left Panel - AI Chat */}
        <div className={`chat-panel ${activeTab === 'chat' ? 'active' : ''}`}>
          <div className="problem-summary">
            <h3>{currentQuestion?.title}</h3>
            <div className="problem-meta">
              <span className={`difficulty ${currentQuestion?.difficulty}`}>
                {currentQuestion?.difficulty}
              </span>
              <span className="topic">{currentQuestion?.topics?.[0]}</span>
            </div>
          </div>

          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === "ai" ? "🤖" : "👤"}
                </div>
                <div className="message-content">
                  <pre>{msg.content}</pre>
                </div>
              </div>
            ))}
            {sendingMessage && (
              <div className="message ai">
                <div className="message-avatar">🤖</div>
                <div className="message-content typing">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask a question or explain your approach..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={sendingMessage}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || sendingMessage}
            >
              Send
            </button>
          </div>

          <div className="quick-actions">
            <button className="hint-btn" onClick={handleRequestHint}>
              💡 Request Hint
            </button>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className={`editor-panel ${activeTab === 'editor' ? 'active' : ''}`}>
          <div className="problem-description">
            <h4>Problem Description</h4>
            <p>{currentQuestion?.description}</p>
            
            {currentQuestion?.examples && currentQuestion.examples.length > 0 && (
              <div className="examples">
                <h5>Examples:</h5>
                {currentQuestion.examples.map((example, idx) => (
                  <div key={idx} className="example">
                    <div><strong>Input:</strong> {example.input}</div>
                    <div><strong>Output:</strong> {example.output}</div>
                    {example.explanation && (
                      <div><strong>Explanation:</strong> {example.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="editor-header">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setCode(currentQuestion?.starterCode?.[e.target.value] || "");
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <textarea
            className="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            spellCheck="false"
          />

          <div className="editor-actions">
            <button className="run-btn" onClick={handleRunCode}>
              ▶️ Run Code
            </button>
            <button className="submit-btn" onClick={handleSubmitSolution}>
              ✅ Submit Solution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSessionPage;
