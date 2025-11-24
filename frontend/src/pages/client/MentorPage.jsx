import { useState } from "react";

const MentorPage = () => {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      type: "mentor",
      message: "Hello! I'm your DSA Mentor. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add user question to chat
    setChatHistory([
      ...chatHistory,
      {
        type: "user",
        message: question,
        timestamp: new Date().toISOString(),
      },
      {
        type: "mentor",
        message: "AI Mentor integration coming soon! For now, you can ask questions to your instructors or search online for DSA concepts. We're working on bringing you an intelligent AI mentor to help with your learning journey.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setQuestion("");
  };

  const handleSuggestionClick = (suggestionText) => {
    setQuestion(suggestionText);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>👨‍🏫 AI Mentor</h1>
        <p>Get personalized guidance and explanations for DSA concepts</p>
      </div>

      <div className="mentor-container">
        <div className="mentor-suggestions">
          <h3>Quick Questions</h3>
          <div className="suggestion-chips">
            <button className="chip" onClick={() => handleSuggestionClick("Explain Binary Search")}>
              Explain Binary Search
            </button>
            <button className="chip" onClick={() => handleSuggestionClick("When to use DP?")}>
              When to use DP?
            </button>
            <button className="chip" onClick={() => handleSuggestionClick("Graph vs Tree")}>
              Graph vs Tree
            </button>
            <button className="chip" onClick={() => handleSuggestionClick("Time Complexity Tips")}>
              Time Complexity Tips
            </button>
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-messages">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                <div className="message-avatar">
                  {msg.type === "mentor" ? "🤖" : "👤"}
                </div>
                <div className="message-content">
                  <p>{msg.message}</p>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask me anything about DSA..."
              className="chat-input"
            />
            <button type="submit" className="send-btn">
              Send 📤
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentorPage;
