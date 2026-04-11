import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Dynamic API Base URL Configuration
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  
  try {
    const url = new URL(envUrl);
    if (url.origin === window.location.origin) {
      return '/api';
    }
    return envUrl;
  } catch (e) {
    return envUrl;
  }
};

const API_BASE_URL = getApiBaseUrl();
const finalBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
console.log(`🌐 EduStream API (${finalBaseUrl.startsWith('http') ? 'Cross-Origin' : 'Relative'}):`, finalBaseUrl);
axios.defaults.baseURL = finalBaseUrl;

// ── JWT Helpers ──
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;
  // Add 10 second buffer
  return Date.now() >= (payload.exp * 1000) - 10000;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('token');
    // Auto-clear expired tokens on load
    if (saved && isTokenExpired(saved)) {
      console.log('[Auth] Token expired on load, clearing...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    return saved || null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const logout = useCallback((message) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    if (message) {
      toast.error(message, { duration: 4000 });
    } else {
      toast.success('Logged out successfully');
    }
  }, []);

  // Set up auth header & 401 interceptor
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  // ── Axios 401 Interceptor (auto-logout on expired token) ──
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          const code = error.response?.data?.code;
          if (code === 'TOKEN_EXPIRED') {
            logout('Session expired. Please login again.');
          } else if (code === 'TOKEN_INVALID' || code === 'NO_TOKEN') {
            logout('Authentication failed. Please login again.');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token, logout]);

  // ── Check token expiry on window focus ──
  useEffect(() => {
    const handleFocus = () => {
      if (token && isTokenExpired(token)) {
        logout('Session expired. Please login again.');
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, logout]);

  const checkServer = async () => {
    try {
      await axios.get('health'); // Targets /api/health due to baseURL
      return true;
    } catch {
      return false;
    }
  };

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    const firstName = newUser?.name ? newUser.name.split(' ')[0] : 'User';
    toast.success(`Welcome back, ${firstName}!`);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, checkServer, loading, isAuthenticated: !!token }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
