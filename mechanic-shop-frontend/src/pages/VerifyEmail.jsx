/**
 * Email Verification Page
 * Users must verify their email before accessing the app
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const VerifyEmail = () => {
  const { user, isEmailVerified, sendVerificationEmail, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Check if email is verified every 3 seconds
    const interval = setInterval(async () => {
      await refreshUser();
    }, 3000);

    return () => clearInterval(interval);
  }, [refreshUser]);

  useEffect(() => {
    // Cooldown timer for resend button
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const result = await sendVerificationEmail();

    if (result.success) {
      setMessage('Verification email sent! Check your inbox and spam folder.');
      setCooldown(60); // 60 second cooldown
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (isEmailVerified) {
    return null; // Redirect happens in ProtectedRoute
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h2>Verify Your Email</h2>
        </div>

        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
          We've sent a verification link to:
          <br />
          <strong>{user?.email}</strong>
        </p>

        <div style={{ backgroundColor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <p style={{ margin: '0', color: '#1565c0', fontSize: '14px', lineHeight: '1.5' }}>
            <strong>Next steps:</strong>
            <br />
            1. Check your email inbox
            <br />
            2. Click the verification link
            <br />
            3. Return here - you'll be automatically verified
          </p>
        </div>

        {message && (
          <div style={{
            backgroundColor: '#c8e6c9',
            border: '1px solid #81c784',
            color: '#2e7d32',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#ffcdd2',
            border: '1px solid #ef9a9a',
            color: '#c62828',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleResendEmail}
          disabled={loading || cooldown > 0}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: cooldown > 0 ? '#ccc' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {loading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
        </button>

        <p style={{ textAlign: 'center', color: '#999', marginTop: '16px', fontSize: '14px' }}>
          Didn't receive the email? Check your spam folder or try resending.
        </p>

        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffc107', 
          borderRadius: '4px', 
          padding: '12px',
          marginTop: '16px',
          fontSize: '13px',
          color: '#856404'
        }}>
          <strong>Tip:</strong> Sometimes emails take a few minutes to arrive. You'll be automatically verified once you click the link.
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;