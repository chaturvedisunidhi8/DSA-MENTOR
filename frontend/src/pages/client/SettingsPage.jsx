import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile settings
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");

  // Preferences
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("javascript");
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences);
      setTheme(prefs.theme || "dark");
      setLanguage(prefs.language || "javascript");
      setNotifications(prefs.notifications !== undefined ? prefs.notifications : true);
      setDailyReminder(prefs.dailyReminder !== undefined ? prefs.dailyReminder : true);
    }
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      // Note: This requires backend endpoint to be implemented
      alert("Profile settings will be saved once backend endpoint is ready!");
      // await api.put("/auth/profile", { username, email });
      // alert("Profile settings saved successfully!");
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile settings");
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      // Save preferences to localStorage for now
      localStorage.setItem("userPreferences", JSON.stringify({
        theme,
        language,
        notifications,
        dailyReminder,
      }));
      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      alert("Failed to save preferences");
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your account and preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          <button
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
          <button
            className={activeTab === "preferences" ? "active" : ""}
            onClick={() => setActiveTab("preferences")}
          >
            🎨 Preferences
          </button>
          <button
            className={activeTab === "security" ? "active" : ""}
            onClick={() => setActiveTab("security")}
          >
            🔒 Security
          </button>
          <button
            className={activeTab === "notifications" ? "active" : ""}
            onClick={() => setActiveTab("notifications")}
          >
            🔔 Notifications
          </button>
        </div>

        <div className="settings-content">
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="settings-form">
              <h2>Profile Information</h2>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  rows="4"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              <button type="submit" className="save-btn">
                Save Changes
              </button>
            </form>
          )}

          {activeTab === "preferences" && (
            <form onSubmit={handleSavePreferences} className="settings-form">
              <h2>Preferences</h2>
              <div className="form-group">
                <label>Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Preferred Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <label htmlFor="notifications">Enable notifications</label>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="dailyReminder"
                  checked={dailyReminder}
                  onChange={(e) => setDailyReminder(e.target.checked)}
                />
                <label htmlFor="dailyReminder">Daily practice reminder</label>
              </div>
              <button type="submit" className="save-btn">
                Save Preferences
              </button>
            </form>
          )}

          {activeTab === "security" && (
            <div className="settings-form">
              <h2>Security Settings</h2>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" />
              </div>
              <button className="save-btn">Update Password</button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-form">
              <h2>Notification Settings</h2>
              <div className="notification-options">
                <div className="notification-item">
                  <div>
                    <h4>Problem Solved</h4>
                    <p>Get notified when you successfully solve a problem</p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="notification-item">
                  <div>
                    <h4>Daily Streak</h4>
                    <p>Reminder to maintain your daily streak</p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
                <div className="notification-item">
                  <div>
                    <h4>New Recommendations</h4>
                    <p>When new problems are recommended for you</p>
                  </div>
                  <input type="checkbox" />
                </div>
                <div className="notification-item">
                  <div>
                    <h4>Achievement Unlocked</h4>
                    <p>When you unlock a new achievement</p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

