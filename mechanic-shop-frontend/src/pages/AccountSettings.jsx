/**
 * Account Settings Page
 * Allows users to manage their account settings including email changes
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AccountSettings = () => {
  const { user, customer, changeEmail, sendVerificationEmail, refreshUser } = useAuth();
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setError('Emails do not match');
      setLoading(false);
      return;
    }

    if (emailForm.newEmail === user.email) {
      setError('New email must be different from current email');
      setLoading(false);
      return;
    }

    const result = await changeEmail(emailForm.newEmail);

    if (result.success) {
      setMessage(result.message);
      setEmailForm({ newEmail: '', confirmEmail: '' });
      await refreshUser(); // Refresh user data
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleResendVerification = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    const result = await sendVerificationEmail();

    if (result.success) {
      setMessage(result.message);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8">
          Account Settings
        </h1>

        <div className="space-y-6">
          {/* Current Account Info */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              Account Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-gray-900">
                  {customer?.first_name} {customer?.last_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900">{user?.email}</p>
                  {user?.emailVerified ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <p className="text-gray-900">{customer?.phone || 'Not provided'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <p className="text-gray-900">{customer?.address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Email Verification */}
          {!user?.emailVerified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Email Verification Required
              </h3>
              <p className="text-yellow-700 mb-4">
                Your email address hasn't been verified yet. Please check your email for a verification link,
                or click below to resend the verification email.
              </p>
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>
            </div>
          )}

          {/* Change Email */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              Change Email Address
            </h2>

            <form onSubmit={handleEmailChange} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  New Email Address
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter new email address"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Email
                </label>
                <input
                  type="email"
                  id="confirmEmail"
                  value={emailForm.confirmEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, confirmEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm new email address"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Changing your email will require verification of the new address.
                  You'll receive a confirmation email at your current address and a verification email at the new address.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Change Email'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;