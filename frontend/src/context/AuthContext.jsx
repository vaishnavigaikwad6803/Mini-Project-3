import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('roadguard_token');
    const storedUser = localStorage.getItem('roadguard_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Refresh profile in background
      authService.getProfile()
        .then((profileData) => {
          setUser((prev) => ({ ...prev, ...profileData }));
          localStorage.setItem('roadguard_user', JSON.stringify({ ...JSON.parse(storedUser), ...profileData }));
        })
        .catch(() => {
          // If token invalid, logout
          authService.logout();
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.access_token);
    setUser(data);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setToken(data.access_token);
    setUser(data);
    return data;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setUser((prev) => ({ ...prev, ...profile }));
    } catch (err) {
      console.error("Failed to refresh profile", err);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    isCitizen: user?.role === 'CITIZEN',
    isAuthority: user?.role === 'AUTHORITY',
    isEngineer: user?.role === 'ENGINEER',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
