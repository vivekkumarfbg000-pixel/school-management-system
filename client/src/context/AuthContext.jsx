import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Dynamic API Base URL Configuration
const API_BASE_URL = '/server-api';
console.log('🌐 EduStream API Connection:', API_BASE_URL);
axios.defaults.baseURL = API_BASE_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState('mock-token-for-dev');
  const [user, setUser] = useState({
    id: 'mock-admin-id',
    name: 'Demo Admin',
    email: 'admin@edustream.demo',
    role: 'ADMIN',
    school: 'EduStream Academy'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip real token verification for now
    axios.defaults.headers.common['Authorization'] = `Bearer mock-token-for-dev`;
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    toast.success(`Welcome back, ${newUser.name.split(' ')[0]}!`);
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
