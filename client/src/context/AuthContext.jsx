import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Dynamic API Base URL Configuration
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  
  // If the env URL matches the current origin, use relative path to avoid CORS entirely
  try {
    const url = new URL(envUrl);
    if (url.origin === window.location.origin) {
      return '/api';
    }
    return envUrl;
  } catch (e) {
    return envUrl; // Fallback if not a valid URL (e.g. just a path)
  }
};

const API_BASE_URL = getApiBaseUrl();
console.log(`🌐 EduStream API (${API_BASE_URL.startsWith('http') ? 'Cross-Origin' : 'Relative'}):`, API_BASE_URL);
axios.defaults.baseURL = API_BASE_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    const firstName = newUser?.name ? newUser.name.split(' ')[0] : 'User';
    toast.success(`Welcome back, ${firstName}!`);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
