import React from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container" style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'white',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px' }}>
            <div style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>
              <AlertTriangle size={64} />
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              The application encountered an unexpected error. We've been notified and are looking into it.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <RefreshCcw size={18} /> Retry
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="btn-glass"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Home size={18} /> Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre style={{ 
                marginTop: '2rem', 
                padding: '1rem', 
                background: 'rgba(0,0,0,0.3)', 
                borderRadius: '8px', 
                fontSize: '0.8rem', 
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '200px',
                color: 'var(--danger)'
              }}>
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
