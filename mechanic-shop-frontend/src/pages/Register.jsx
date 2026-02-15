/**
 * Register Page
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerAPI } from '../services/api.service';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    state: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mergeRequired, setMergeRequired] = useState(false);
  const [mergeConfirmation, setMergeConfirmation] = useState(false);
  const [googleSignupData, setGoogleSignupData] = useState(null);
  const [mfaSent, setMfaSent] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState('');
  const [mfaError, setMfaError] = useState('');
  
  const { register, loginWithGoogle, mergeGoogleWithPassword, startPhoneEnrollment, finalizePhoneEnrollment, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setMergeRequired(false);
    setLoading(true);

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate phone is required for 2FA
    if (!formData.phone) {
      setError('Phone number is required for account verification');
      setLoading(false);
      return;
    }

    // Remove confirmPassword before sending to API
    const registerData = { ...formData };
    delete registerData.confirmPassword;

    const result = await register(registerData);
    
    if (result.success) {
      if (result.requiresEmailVerification) {
        // After email verification, user will need to complete phone verification
        setSuccessMessage('Registration successful! Please verify your email first, then complete phone verification.');
        // Auto-redirect to verify email after showing message
        setTimeout(() => navigate('/verify-email'), 2000);
      } else {
        // Start phone verification process
        setMfaError('');
        setMfaMessage('');
        setMfaLoading(true);
        try {
          const res = await startPhoneEnrollment(formData.phone);
          if (res.success) {
            setVerificationId(res.verificationId);
            setMfaSent(true);
            setMfaMessage('Verification code sent to your phone. Please enter it below.');
          } else {
            setMfaError(res.error || 'Failed to send verification code');
          }
        } catch (err) {
          setMfaError(err.message || 'Failed to send verification code');
        }
        setMfaLoading(false);
      }
    } else if (result.requiresProfileCompletion) {
      // If Google signed in but no Firestore profile exists, forward to Register to complete profile
      navigate('/register', { state: { googleData: result.googleData } });
    } else if (result.requiresAccountMerge) {
      setMergeRequired(true);
      setError(result.error);
      setMergeConfirmation(true); // Show confirmation
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setMergeRequired(false);
    setLoading(true);

    const result = await loginWithGoogle();
    
    if (result.success) {
      setSuccessMessage('Account created and signed in with Google! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } else if (result.requiresAccountMerge) {
      setMergeRequired(true);
      setError(result.error);
      setMergeConfirmation(true); // Show confirmation
    } else if (result.requiresProfileCompletion) {
      // Google signup - need to fill in password, phone, city, state
      setGoogleSignupData(result.googleData);
      setError('Please complete your profile to finish registration.');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  // If redirected from login after Google sign-in, prefill the googleSignupData
  useEffect(() => {
    if (location?.state?.googleData) {
      setGoogleSignupData(location.state.googleData);
    }
  }, [location]);

  const handleMergeWithPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    const result = await mergeGoogleWithPassword(formData.password);

    if (result.success) {
      setSuccessMessage('Accounts merged! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleCompleteGoogleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    // Validate required fields: phone, city, state
    if (!formData.phone || !formData.city || !formData.state) {
      setError('Please fill in phone, city, and state to complete registration');
      setLoading(false);
      return;
    }

    // Create profile data for the existing Google user (no password)
    const completeData = {
      first_name: googleSignupData.first_name,
      last_name: googleSignupData.last_name,
      email: googleSignupData.email,
      phone: formData.phone,
      city: formData.city,
      state: formData.state,
    };

    // Call createProfile (protected endpoint) to create Firestore profile for signed-in Google user
    const result = await customerAPI.createProfile(completeData);

    if (result && result.status === 201) {
      // Start phone verification for Google signup too
      setMfaError('');
      setMfaMessage('');
      setMfaLoading(true);
      try {
        const res = await startPhoneEnrollment(formData.phone);
        if (res.success) {
          setVerificationId(res.verificationId);
          setMfaSent(true);
          setMfaMessage('Verification code sent to your phone. Please enter it below.');
        } else {
          setMfaError(res.error || 'Failed to send verification code');
        }
      } catch (err) {
        setMfaError(err.message || 'Failed to send verification code');
      }
      setMfaLoading(false);
    } else {
      // Show backend error if present
      setError(result?.data?.error || result?.error || 'Failed to complete registration');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--register">
        <h2>Register</h2>
        
        {successMessage ? (
          <div className="success-message">{successMessage}</div>
        ) : googleSignupData ? (
          <>
            <form onSubmit={handleCompleteGoogleSignup}>
              <div className="error-message" style={{ marginBottom: '1rem' }}>
                Complete your profile to finish Google registration
              </div>

              <div className="form-group">
                <label htmlFor="display_first_name">First Name</label>
                <input
                  type="text"
                  id="display_first_name"
                  value={googleSignupData.first_name}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="display_last_name">Last Name</label>
                <input
                  type="text"
                  id="display_last_name"
                  value={googleSignupData.last_name}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="display_email">Email</label>
                <input
                  type="email"
                  id="display_email"
                  value={googleSignupData.email}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              {/* No password required for Google registration - only phone/city/state */}

              <div className="form-group">
                <label htmlFor="google_phone">Phone *</label>
                <input
                  type="tel"
                  id="google_phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row-three">
                <div className="form-group">
                  <label htmlFor="google_city">City *</label>
                  <input
                    type="text"
                    id="google_city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="google_state">State *</label>
                  <input
                    type="text"
                    id="google_state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    maxLength="2"
                    placeholder="e.g., CA"
                    required
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Completing Registration...' : 'Complete Registration'}
              </button>

              <button
                type="button"
                onClick={() => setGoogleSignupData(null)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  marginTop: '0.75rem',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </form>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              {mergeRequired && mergeConfirmation && (
                <div className="success-message" style={{ marginBottom: '1rem' }}>
                  We found an existing account with this email. Would you like to merge the accounts?
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setMergeConfirmation(false);
                        setMergeRequired(false);
                        setError('');
                      }}
                      disabled={loading}
                      className="btn-secondary"
                      style={{ marginRight: '0.5rem' }}
                    >
                      No, Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMergeConfirmation(false);
                        // Now show the password input for merge
                      }}
                      disabled={loading}
                      className="btn-primary"
                    >
                      Yes, Merge Accounts
                    </button>
                  </div>
                </div>
              )}
              {mergeRequired && !mergeConfirmation && (
                <div className="success-message">
                  We found an existing account with this email. Enter your password to merge the accounts.
                </div>
              )}
              {mergeRequired && !mergeConfirmation && (
                <button
                  type="button"
                  onClick={handleMergeWithPassword}
                  disabled={loading || !formData.password}
                  className="btn-primary"
                >
                  {loading ? 'Merging...' : 'Merge Accounts'}
                </button>
              )}
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
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
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row-three">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength="2"
                  placeholder="e.g., CA"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          {/* Phone Verification after Registration */}
          {mfaSent && (
            <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h3 style={{ marginBottom: '1rem', color: '#333' }}>Complete Phone Verification</h3>
              
              {mfaError && <div className="error-message">{mfaError}</div>}
              {mfaMessage && <div className="success-message">{mfaMessage}</div>}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMfaError('');
                  setMfaMessage('');
                  setMfaLoading(true);

                  try {
                    const res = await finalizePhoneEnrollment(verificationId, verificationCode, `${formData.first_name} ${formData.last_name}`);
                    if (res.success) {
                      setSuccessMessage('Registration and phone verification complete! Redirecting...');
                      setTimeout(() => navigate('/dashboard'), 1500);
                    } else {
                      setMfaError(res.error || 'Verification failed');
                    }
                  } catch (err) {
                    setMfaError(err.message || 'Verification failed');
                  }

                  setMfaLoading(false);
                }}
                style={{ marginTop: '1rem' }}
              >
                <div className="form-group">
                  <label htmlFor="verificationCode">Enter verification code</label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    required
                    style={{ marginBottom: '1rem' }}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={mfaLoading} style={{ marginRight: '0.5rem' }}>
                  {mfaLoading ? 'Verifying...' : 'Verify & Complete Registration'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaSent(false);
                    setVerificationId(null);
                    setVerificationCode('');
                    setMfaMessage('');
                    setMfaError('');
                  }}
                  disabled={mfaLoading}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          <div className="form-divider"></div>

          <button 
          onClick={handleGoogleRegister}
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
          {loading ? 'Signing in...' : 'Sign up with Google'}
          </button>
          </>
        )}

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
      <div id="recaptcha-container" />
    </div>
  );
};

export default Register;
