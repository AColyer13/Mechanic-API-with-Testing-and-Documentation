/**
 * Home Page
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>🔧 Welcome to Mechanic Shop</h1>
        <p className="hero-subtitle">
          Your trusted partner for vehicle maintenance and repairs
        </p>
        
        {!isAuthenticated ? (
          <div className="cta-buttons">
            <Link to="/register" className="btn-hero primary">
              Get Started
            </Link>
            <Link to="/login" className="btn-hero secondary">
              Login
            </Link>
          </div>
        ) : (
          <div className="cta-buttons">
            <Link to="/dashboard" className="btn-hero primary">
              Go to Dashboard
            </Link>
            <Link to="/create-ticket" className="btn-hero secondary">
              Create Service Ticket
            </Link>
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>Our Services</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Easy Tracking</h3>
            <p>Track your service tickets in real-time and stay updated on repairs</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🔧</div>
            <h3>Expert Mechanics</h3>
            <p>Our certified mechanics are dedicated to quality service</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Quality Parts</h3>
            <p>We use only genuine parts for all repairs and maintenance</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Fast Service</h3>
            <p>Quick turnaround times without compromising on quality</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
