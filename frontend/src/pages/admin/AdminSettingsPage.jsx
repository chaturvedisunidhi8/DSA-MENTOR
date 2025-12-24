import { useState, useEffect } from "react";
import api from "../../utils/api";

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    emailNotifications: {
      newUsers: true,
      systemAlerts: true,
      reportSummaries: true,
    },
    twoFactorAuth: false,
    sessionTimeout: 30,
    maintenanceMode: false,
    allowNewRegistrations: true,
    pushNotifications: true,
    emailDigest: "weekly",
  });
  const [databaseInfo, setDatabaseInfo] = useState({
    size: "0 GB",
    totalRecords: "0",
    collections: 0,
    lastBackup: "Never",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/settings");
      if (data.data.settings) {
        setSettings(data.data.settings);
      }
      if (data.data.databaseInfo) {
        setDatabaseInfo(data.data.databaseInfo);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put("/admin/settings", settings);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const { data } = await api.post("/admin/settings/backup");
      alert(data.message);
    } catch (error) {
      console.error("Backup failed:", error);
      alert("Backup failed");
    }
  };

  if (loading) {
    return <div className="page-content"><div className="loading">Loading settings...</div></div>;
  }

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
                  checked={settings.allowNewRegistrations}
                  onChange={(e) =>
                    setSettings({ ...settings, allowNewRegistrations: e.target.checked })
                  }
                />
                <label htmlFor="allowRegistration">Allow New User Registration</label>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, pushNotifications: e.target.checked })
                  }
                />
                <label htmlFor="pushNotifications">Enable Push Notifications</label>
              </div>
              <div className="form-group">
                <label>Email Digest Frequency</label>
                <select
                  value={settings.emailDigest}
                  onChange={(e) =>
                    setSettings({ ...settings, emailDigest: e.target.value })
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="never">Never</option>
                </select>
              </div>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
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
                    setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })
                  }
                  min="5"
                  max="120"
                />
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="enable2FA"
                  checked={settings.twoFactorAuth}
                  onChange={(e) =>
                    setSettings({ ...settings, twoFactorAuth: e.target.checked })
                  }
                />
                <label htmlFor="enable2FA">Enable Two-Factor Authentication</label>
              </div>
              <div className="security-info">
                <p>ℹ️ Password policies and login attempt limits are configured at the application level.</p>
              </div>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === "email" && (
            <form onSubmit={handleSave} className="settings-form">
              <h2>Email Notifications</h2>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="emailNewUsers"
                  checked={settings.emailNotifications?.newUsers}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        newUsers: e.target.checked,
                      },
                    })
                  }
                />
                <label htmlFor="emailNewUsers">Notify on New User Registrations</label>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="emailSystemAlerts"
                  checked={settings.emailNotifications?.systemAlerts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        systemAlerts: e.target.checked,
                      },
                    })
                  }
                />
                <label htmlFor="emailSystemAlerts">System Alerts and Errors</label>
              </div>
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="emailReports"
                  checked={settings.emailNotifications?.reportSummaries}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailNotifications: {
                        ...settings.emailNotifications,
                        reportSummaries: e.target.checked,
                      },
                    })
                  }
                />
                <label htmlFor="emailReports">Weekly Report Summaries</label>
              </div>
              <div className="email-info">
                <p>ℹ️ SMTP configuration is managed through environment variables.</p>
              </div>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === "database" && (
            <div className="settings-form">
              <h2>Database Management</h2>
              <div className="database-info">
                <div className="info-item">
                  <span>Database Size:</span>
                  <span className="value">{databaseInfo.size}</span>
                </div>
                <div className="info-item">
                  <span>Total Records:</span>
                  <span className="value">{databaseInfo.totalRecords}</span>
                </div>
                <div className="info-item">
                  <span>Collections:</span>
                  <span className="value">{databaseInfo.collections}</span>
                </div>
                <div className="info-item">
                  <span>Last Backup:</span>
                  <span className="value">{databaseInfo.lastBackup}</span>
                </div>
              </div>
              <div className="database-actions">
                <button className="action-btn" onClick={handleBackup}>🔄 Backup Database</button>
                <button className="action-btn" disabled>📥 Restore Database (Coming Soon)</button>
              </div>
              <div className="database-warning">
                <p>⚠️ Database operations require additional services and should be performed with caution.</p>
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="settings-form">
              <h2>Advanced Settings</h2>
              <div className="advanced-info">
                <p>ℹ️ Advanced configuration options are managed through environment variables and application code.</p>
                <p>Contact your system administrator for changes to:</p>
                <ul>
                  <li>File upload limits</li>
                  <li>Rate limiting thresholds</li>
                  <li>Cache configuration</li>
                  <li>Logging levels</li>
                  <li>Analytics settings</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

