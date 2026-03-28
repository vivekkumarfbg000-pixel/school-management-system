import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, School, ArrowRight, Loader2, Activity, Eye, EyeOff, Shield, Zap, BarChart3, Users } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password || !isSignup) return null;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 1) return { label: 'Weak', color: 'var(--danger)', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: 'var(--warning)', width: '40%' };
    if (score <= 3) return { label: 'Good', color: 'var(--info)', width: '65%' };
    if (score <= 4) return { label: 'Strong', color: 'var(--success)', width: '85%' };
    return { label: 'Excellent', color: 'var(--accent)', width: '100%' };
  }, [password, isSignup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const url = isSignup ? '/auth/signup' : '/auth/login';
    const cleanEmail = email.trim().toLowerCase();
    const payload = isSignup 
      ? { name: name.trim(), email: cleanEmail, password, schoolName: schoolName.trim() } 
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
  };

  const features = [
    { icon: <Shield size={18} />, title: 'Secure & Compliant', desc: 'Bank-grade encryption' },
    { icon: <Zap size={18} />, title: 'AI-Powered Insights', desc: 'Smart predictions' },
    { icon: <BarChart3 size={18} />, title: 'Real-time Analytics', desc: 'Live dashboards' },
    { icon: <Users size={18} />, title: 'Multi-tenant SaaS', desc: 'Unlimited schools' },
  ];

  return (
    <div className="login-page">
      <div className="login-backdrop">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>
        <div className="login-grid-pattern"></div>
      </div>
      
      <div className="login-container">
        {/* Left Panel — Branding */}
        <div className="login-branding fade-in">
          <div className="branding-content">
            <div className="brand-logo">
              <Sparkles size={28} color="white" />
            </div>
            <h2>EduStream</h2>
            <p className="tagline">The complete school operating system — powered by AI</p>
            
            <div className="features-grid">
              {features.map((f, i) => (
                <div key={i} className={`feature-item fade-in fade-in-d${i+1}`}>
                  <div className="feature-icon">{f.icon}</div>
                  <div>
                    <div className="feature-title">{f.title}</div>
                    <div className="feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="trusted-badge">
              <span>Trusted by 500+ institutions across India</span>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="login-card fade-in">
          <div className="login-header">
            <h1>{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
            <p>{isSignup ? 'Set up your institutional hub in 30 seconds' : 'Sign in to manage your school with AI'}</p>
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
                  <label><User size={14} /> Full Name</label>
                  <input 
                    id="signup-name"
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="John Doe"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label><School size={14} /> Institution Name</label>
                  <input 
                    id="signup-school"
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
                id="login-email"
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="admin@school.com"
                required 
                autoComplete="email"
              />
            </div>
            
            <div className="form-group">
              <label><Lock size={14} /> Password</label>
              <div className="password-input-wrapper">
                <input 
                  id="login-password"
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {isSignup && password.length > 0 && passwordStrength && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ width: passwordStrength.width, background: passwordStrength.color }}
                    />
                  </div>
                  <span className="strength-label" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
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

          <div className="login-divider">
            <span>or</span>
          </div>

          <div className="login-footer">
            <p>
              {isSignup ? "Already have an account?" : "New to EduStream?"}
              <button onClick={() => { setIsSignup(!isSignup); setError(''); }} className="toggle-auth-btn">
                {isSignup ? "Sign In" : "Get Started Free"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
