import { createContext, useState, useEffect } from "react";
import api, { profileAPI } from "../utils/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);

          // Verify token is still valid by fetching profile
          const { data } = await api.get("/auth/profile");
          setUser(data.data.user);
          localStorage.setItem("user", JSON.stringify(data.data.user));
        } catch (error) {
          console.error("Auth initialization error:", error);
          // Token invalid, clear storage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });

      const { accessToken, user } = data.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);

      return { success: true, user };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Login failed. Please try again.",
      };
    }
  };

  const signup = async (username, email, password) => {
    try {
      const { data } = await api.post("/auth/register", {
        username,
        email,
        password,
      });

      const { accessToken, user } = data.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);

      return { success: true, user };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Signup failed. Please try again.",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await profileAPI.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        return { success: true, user: response.user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  };

  const uploadResume = async (file) => {
    try {
      const response = await profileAPI.uploadResume(file);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        return { 
          success: true, 
          user: response.user,
          parsedData: response.parsedData 
        };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error("Upload resume error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to upload resume",
      };
    }
  };

  const deleteResume = async () => {
    try {
      const response = await profileAPI.deleteResume();
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        return { success: true, user: response.user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error("Delete resume error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete resume",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        updateProfile,
        uploadResume,
        deleteResume,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
