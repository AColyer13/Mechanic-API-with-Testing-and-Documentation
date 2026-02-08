/**
 * Login Page
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mergeRequired, setMergeRequired] = useState(false);
  const [mergeEmail, setMergeEmail] = useState('');
  const [mergePassword, setMergePassword] = useState('');
  
  const { login, loginWithGoogle, mergeGoogleWithPassword } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMergeRequired(false);
    setMergeEmail('');
    setMergePassword('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMergeRequired(false);
    setMergeEmail('');
    setMergePassword('');
    setLoading(true);

    const result = await loginWithGoogle();
    
    if (result.success) {
      navigate('/dashboard');
    } else if (result.requiresAccountMerge) {
      setMergeRequired(true);
      setMergeEmail(result.email || '');
      setError(result.error);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleMergeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await mergeGoogleWithPassword(mergePassword);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="divider" style={{ margin: '20px 0', textAlign: 'center', color: '#999' }}>
          <span style={{ backgroundColor: '#f9f9f9', padding: '0 10px' }}>or</span>
        </div>
        <div style={{ position: 'relative', borderTop: '1px solid #e0e0e0', margin: '20px 0' }}></div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-google"
          style={{
            width: '100%',
            padding: '10px 16px',
            marginTop: '16px',
            backgroundColor: '#ffffff',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f5f5f5';
            e.target.style.borderColor = '#999';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ffffff';
            e.target.style.borderColor = '#ddd';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        {mergeRequired && (
          <form onSubmit={handleMergeSubmit} style={{ marginTop: '16px' }}>
            <div className="success-message">
              We found an existing password account for {mergeEmail || 'this email'}. Enter your password to merge.
            </div>
            <div className="form-group">
              <label htmlFor="mergePassword">Password</label>
              <input
                type="password"
                id="mergePassword"
                name="mergePassword"
                value={mergePassword}
                onChange={(e) => setMergePassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Merging...' : 'Merge Accounts'}
            </button>
          </form>
        )}

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
        <p className="auth-link">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
