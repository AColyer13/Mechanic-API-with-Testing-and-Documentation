/**
 * Home Page - Fully Responsive
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="text-center animate-fade-in">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              🔧 Welcome to Mechanic Shop
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 md:mb-12 opacity-90 max-w-3xl mx-auto">
              Your trusted partner for vehicle maintenance and repairs
            </p>
            
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  to="/register" 
                  className="w-full sm:w-auto bg-white text-purple-600 px-8 py-3 md:px-10 md:py-4 rounded-full text-base md:text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto bg-transparent text-white border-2 border-white px-8 py-3 md:px-10 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300"
                >
                  Login
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  to="/dashboard" 
                  className="w-full sm:w-auto bg-white text-purple-600 px-8 py-3 md:px-10 md:py-4 rounded-full text-base md:text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300"
                >
                  Go to Dashboard
                </Link>
                <Link 
                  to="/create-ticket" 
                  className="w-full sm:w-auto bg-transparent text-white border-2 border-white px-8 py-3 md:px-10 md:py-4 rounded-full text-base md:text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300"
                >
                  Create Service Ticket
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12">
            Our Services
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl md:text-5xl mb-4 text-center">🔍</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 text-center">
                Easy Tracking
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-center">
                Track your service tickets in real-time and stay updated on repairs
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl md:text-5xl mb-4 text-center">👨‍🔧</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 text-center">
                Expert Mechanics
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-center">
                Our certified mechanics are dedicated to quality service
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl md:text-5xl mb-4 text-center">⚙️</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 text-center">
                Quality Parts
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-center">
                We use only genuine parts for all repairs and maintenance
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl md:text-5xl mb-4 text-center">⏱️</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 text-center">
                Fast Service
              </h3>
              <p className="text-gray-600 text-sm md:text-base text-center">
                Quick turnaround times without compromising on quality
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
