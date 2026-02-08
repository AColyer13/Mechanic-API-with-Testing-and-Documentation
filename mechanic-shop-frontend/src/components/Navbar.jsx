/**
 * Navigation Bar Component - Fully Responsive with Dropdown Menu
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, customer, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left Side: Logo */}
          <Link 
            to="/" 
            className="text-white text-xl md:text-2xl font-bold hover:text-purple-200 transition-colors flex items-center gap-2"
            onClick={closeMobileMenu}
          >
            <span className="text-2xl">🚗</span>
            <span className="hidden sm:inline">VF Tires</span>
            <span className="sm:hidden">VFT</span>
          </Link>
          
          {/* CENTER: Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-white hover:text-purple-200 transition-colors font-medium">
                  Dashboard
                </Link>
                <Link to="/tickets" className="text-white hover:text-purple-200 transition-colors font-medium">
                  My Tickets
                </Link>
                <Link to="/create-ticket" className="text-white hover:text-purple-200 transition-colors font-medium">
                  New Ticket
                </Link>
              </>
            ) : null}
          </div>

          {/* Right Side: Auth / User Avatar with Dropdown */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                {/* Avatar Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-purple-600 font-bold text-lg hover:bg-purple-100 transition-colors cursor-pointer"
                  title={`${customer?.first_name} ${customer?.last_name}`}
                >
                  {customer?.first_name?.charAt(0).toUpperCase() || 'U'}
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-purple-100 py-2 z-50">
                    {/* User Name Display */}
                    <div className="px-4 py-2 border-b border-purple-100">
                      <p className="text-sm font-semibold text-gray-800">
                        {customer?.first_name} {customer?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{customer?.email}</p>
                    </div>

                    {/* Account Settings */}
                    <Link
                      to="/account-settings"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors text-sm font-medium"
                    >
                      ⚙️ Account Settings
                    </Link>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50 transition-colors text-sm font-medium"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-purple-200 transition-colors font-medium">
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-purple-700 border-t border-purple-600">
          <div className="px-4 py-3 space-y-3">
            {isAuthenticated ? (
              <>
                {/* User Profile Section */}
                <div className="bg-purple-600 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-purple-600 font-bold text-lg">
                      {customer?.first_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{customer?.first_name} {customer?.last_name}</p>
                      <p className="text-purple-200 text-xs">{customer?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <Link 
                  to="/dashboard" 
                  className="block text-white hover:text-purple-200 transition-colors font-medium py-2"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/tickets" 
                  className="block text-white hover:text-purple-200 transition-colors font-medium py-2"
                  onClick={closeMobileMenu}
                >
                  My Tickets
                </Link>
                <Link 
                  to="/create-ticket" 
                  className="block text-white hover:text-purple-200 transition-colors font-medium py-2"
                  onClick={closeMobileMenu}
                >
                  New Ticket
                </Link>

                {/* Divider */}
                <div className="border-t border-purple-600 my-2"></div>

                {/* Account Settings */}
                <Link 
                  to="/account-settings" 
                  className="block text-white hover:text-purple-200 transition-colors font-medium py-2"
                  onClick={closeMobileMenu}
                >
                  ⚙️ Account Settings
                </Link>

                {/* Logout */}
                <button 
                  onClick={handleLogout} 
                  className="w-full bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100 transition-colors"
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block text-white hover:text-purple-200 transition-colors font-medium py-2"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block w-full bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100 transition-colors text-center"
                  onClick={closeMobileMenu}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
