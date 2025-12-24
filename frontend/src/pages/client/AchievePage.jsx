import { useState, useEffect } from "react";
import api from "../../utils/api";

const AchievePage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState({
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
  });
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedAchievements: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data } = await api.get("/achievements/user");
      setAchievements(data.data.achievements || []);
      setBadges(data.data.badges || { bronze: 0, silver: 0, gold: 0, platinum: 0 });
      setStats(data.data.stats || { totalAchievements: 0, unlockedAchievements: 0, completionRate: 0 });
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-content"><div className="loading">Loading achievements...</div></div>;
  }

  const badgeArray = [
    { name: "🥉 Bronze", count: badges.bronze, color: "#cd7f32" },
    { name: "🥈 Silver", count: badges.silver, color: "#c0c0c0" },
    { name: "🥇 Gold", count: badges.gold, color: "#ffd700" },
    { name: "💎 Platinum", count: badges.platinum, color: "#e5e4e2" },
  ].filter(badge => badge.count > 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>🏆 Achievements</h1>
        <p>Your milestones and accomplishments</p>
      </div>

      <div className="achievements-summary">
        <div className="summary-card">
          <div className="summary-icon">🏆</div>
          <div className="summary-info">
            <h3>Total Achievements</h3>
            <p className="summary-value">
              {stats.unlockedAchievements} / {stats.totalAchievements}
            </p>
          </div>
        </div>

        {badgeArray.map((badge, idx) => (
          <div key={idx} className="summary-card">
            <div className="summary-icon">{badge.name}</div>
            <div className="summary-info">
              <h3>Badges</h3>
              <p className="summary-value">{badge.count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="achievements-filter">
        <button
          className={selectedCategory === "all" ? "active" : ""}
          onClick={() => setSelectedCategory("all")}
        >
          All
        </button>
        <button
          className={selectedCategory === "unlocked" ? "active" : ""}
          onClick={() => setSelectedCategory("unlocked")}
        >
          Unlocked
        </button>
        <button
          className={selectedCategory === "locked" ? "active" : ""}
          onClick={() => setSelectedCategory("locked")}
        >
          Locked
        </button>
        <button
          className={selectedCategory === "Practice" ? "active" : ""}
          onClick={() => setSelectedCategory("Practice")}
        >
          📚 Practice
        </button>
        <button
          className={selectedCategory === "Progress" ? "active" : ""}
          onClick={() => setSelectedCategory("Progress")}
        >
          🚀 Progress
        </button>
      </div>

      <div className="achievements-grid">
        {achievements
          .filter((a) => {
            if (selectedCategory === "unlocked") return a.unlocked;
            if (selectedCategory === "locked") return !a.unlocked;
            if (selectedCategory === "all") return true;
            return a.category === selectedCategory;
          })
          .map((achievement) => (
            <div
              key={achievement.id}
              className={`achievement-card ${achievement.unlocked ? "unlocked" : "locked"}`}
            >
              <div className="achievement-icon">{achievement.icon}</div>
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
              {achievement.unlocked ? (
                <div className="achievement-date">
                  Unlocked on {new Date(achievement.date).toLocaleDateString()}
                </div>
              ) : achievement.progress !== undefined && achievement.target ? (
                <div className="achievement-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${achievement.progress}%`,
                      }}
                    ></div>
                  </div>
                  <span>
                    {achievement.current} / {achievement.target}
                  </span>
                </div>
              ) : (
                <div className="achievement-locked-status">🔒 Locked</div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default AchievePage;

