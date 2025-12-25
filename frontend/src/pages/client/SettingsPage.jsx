import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

const SettingsPage = () => {
  const { user, updateProfile, uploadResume, deleteResume, uploadProfilePicture, deleteProfilePicture } = useAuth();
  const { theme: currentTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Profile settings
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [github, setGithub] = useState(user?.github || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [skills, setSkills] = useState(user?.skills?.join(", ") || "");
  const [experience, setExperience] = useState(user?.experience || "");
  const [education, setEducation] = useState(user?.education || "");
  
  // Resume state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.profilePicture || null);

  // Preferences
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("javascript");
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);

  // Update profile fields when user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setGithub(user.github || "");
      setLinkedin(user.linkedin || "");
      setSkills(user.skills?.join(", ") || "");
      setExperience(user.experience || "");
      setEducation(user.education || "");
      setProfilePicturePreview(user.profilePicture || null);
    }
  }, [user]);

  // Sync theme state with ThemeContext
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences);
      setLanguage(prefs.language || "javascript");
      setNotifications(prefs.notifications !== undefined ? prefs.notifications : true);
      setDailyReminder(prefs.dailyReminder !== undefined ? prefs.dailyReminder : true);
    }
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      const profileData = {
        username,
        email,
        bio,
        phone,
        github,
        linkedin,
        skills: skills.split(",").map(s => s.trim()).filter(s => s),
        experience,
        education,
      };
      
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to update profile" });
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setMessage({ type: "error", text: "Failed to save profile settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: "error", text: "Please upload an image file" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 5MB" });
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setMessage({ type: "", text: "" });
      
      // Auto-upload the profile picture
      handleProfilePictureUpload(file);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      console.log("Uploading profile picture:", file);
      const result = await uploadProfilePicture(file);
      console.log("Upload result:", result);
      
      if (result.success) {
        setMessage({ type: "success", text: "Profile picture updated successfully!" });
        console.log("Profile picture URL:", result.user?.profilePicture);
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to upload profile picture" });
        setProfilePicture(null);
        setProfilePicturePreview(user?.profilePicture || null);
      }
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      setMessage({ type: "error", text: "Failed to upload profile picture" });
      setProfilePicture(null);
      setProfilePicturePreview(user?.profilePicture || null);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureRemove = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await deleteProfilePicture();
      
      if (result.success) {
        setProfilePicture(null);
        setProfilePicturePreview(null);
        setMessage({ type: "success", text: "Profile picture removed successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to remove profile picture" });
      }
    } catch (error) {
      console.error("Failed to remove profile picture:", error);
      setMessage({ type: "error", text: "Failed to remove profile picture" });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setMessage({ type: "error", text: "Please upload a PDF file" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size must be less than 5MB" });
        return;
      }
      setResumeFile(file);
      setMessage({ type: "", text: "" });
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setMessage({ type: "error", text: "Please select a file first" });
      return;
    }

    setResumeUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await uploadResume(resumeFile);
      
      if (result.success) {
        setMessage({ 
          type: "success", 
          text: "Resume uploaded and parsed successfully! Profile fields updated." 
        });
        setResumeFile(null);
        
        // Update fields with parsed data
        if (result.parsedData) {
          if (result.parsedData.phone) setPhone(result.parsedData.phone);
          if (result.parsedData.github) setGithub(result.parsedData.github);
          if (result.parsedData.linkedin) setLinkedin(result.parsedData.linkedin);
          if (result.parsedData.experience) setExperience(result.parsedData.experience);
          if (result.parsedData.education) setEducation(result.parsedData.education);
          if (result.parsedData.skills) setSkills(result.parsedData.skills.join(", "));
        }
        
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to upload resume" });
      }
    } catch (error) {
      console.error("Failed to upload resume:", error);
      setMessage({ type: "error", text: "Failed to upload resume" });
    } finally {
      setResumeUploading(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!confirm("Are you sure you want to delete your resume?")) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await deleteResume();
      
      if (result.success) {
        setMessage({ type: "success", text: "Resume deleted successfully" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to delete resume" });
      }
    } catch (error) {
      console.error("Failed to delete resume:", error);
      setMessage({ type: "error", text: "Failed to delete resume" });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Apply theme change immediately
    if (newTheme !== currentTheme) {
      toggleTheme();
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      // Save preferences to localStorage
      localStorage.setItem("userPreferences", JSON.stringify({
        theme,
        language,
        notifications,
        dailyReminder,
      }));
      
      setMessage({ type: "success", text: "Preferences saved successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setMessage({ type: "error", text: "Failed to save preferences" });
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
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="settings-form">
              <h2>Profile Information</h2>
              
              <div className="profile-picture-section">
                <div className="profile-picture-preview">
                  {profilePicturePreview ? (
                    <img src={profilePicturePreview} alt="Profile" />
                  ) : (
                    <div className="profile-picture-placeholder">
                      {user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="profile-picture-controls">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    id="profile-picture-upload"
                    style={{ display: "none" }}
                  />
                  <label htmlFor="profile-picture-upload" className="upload-picture-btn">
                    📷 Choose Picture
                  </label>
                  {profilePicturePreview && (
                    <button
                      type="button"
                      onClick={handleProfilePictureRemove}
                      className="remove-picture-btn"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  )}
                  <p className="picture-hint">JPG, PNG or GIF (max 5MB)</p>
                </div>
              </div>
              
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  rows="4"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <small>{bio.length}/500 characters</small>
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>GitHub Profile</label>
                <input
                  type="url"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>

              <div className="form-group">
                <label>LinkedIn Profile</label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div className="form-group">
                <label>Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="JavaScript, React, Node.js, Python"
                />
              </div>

              <div className="form-group">
                <label>Experience</label>
                <textarea
                  rows="4"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Brief description of your work experience..."
                />
              </div>

              <div className="form-group">
                <label>Education</label>
                <textarea
                  rows="3"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="Your educational background..."
                />
              </div>

              <hr style={{ margin: "20px 0", border: "1px solid var(--border-color)" }} />

              <h3>Resume Upload</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "15px" }}>
                Upload your resume (PDF) to automatically populate profile fields
              </p>

              {user?.resumeUrl && (
                <div className="resume-status">
                  <span>✅ Resume uploaded on {new Date(user.resumeUploadedAt).toLocaleDateString()}</span>
                  <button 
                    type="button" 
                    onClick={handleResumeDelete}
                    className="delete-btn"
                    disabled={loading}
                  >
                    Delete Resume
                  </button>
                </div>
              )}

              <div className="resume-upload-section">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeChange}
                  id="resume-upload"
                  style={{ display: "none" }}
                />
                <label htmlFor="resume-upload" className="file-label">
                  {resumeFile ? resumeFile.name : "Choose PDF file"}
                </label>
                <button
                  type="button"
                  onClick={handleResumeUpload}
                  disabled={!resumeFile || resumeUploading}
                  className="upload-btn"
                >
                  {resumeUploading ? "Uploading..." : "Upload & Parse"}
                </button>
              </div>

              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </form>
          )}

          {activeTab === "preferences" && (
            <form onSubmit={handleSavePreferences} className="settings-form">
              <h2>Preferences</h2>
              <div className="form-group">
                <label>Theme</label>
                <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
                <small style={{ color: "var(--text-muted)", marginTop: "0.5rem", display: "block" }}>
                  Theme changes apply immediately
                </small>
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

