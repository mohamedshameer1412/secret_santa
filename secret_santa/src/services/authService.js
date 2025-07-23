import axios from 'axios';

// Configure axios defaults
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  ers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect for auth check requests
    const isAuthCheck = error.config.url.includes('/auth/me');
    
    if (error.response?.status === 401 && !isAuthCheck) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth service functions
const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to login' };
    }
  },

  // Register user
  register: async (fullName, email, password) => {
    try {
        // Map fullName to name for the backend
        const response = await api.post('/auth/register', { 
        name: fullName,  // This is the key fix!
        email, 
        password 
        });
        return response.data;
    } catch (error) {
        console.error("Registration error:", error);  // Add for debugging
        throw error.response?.data || { message: 'Failed to register' };
    }
  },

  // Logout user - call server to clear cookie
  logout: async () => {
    try {
      await api.get('/auth/logout');
      return true;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to logout' };
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      // Updated to match your backend route
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user profile' };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to process request' };
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify email' };
    }
  },
};

export default authService;