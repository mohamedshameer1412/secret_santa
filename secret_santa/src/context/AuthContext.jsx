import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const response = await authService.getCurrentUser();
        setUser(response.data);
      } catch {
        console.log('User not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  // Auth methods
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

// Add these new functions
const forgotPassword = async (email) => {
  try {
    setError(null);
    const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
      method: 'POST',
      ers: {
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
    const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
      method: 'POST',
      ers: {
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