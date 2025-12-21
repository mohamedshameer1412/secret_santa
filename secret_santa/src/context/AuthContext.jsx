import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Function to get a random avatar
const getRandomAvatar = async () => {
  try {
    const response = await fetch('/avatars/avatars.json');
    const avatars = await response.json();
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex].path;
  } catch (error) {
    console.error('Error loading avatars:', error);
    return '/assets/santa-show.png'; // fallback
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkUserLoggedIn = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                // No token, skip the API call
                setLoading(false);
                return;
            }
            
            const response = await authService.getCurrentUser();
            const userData = response.data.user ?? response.data;
            
            // Assign a random avatar for this session
            const randomAvatar = await getRandomAvatar();
            setUser({ ...userData, profilePic: randomAvatar });

            setError(null);
        } catch (error) {
            if (error.response?.status !== 401) {
                console.error('Auth check error:', error);
            }
            localStorage.removeItem('token'); // Clear invalid token
        } finally { 
            setLoading(false);
        }
    };

    checkUserLoggedIn();
  }, []);

  // Auth methods
  const login = async (email, password) => {
    try {
        setError(null);

        const data = await authService.login(email, password);

        if (data.token) {
            localStorage.setItem('token', data.token);
        }
        
        // Assign a random avatar for this session
        const randomAvatar = await getRandomAvatar();
        setUser({ ...data.user, profilePic: randomAvatar });
        
        return data;
    } catch (err) {
        setError(err.message);
        throw err;
    }
  };

  const logout = async () => {
    try {
        await authService.logout();
    } catch (err) {
        setError(err.message);
        throw err;
    } finally {
        localStorage.removeItem('token');
        setUser(null);
    }
  };

// Add these new functions
const forgotPassword = async (email) => {
  try {
    setError(null);
    const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reset email');
    }
    
    return data;
  } catch (err) {
    setError(err.message);
    throw err;
  }
};

const resetPassword = async (token, password) => {
  try {
    setError(null);
    const response = await fetch(`${API_BASE}/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }
    
    return data;
  } catch (err) {
    setError(err.message);
    throw err;
  }
};

return (
  <AuthContext.Provider 
    value={{ 
      user, 
      loading, 
      error,
      isAuthenticated: !!user, 
      login, 
      logout,
      forgotPassword,
      resetPassword
    }}
  >
    {children}
  </AuthContext.Provider>
);
};
export default AuthContext;