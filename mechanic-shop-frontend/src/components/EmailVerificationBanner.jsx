/**
 * Email Verification Banner
 * Shows when user is logged in but hasn't verified their email
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const EmailVerificationBanner = () => {
  const { user, isEmailVerified, sendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Don't show if user is verified or not logged in
  if (!user || isEmailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    const result = await sendVerificationEmail();

    if (result.success) {
      setMessage('Verification email sent! Please check your inbox.');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm">
              <strong>Email not verified:</strong> Please check your email and click the verification link to secure your account.
            </p>
            {message && <p className="text-sm mt-1 text-green-600">{message}</p>}
            {error && <p className="text-sm mt-1 text-red-600">{error}</p>}
          </div>
        </div>
        <div className="ml-4">
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;