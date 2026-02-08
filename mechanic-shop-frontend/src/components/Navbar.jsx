/**
 * Navigation Bar Component - Fully Responsive
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, customer, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-white text-xl md:text-2xl font-bold hover:text-purple-200 transition-colors flex items-center gap-2"
            onClick={closeMobileMenu}
          >
            <span className="text-2xl">🔧</span>
            <span className="hidden sm:inline">Mechanic Shop</span>
            <span className="sm:hidden">MS</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
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
                <span className="text-purple-200 text-sm">
                  Welcome, {customer?.first_name}
                </span>
                <button 
                  onClick={handleLogout} 
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100 transition-colors"
                >
                  Logout
                </button>
              </>
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
                <div className="text-purple-200 text-sm pb-2 border-b border-purple-600">
                  Welcome, {customer?.first_name}
                </div>
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
                <button 
                  onClick={handleLogout} 
                  className="w-full bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100 transition-colors mt-2"
                >
                  Logout
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
