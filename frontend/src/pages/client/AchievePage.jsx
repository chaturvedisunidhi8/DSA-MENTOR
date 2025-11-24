import { useState } from "react";

const AchievePage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const achievements = [
    {
      id: 1,
      icon: "🎯",
      title: "First Blood",
      description: "Solve your first problem",
      unlocked: true,
      date: "2024-01-15",
    },
    {
      id: 2,
      icon: "🔥",
      title: "Week Warrior",
      description: "Maintain a 7-day streak",
      unlocked: true,
      date: "2024-02-20",
    },
    {
      id: 3,
      icon: "💯",
      title: "Century Club",
      description: "Solve 100 problems",
      unlocked: true,
      date: "2024-10-05",
    },
    {
      id: 4,
      icon: "🌟",
      title: "Problem Master",
      description: "Solve 500 problems",
      unlocked: false,
      progress: 145,
      total: 500,
    },
    {
      id: 5,
      icon: "⚡",
      title: "Speed Demon",
      description: "Solve a problem in under 5 minutes",
      unlocked: true,
      date: "2024-03-12",
    },
    {
      id: 6,
      icon: "🎓",
      title: "DP Expert",
      description: "Master Dynamic Programming (90%+ accuracy)",
      unlocked: false,
      progress: 54,
      total: 90,
    },
  ];

  const badges = [
    { name: "🥉 Bronze", count: 12, color: "#cd7f32" },
    { name: "🥈 Silver", count: 8, color: "#c0c0c0" },
    { name: "🥇 Gold", count: 3, color: "#ffd700" },
  ];

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
              {achievements.filter((a) => a.unlocked).length} / {achievements.length}
            </p>
          </div>
        </div>

        {badges.map((badge, idx) => (
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
      </div>

      <div className="achievements-grid">
        {achievements
          .filter((a) => {
            if (selectedCategory === "unlocked") return a.unlocked;
            if (selectedCategory === "locked") return !a.unlocked;
            return true;
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
              ) : (
                <div className="achievement-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(achievement.progress / achievement.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span>
                    {achievement.progress} / {achievement.total}
                  </span>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default AchievePage;

