import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import "../styles/Login.css";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        if (!formData.username) {
          setError("Username is required for signup");
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters long");
          setLoading(false);
          return;
        }
        result = await signup(
          formData.username,
          formData.email,
          formData.password
        );
      }

      if (result.success) {
        // Redirect based on role
        if (result.user.role === "superadmin") {
          navigate("/dashboard/admin");
        } else {
          navigate("/dashboard/client");
        }
      } else {
        // Enhanced error messages
        const errorMsg = result.message || "Authentication failed";
        
        if (errorMsg.toLowerCase().includes("invalid credentials") || 
            errorMsg.toLowerCase().includes("password")) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (errorMsg.toLowerCase().includes("user not found") || 
                   errorMsg.toLowerCase().includes("not found")) {
          setError("Account not found. Please check your email or sign up for a new account.");
        } else if (errorMsg.toLowerCase().includes("already exists") || 
                   errorMsg.toLowerCase().includes("duplicate")) {
          setError("An account with this email already exists. Please login instead.");
        } else if (errorMsg.toLowerCase().includes("network") || 
                   errorMsg.toLowerCase().includes("failed to fetch")) {
          setError("Network error. Please check your internet connection and try again.");
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      console.error("Form submit error:", err);
      
      // Handle different error types
      if (err.message?.includes("fetch") || err.message?.includes("Network")) {
        setError("Unable to connect to server. Please ensure the backend is running and try again.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later or contact support.");
      } else if (err.response?.status === 401) {
        setError("Invalid credentials. Please check your email and password.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <button className="back-to-landing" onClick={() => navigate('/')}>
        ← Back to Home
      </button>
      <div className="theme-toggle-login">
        <ThemeToggle />
      </div>
      <div className="login-left">
        <div className="branding">
          <div className="icon">{"</>"}</div>
          <h2>DSA Mentor</h2>
        </div>
        <h1>Level up your DSA skills</h1>
        <p>Personalized practice plans, 1:1 feedback, and curated problems.</p>
        <div className="features">
          <div className="feature">
            <span className="check-icon">✓</span>
            <span>Adaptive tracks</span>
          </div>
          <div className="feature">
            <span className="check-icon">✓</span>
            <span>Interview focus</span>
          </div>
          <div className="feature">
            <span className="check-icon">✓</span>
            <span>Mentor feedback</span>
          </div>
        </div>
        <div className="users">
          <div className="avatars">
            <div className="avatar">👤</div>
            <div className="avatar">👤</div>
            <div className="avatar">👤</div>
          </div>
          <span className="badge">Join 1000+ developers</span>
        </div>
      </div>

      <div className="login-right">
        <div className="tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
          >
            Login
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
          >
            Signup
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Enter username"
              />
            </div>
          )}

          <div className="form-group">
            <label>{isLogin ? "Email or Username" : "Email"}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Enter password (min 6 characters)"
            />
            {!isLogin && formData.password && formData.password.length < 6 && (
              <small className="password-hint">Password must be at least 6 characters</small>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {isLogin && (
            <div className="forgot-password">
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => setError("Password reset feature coming soon. Please contact support.")}
              >
                Forgot password?
              </button>
            </div>
          )}

          <div className="form-options">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Secure login</span>
            </label>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Authenticating..." : isLogin ? "Login" : "Signup"}
          </button>

          <div className="divider">or continue with</div>

          <button type="button" className="google-btn">
            <span className="google-icon">G</span>
            Continue with Google
          </button>

          <p className="terms">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
