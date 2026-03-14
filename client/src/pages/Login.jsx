import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setAuth }) => {
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
    
    const url = isSignup ? '/api/auth/signup' : '/api/auth/login';
    const payload = isSignup 
      ? { name, email, password, schoolName } 
      : { email, password };

    try {
      const { data } = await axios.post(url, payload);
      setAuth(data.token, data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-gradient)' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="brand-icon" style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 auto 1rem auto', width: 'fit-content' }}>🎓</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>EduStream SaaS</h2>
          <p className="subtitle" style={{ marginTop: '0.5rem' }}>{isSignup ? 'Create your school hub' : 'Secure School Management'}</p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Your Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  style={{ width: '100%', padding: '0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} 
                  placeholder="e.g. John Doe"
                  required 
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>School Name</label>
                <input 
                  type="text" 
                  value={schoolName} 
                  onChange={e => setSchoolName(e.target.value)} 
                  style={{ width: '100%', padding: '0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} 
                  placeholder="e.g. Saint Paul Academy"
                  required 
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} 
              placeholder="admin@school.com"
              required 
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }} 
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.875rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Access Dashboard'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {isSignup ? "Already have an account?" : "New to EduStream?"}
            <span 
              onClick={() => setIsSignup(!isSignup)} 
              style={{ color: 'var(--primary-light)', fontWeight: 600, marginLeft: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isSignup ? "Sign In" : "Sign Up Now"}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login;
