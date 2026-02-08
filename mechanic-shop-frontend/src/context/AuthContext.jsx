/**
 * Authentication Context
 * Manages user authentication state using Firebase Authentication
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateEmail,
  reload,
  signInWithPopup,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { customerAPI } from '../services/api.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [user, setUser] = useState(null); // Firebase user
  const [loading, setLoading] = useState(true);
  const [pendingLink, setPendingLink] = useState(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, load customer profile from Firestore
        try {
          const response = await customerAPI.getById(firebaseUser.uid);
          // Add the ID (Firebase UID) to the customer object
          const customerData = {
            ...response.data,
            id: firebaseUser.uid
          };
          setCustomer(customerData);
        } catch (error) {
          console.error('Error loading customer profile:', error);
          // Set customer with at least the ID even if profile fetch fails
          setCustomer({ id: firebaseUser.uid });
        }
      } else {
        // User is signed out
        setCustomer(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('google.com')) {
            return {
              success: false,
              error: 'This email is linked to Google. Please sign in with Google to continue.'
            };
          }
        } catch (methodError) {
          console.warn('Error checking sign-in methods:', methodError);
        }
      }

      const errorMessage = error.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : error.code === 'auth/user-not-found'
        ? 'No account found with this email'
        : error.code === 'auth/wrong-password'
        ? 'Incorrect password'
        : 'Login failed';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Check if customer profile exists in Firestore (for this Google account)
      try {
        await customerAPI.getById(firebaseUser.uid);
        // Profile exists, login successful
        return { success: true };
      } catch (error) {
        // Profile doesn't exist - need to ask user to complete it
        // Sign them out for now and ask them to complete registration
        await signOut(auth);
        
        const googleData = {
          first_name: firebaseUser.displayName?.split(' ')[0] || 'User',
          last_name: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          email: firebaseUser.email,
        };
        
        return {
          success: false,
          requiresProfileCompletion: true,
          googleData,
          error: 'Please complete your profile to finish registration.'
        };
      }
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const pendingCredential = GoogleAuthProvider.credentialFromError(error);
        const email = error.customData?.email;

        if (email && pendingCredential) {
          setPendingLink({ email, credential: pendingCredential });
          return {
            success: false,
            requiresAccountMerge: true,
            email,
            error: 'An account with this email already exists. Enter your password to merge the accounts.'
          };
        }
      }

      const errorMessage = error.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled'
        : error.code === 'auth/popup-blocked'
        ? 'Sign-in popup was blocked. Please allow popups for this site.'
        : 'Google sign-in failed';
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const mergeGoogleWithPassword = async (password) => {
    if (!pendingLink?.email || !pendingLink?.credential) {
      return { success: false, error: 'No merge request is pending' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, pendingLink.email, password);
      await linkWithCredential(userCredential.user, pendingLink.credential);
      setPendingLink(null);
      return { success: true };
    } catch (error) {
      const errorMessage = error.code === 'auth/wrong-password'
        ? 'Incorrect password'
        : error.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please try again later.'
        : 'Account merge failed';

      return { success: false, error: errorMessage };
    }
  };

  const linkPasswordToGoogle = async (email, password) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (firebaseUser?.email !== email) {
        await signOut(auth);
        return { success: false, error: 'Google account email does not match the email you entered.' };
      }

      const emailCredential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(firebaseUser, emailCredential);
      return { success: true };
    } catch (error) {
      const errorMessage = error.code === 'auth/credential-already-in-use'
        ? 'These credentials are already linked to another account'
        : error.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled'
        : error.code === 'auth/popup-blocked'
        ? 'Sign-in popup was blocked. Please allow popups for this site.'
        : 'Failed to link Google account';

      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      // Register user via backend (which creates Firebase Auth user + Firestore profile)
      await customerAPI.register(userData);
      
      // Auto-login after registration
      const loginResult = await login(userData.email, userData.password);
      
      if (loginResult.success) {
        // Send email verification after successful login
        const verificationResult = await sendVerificationEmail();
        if (verificationResult.success) {
          return { 
            success: true, 
            message: 'Registration successful! Please check your email to verify your account.',
            requiresEmailVerification: true 
          };
        }
      }
      
      return loginResult;
    } catch (error) {
      const backendError = error.response?.data?.error || error.response?.data?.errors?.[0];

      if (backendError === 'Email already exists') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, userData.email);
          if (methods.includes('google.com')) {
            return {
              success: false,
              requiresGoogleLink: true,
              email: userData.email,
              error: 'This email is already linked to Google. Link your Google account to finish.'
            };
          }
        } catch (methodError) {
          console.warn('Error checking sign-in methods:', methodError);
        }

        return {
          success: false,
          error: 'An account with this email already exists. Please log in.'
        };
      }

      return {
        success: false,
        error: backendError || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCustomer(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        return { success: true, message: 'Verification email sent successfully' };
      }
      return { success: false, error: 'User not found or already verified' };
    } catch (error) {
      return {
        success: false,
        error: error.code === 'auth/too-many-requests' 
          ? 'Too many requests. Please try again later.'
          : 'Failed to send verification email'
      };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      const errorMessage = error.code === 'auth/user-not-found'
        ? 'No account found with this email address'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : 'Failed to send password reset email';
      
      return { success: false, error: errorMessage };
    }
  };

  const changeEmail = async (newEmail) => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      await updateEmail(user, newEmail);
      await reload(user); // Refresh user data
      
      return { success: true, message: 'Email updated successfully. Please check your new email for verification.' };
    } catch (error) {
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'This email is already in use'
        : error.code === 'auth/invalid-email'
        ? 'Invalid email address'
        : error.code === 'auth/requires-recent-login'
        ? 'Please re-authenticate and try again'
        : 'Failed to update email';
      
      return { success: false, error: errorMessage };
    }
  };

  const refreshUser = async () => {
    try {
      if (user) {
        await reload(user);
        // Force re-render by updating state
        setUser({ ...user });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    customer,
    user,
    loading,
    login,
    loginWithGoogle,
    mergeGoogleWithPassword,
    linkPasswordToGoogle,
    register,
    logout,
    sendVerificationEmail,
    resetPassword,
    changeEmail,
    refreshUser,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
