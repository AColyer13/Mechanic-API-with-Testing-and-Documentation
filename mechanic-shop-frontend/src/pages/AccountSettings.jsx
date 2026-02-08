/**
 * Account Settings Page
 * Allows users to manage their account settings including email changes
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerAPI } from '../services/api.service';

const AccountSettings = () => {
  const { user, customer, changeEmail, sendVerificationEmail, refreshUser, refreshCustomer } = useAuth();
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    state: ''
  });
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // Separate states for the Change Email form to avoid cross-form message/display loops
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailMessage('');
    setEmailLoading(true);

    if (emailForm.newEmail !== emailForm.confirmEmail) {
      setEmailError('Emails do not match');
      setEmailLoading(false);
      return;
    }

    if (emailForm.newEmail === user.email) {
      setEmailError('New email must be different from current email');
      setEmailLoading(false);
      return;
    }

    const result = await changeEmail(emailForm.newEmail);

    if (result.success) {
      setEmailMessage(result.message);
      setEmailForm({ newEmail: '', confirmEmail: '' });
      await refreshUser(); // Refresh user data
    } else {
      setEmailError(result.error);
    }

    setEmailLoading(false);
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

  useEffect(() => {
    if (customer) {
      setProfileForm({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
        city: customer.city || '',
        state: customer.state || ''
      });
    }
  }, [customer]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!customer?.id) {
      setError('No customer profile found');
      setLoading(false);
      return;
    }

    const updatePayload = {
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      phone: profileForm.phone,
      city: profileForm.city,
      state: profileForm.state
    };

    try {
      const response = await customerAPI.update(customer.id, updatePayload);
      setMessage('Profile updated successfully');
      // Refresh profile in context
      if (refreshCustomer) await refreshCustomer();
    } catch (err) {
      const backendError = err.response?.data?.error || 'Failed to update profile';
      setError(backendError);
    }

    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await customerAPI.delete(customer.id);
      // Account deleted successfully, logout user
      window.location.href = '/login'; // Redirect to login page
    } catch (err) {
      const backendError = err.response?.data?.error || 'Failed to delete account';
      setError(backendError);
      setShowDeleteDialog(false);
    }
    setDeleteLoading(false);
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
                <div className="flex items-center gap-2">
                  <p className="text-gray-900">{customer?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <p className="text-gray-900">
                  {customer?.city && customer?.state 
                    ? `${customer.city}, ${customer.state}` 
                    : customer?.city 
                      ? customer.city 
                      : customer?.state 
                        ? customer.state 
                        : 'Not provided'}
                </p>
              </div>
            </div>
          </div>


          {/* Edit Account Information */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              Edit Account Information
            </h2>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="(555) 555-5555"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="State"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
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
                {emailError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {emailError}
                  </div>
                )}

                {emailMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {emailMessage}
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
                disabled={emailLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
              >
                {emailLoading ? 'Updating...' : 'Change Email'}
              </button>
            </form>
          </div>

          {/* Delete Account */}
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 lg:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-red-800 mb-4">
              Delete Account
            </h2>

            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-700 mb-4">
                Once deleted, this action cannot be undone. All data, including service tickets and personal information,
                will be permanently removed from our servers.
              </p>

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Are you sure you want to delete your account?
            </h3>
            
            <p className="text-gray-600 mb-6">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="recaptcha-container" />
    </div>
  );
};

export default AccountSettings;