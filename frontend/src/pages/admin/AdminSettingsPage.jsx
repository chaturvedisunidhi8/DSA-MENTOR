import { useState } from "react";

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    siteName: "DSA Mentor",
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    maxFileSize: "10",
    sessionTimeout: "30",
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Save settings to localStorage for now
      localStorage.setItem("adminSettings", JSON.stringify(settings));
      alert("Settings saved successfully!");
      // TODO: Implement backend API endpoint
      // await api.put("/admin/settings", settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>⚙️ Admin Settings</h1>
        <p>Configure platform settings and preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          <button
            className={activeTab === "general" ? "active" : ""}
            onClick={() => setActiveTab("general")}
          >
            🌐 General
          </button>
          <button
            className={activeTab === "security" ? "active" : ""}
            onClick={() => setActiveTab("security")}
          >
            🔒 Security
          </button>
          <button
            className={activeTab === "email" ? "active" : ""}
            onClick={() => setActiveTab("email")}
          >
            📧 Email
          </button>
          <button
            className={activeTab === "database" ? "active" : ""}
            onClick={() => setActiveTab("database")}
          >
            💾 Database
          </button>
          <button
            className={activeTab === "advanced" ? "active" : ""}
            onClick={() => setActiveTab("advanced")}
          >
            ⚡ Advanced
          </button>
        </div>

        <div className="settings-content">
          {activeTab === "general" && (
            <form onSubmit={handleSave} className="settings-form">
              <h2>General Settings</h2>
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) =>
                    setSettings({ ...settings, siteName: e.target.value })
                  }
                />
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenanceMode: e.target.checked })
                  }
                />
                <label htmlFor="maintenanceMode">Enable Maintenance Mode</label>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onChange={(e) =>
                    setSettings({ ...settings, allowRegistration: e.target.checked })
                  }
                />
                <label htmlFor="allowRegistration">Allow New User Registration</label>
              </div>
              <button type="submit" className="save-btn">
                Save Changes
              </button>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSave} className="settings-form">
              <h2>Security Settings</h2>
              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    setSettings({ ...settings, sessionTimeout: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Max Login Attempts</label>
                <input type="number" defaultValue="5" />
              </div>
              <div className="form-group">
                <label>Password Minimum Length</label>
                <input type="number" defaultValue="8" />
              </div>
              <div className="form-group checkbox">
                <input type="checkbox" id="requireStrongPassword" defaultChecked />
                <label htmlFor="requireStrongPassword">
                  Require Strong Passwords
                </label>
              </div>
              <div className="form-group checkbox">
                <input type="checkbox" id="enable2FA" />
                <label htmlFor="enable2FA">Enable Two-Factor Authentication</label>
              </div>
              <button type="submit" className="save-btn">
                Save Changes
              </button>
            </form>
          )}

          {activeTab === "email" && (
            <form onSubmit={handleSave} className="settings-form">
              <h2>Email Configuration</h2>
              <div className="form-group">
                <label>SMTP Host</label>
                <input type="text" placeholder="smtp.gmail.com" />
              </div>
              <div className="form-group">
                <label>SMTP Port</label>
                <input type="number" placeholder="587" />
              </div>
              <div className="form-group">
                <label>SMTP Username</label>
                <input type="text" placeholder="your-email@gmail.com" />
              </div>
              <div className="form-group">
                <label>SMTP Password</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, emailNotifications: e.target.checked })
                  }
                />
                <label htmlFor="emailNotifications">Enable Email Notifications</label>
              </div>
              <button type="submit" className="save-btn">
                Save Changes
              </button>
              <button type="button" className="test-btn">
                Send Test Email
              </button>
            </form>
          )}

          {activeTab === "database" && (
            <div className="settings-form">
              <h2>Database Management</h2>
              <div className="database-info">
                <div className="info-item">
                  <span>Database Size:</span>
                  <span className="value">2.4 GB</span>
                </div>
                <div className="info-item">
                  <span>Total Records:</span>
                  <span className="value">45,678</span>
                </div>
                <div className="info-item">
                  <span>Last Backup:</span>
                  <span className="value">2 hours ago</span>
                </div>
              </div>
              <div className="database-actions">
                <button className="action-btn">🔄 Backup Database</button>
                <button className="action-btn">📥 Restore Database</button>
                <button className="action-btn warning">🗑️ Clear Cache</button>
                <button className="action-btn danger">⚠️ Reset Database</button>
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <form onSubmit={handleSave} className="settings-form">
              <h2>Advanced Settings</h2>
              <div className="form-group">
                <label>Max Upload File Size (MB)</label>
                <input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) =>
                    setSettings({ ...settings, maxFileSize: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>API Rate Limit (requests/minute)</label>
                <input type="number" defaultValue="100" />
              </div>
              <div className="form-group">
                <label>Log Level</label>
                <select>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              <div className="form-group checkbox">
                <input type="checkbox" id="enableDebugMode" />
                <label htmlFor="enableDebugMode">Enable Debug Mode</label>
              </div>
              <div className="form-group checkbox">
                <input type="checkbox" id="enableAnalytics" defaultChecked />
                <label htmlFor="enableAnalytics">Enable Analytics Tracking</label>
              </div>
              <button type="submit" className="save-btn">
                Save Changes
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

