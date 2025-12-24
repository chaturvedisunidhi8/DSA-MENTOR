import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProblems: 0,
    topics: 0,
    difficulties: { easy: 0, medium: 0, hard: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate(user.role === 'superadmin' ? '/dashboard/admin' : '/dashboard/client');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchPublicStats();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const fetchPublicStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dashboard/public-stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className={`landing-header ${!isHeaderVisible ? 'header-hidden' : ''}`}>
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            <span className="logo-text">DSA MENTOR</span>
          </div>
          <nav className="landing-nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#problems" className="nav-link">Problems</a>
            <a href="#about" className="nav-link">About</a>
            <ThemeToggle />
            <button onClick={handleGetStarted} className="nav-login-btn">
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Master Data Structures & Algorithms
              <span className="hero-gradient-text"> With AI-Powered Mentorship</span>
            </h1>
            <p className="hero-description">
              Level up your coding skills with curated DSA problems, real-time analytics, 
              and personalized AI guidance. Join thousands of developers preparing for their dream jobs.
            </p>
            <div className="hero-cta">
              <button onClick={handleGetStarted} className="cta-primary">
                Get Started Free
                <span className="cta-arrow">→</span>
              </button>
              <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} 
                      className="cta-secondary">
                Explore Features
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">{stats.totalProblems}+</div>
                <div className="stat-label">Problems</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{stats.topics}+</div>
                <div className="stat-label">Topics</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">🎤 AI</div>
                <div className="stat-label">Interviews</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="code-window">
              <div className="window-header">
                <div className="window-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="window-title">solution.js</div>
              </div>
              <div className="window-content">
                <pre className="code-snippet">
{`function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Excel</h2>
          <p className="section-subtitle">
            Comprehensive tools and resources to accelerate your learning journey
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3 className="feature-title">Curated Problem Set</h3>
            <p className="feature-description">
              Handpicked DSA problems covering arrays, trees, graphs, DP, and more. 
              Organized by difficulty and company tags.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">AI Mentor</h3>
            <p className="feature-description">
              Get instant help with hints, explanations, and optimizations. 
              Your personal coding assistant for learning support.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3 className="feature-title">AI Mock Interviews</h3>
            <p className="feature-description">
              Practice real coding interviews with our AI interviewer. Get instant feedback, 
              hints, and comprehensive performance analysis.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Progress Analytics</h3>
            <p className="feature-description">
              Track your performance, identify weak areas, and monitor improvement 
              with detailed analytics and insights.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3 className="feature-title">Multi-Language Support</h3>
            <p className="feature-description">
              Code in JavaScript, Python, Java, or C++. Practice with the language 
              you're most comfortable with.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3 className="feature-title">Company-Specific Prep</h3>
            <p className="feature-description">
              Filter problems by companies like Google, Amazon, Microsoft. 
              Prepare strategically for your target interviews.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔥</div>
            <h3 className="feature-title">Streak & Achievements</h3>
            <p className="feature-description">
              Stay motivated with daily streaks, badges, and milestones. 
              Gamification that keeps you engaged.
            </p>
          </div>
        </div>
      </section>

      {/* Problems Preview Section */}
      <section id="problems" className="problems-section">
        <div className="section-header">
          <h2 className="section-title">Difficulty Distribution</h2>
          <p className="section-subtitle">
            Balanced problem set for all skill levels
          </p>
        </div>
        <div className="difficulty-cards">
          <div className="difficulty-card easy">
            <div className="difficulty-label">Easy</div>
            <div className="difficulty-count">{stats.difficulties.easy}</div>
            <div className="difficulty-desc">Build foundation</div>
          </div>
          <div className="difficulty-card medium">
            <div className="difficulty-label">Medium</div>
            <div className="difficulty-count">{stats.difficulties.medium}</div>
            <div className="difficulty-desc">Sharpen skills</div>
          </div>
          <div className="difficulty-card hard">
            <div className="difficulty-label">Hard</div>
            <div className="difficulty-count">{stats.difficulties.hard}</div>
            <div className="difficulty-desc">Master concepts</div>
          </div>
        </div>
      </section>

      {/* About/Testimonial Section */}
      <section id="about" className="about-section">
        <div className="about-content">
          <div className="about-text">
            <h2 className="about-title">Why DSA MENTOR?</h2>
            <div className="about-points">
              <div className="about-point">
                <div className="point-icon">✓</div>
                <div className="point-text">
                  <strong>Structured Learning Path:</strong> Progress from basics to advanced topics systematically
                </div>
              </div>
              <div className="about-point">
                <div className="point-icon">✓</div>
                <div className="point-text">
                  <strong>Real Interview Questions:</strong> Practice problems asked in actual technical interviews
                </div>
              </div>
              <div className="about-point">
                <div className="point-icon">✓</div>
                <div className="point-text">
                  <strong>Detailed Solutions:</strong> Learn optimal approaches with step-by-step explanations
                </div>
              </div>
              <div className="about-point">
                <div className="point-icon">🎤</div>
                <div className="point-text">
                  <strong>AI Mock Interviews:</strong> Practice with AI interviewer and get instant feedback on your performance
                </div>
              </div>
              <div className="about-point">
                <div className="point-icon">✓</div>
                <div className="point-text">
                  <strong>Community Driven:</strong> Join a community of learners and grow together
                </div>
              </div>
            </div>
          </div>
          <div className="about-visual">
            <div className="stats-showcase">
              <div className="showcase-item">
                <div className="showcase-number">{stats.totalProblems}+</div>
                <div className="showcase-label">DSA Problems</div>
              </div>
              <div className="showcase-item">
                <div className="showcase-number">{stats.topics}+</div>
                <div className="showcase-label">Topics Covered</div>
              </div>
              <div className="showcase-item">
                <div className="showcase-number">AI</div>
                <div className="showcase-label">Powered Mentor</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Start Your Journey?</h2>
          <p className="cta-description">
            Join thousands of developers mastering DSA and landing their dream jobs
          </p>
          <button onClick={handleGetStarted} className="cta-large-btn">
            Get Started for Free
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">🎯</span>
              <span className="logo-text">DSA MENTOR</span>
            </div>
            <p className="footer-tagline">Master coding, one problem at a time</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#problems">Problems</a>
              <a href="#about">About</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>Documentation</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>Blog</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>Roadmap</a>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>Help Center</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>Community</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleGetStarted(); }}>Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 DSA MENTOR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
