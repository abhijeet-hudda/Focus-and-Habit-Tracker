import axios from 'axios';

// 1. Double check this matches your backend port and version
const API_URL = import.meta.env.VITE_API_URL || 'https://focus-and-habit-tracker.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 2. Only try to refresh if it's a 401 error and we haven't tried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(`${API_URL}/users/refresh-token`, {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        // --- CRITICAL FIX ---
        // DO NOT use window.location.href = '/login' here.
        // It causes the page to reload and restart the loop.
        // Just reject the promise. The UI will handle showing the login screen.
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;