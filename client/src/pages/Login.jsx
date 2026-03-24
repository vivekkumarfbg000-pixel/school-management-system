import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, School, ArrowRight, Loader2, Activity } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const url = isSignup ? '/auth/signup' : '/auth/login';
    const cleanEmail = email.trim().toLowerCase();
    const payload = isSignup 
      ? { name, email: cleanEmail, password, schoolName } 
      : { email: cleanEmail, password };

    try {
      const { data } = await axios.post(url, payload);
      login(data.token, data.user);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-backdrop">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>
      
      <div className="login-card fade-in">
        <div className="login-header">
          <div className="brand-logo">
            <Sparkles size={32} color="white" />
          </div>
          <h1>EduStream</h1>
          <p>{isSignup ? 'Create your institutional hub' : 'Manage your school with AI'}</p>
        </div>
        
        {error && (
          <div className="error-alert">
            <Activity size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <>
              <div className="form-group">
                <label><User size={14} /> Your Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="John Doe"
                  required 
                />
              </div>
              <div className="form-group">
                <label><School size={14} /> School Name</label>
                <input 
                  type="text" 
                  value={schoolName} 
                  onChange={e => setSchoolName(e.target.value)} 
                  placeholder="Saint Paul Academy"
                  required 
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label><Mail size={14} /> Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="admin@school.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <label><Lock size={14} /> Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>{isSignup ? 'Create Account' : 'Sign In to Dashboard'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isSignup ? "Already have an account?" : "New to EduStream?"}
            <button onClick={() => setIsSignup(!isSignup)} className="toggle-auth-btn">
              {isSignup ? "Sign In" : "Get Started Now"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login;
