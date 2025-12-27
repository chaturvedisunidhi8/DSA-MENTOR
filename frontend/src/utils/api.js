import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired, try to refresh
    if (error.response?.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Access token expired, refreshing...");
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = data.data;
        localStorage.setItem("accessToken", accessToken);
        
        isRefreshing = false;
        processQueue(null, accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Profile API functions
export const profileAPI = {
  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  },

  // Upload resume
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await api.post("/auth/profile/resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete resume
  deleteResume: async () => {
    const response = await api.delete("/auth/profile/resume");
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append("profilePicture", file);

    const response = await api.post("/auth/profile/picture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Delete profile picture
  deleteProfilePicture: async () => {
    const response = await api.delete("/auth/profile/picture");
    return response.data;
  },

  // Get profile
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};

// Discussion API functions
export const discussionAPI = {
  // Get discussions for a problem
  getDiscussionsByProblem: async (problemId, params = {}) => {
    const response = await api.get(`/discussions/problem/${problemId}`, { params });
    return response.data;
  },

  // Get single discussion
  getDiscussion: async (discussionId) => {
    const response = await api.get(`/discussions/${discussionId}`);
    return response.data;
  },

  // Create discussion
  createDiscussion: async (data) => {
    const response = await api.post('/discussions', data);
    return response.data;
  },

  // Update discussion
  updateDiscussion: async (discussionId, data) => {
    const response = await api.put(`/discussions/${discussionId}`, data);
    return response.data;
  },

  // Delete discussion
  deleteDiscussion: async (discussionId) => {
    const response = await api.delete(`/discussions/${discussionId}`);
    return response.data;
  },

  // Vote on discussion
  voteDiscussion: async (discussionId, voteType) => {
    const response = await api.post(`/discussions/${discussionId}/vote`, { voteType });
    return response.data;
  },

  // Vote on reply
  voteReply: async (discussionId, replyId, voteType) => {
    const response = await api.post(`/discussions/${discussionId}/replies/${replyId}/vote`, { voteType });
    return response.data;
  },

  // Add reply
  addReply: async (discussionId, content) => {
    const response = await api.post(`/discussions/${discussionId}/replies`, { content });
    return response.data;
  },

  // Update reply
  updateReply: async (discussionId, replyId, content) => {
    const response = await api.put(`/discussions/${discussionId}/replies/${replyId}`, { content });
    return response.data;
  },

  // Delete reply
  deleteReply: async (discussionId, replyId) => {
    const response = await api.delete(`/discussions/${discussionId}/replies/${replyId}`);
    return response.data;
  },

  // Mark solution as accepted
  markAsAccepted: async (discussionId) => {
    const response = await api.post(`/discussions/${discussionId}/accept`);
    return response.data;
  },

  // Flag discussion
  flagDiscussion: async (discussionId, reason) => {
    const response = await api.post(`/discussions/${discussionId}/flag`, { reason });
    return response.data;
  },
};

// Social/Community API functions
export const socialAPI = {
  // Get user profile
  getUserProfile: async (username) => {
    const response = await api.get(`/social/profile/${username}`);
    return response.data;
  },

  // Follow user
  followUser: async (userId) => {
    const response = await api.post(`/social/follow/${userId}`);
    return response.data;
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    const response = await api.delete(`/social/follow/${userId}`);
    return response.data;
  },

  // Get followers list
  getFollowers: async (userId, page = 1, limit = 20) => {
    const response = await api.get(`/social/followers/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get following list
  getFollowing: async (userId, page = 1, limit = 20) => {
    const response = await api.get(`/social/following/${userId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get activity feed
  getActivityFeed: async (page = 1, limit = 20) => {
    const response = await api.get('/social/feed', {
      params: { page, limit }
    });
    return response.data;
  },

  // Search users
  searchUsers: async (query, page = 1, limit = 20) => {
    const response = await api.get('/social/search', {
      params: { query, page, limit }
    });
    return response.data;
  },

  // Get suggested users to follow
  getSuggestedUsers: async (limit = 10) => {
    const response = await api.get('/social/suggestions', {
      params: { limit }
    });
    return response.data;
  },
};

export default api;
