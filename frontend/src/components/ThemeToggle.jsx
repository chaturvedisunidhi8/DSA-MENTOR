import { useTheme } from "../context/ThemeContext";
import "../styles/ThemeToggle.css";
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <span className="theme-icon">🌙</span>
      ) : (
        <span className="theme-icon">☀️</span>
      )}
    </button>
  );
};
export default ThemeToggle;
