import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tokenExpiryTime, setTokenExpiryTime] = useState(null);
  
  useEffect(() => {
    // Function to update token expiry time
    const updateTokenExpiryTime = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setTokenExpiryTime(null);
        return;
      }
      
      try {
        // Decode token to get expiry time
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        
        if (decodedPayload.exp) {
          const expiryDate = new Date(decodedPayload.exp * 1000);
          const now = new Date();
          
          // Calculate time remaining
          const timeRemaining = expiryDate - now;
          
          if (timeRemaining <= 0) {
            // Token has expired
            authService.logout();
            navigate('/login');
            return;
          }
          
          // Set the expiry time in state
          setTokenExpiryTime(expiryDate);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setTokenExpiryTime(null);
      }
    };
    
    // Update token expiry time on component mount
    updateTokenExpiryTime();
    
    // Set up interval to update token expiry time every minute
    const intervalId = setInterval(updateTokenExpiryTime, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [navigate]);
  
  // Format the token expiry time for display
  const formatExpiryTime = () => {
    if (!tokenExpiryTime) return '';
    
    const now = new Date();
    const timeRemaining = tokenExpiryTime - now;
    
    // Convert to minutes and hours
    const totalMinutes = Math.floor(timeRemaining / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const handleLogout = (e) => {
    e.preventDefault();
    authService.logout();
    window.location.href = '/';
  };
  
  return (
    <header className="bg-[#2B2B2B] border-b border-[#423F3E]">
      <div className="flex justify-between items-center px-4 py-2 max-w-screen-xl mx-auto">
        {/* Logo and title on the left */}
        <div className="flex items-center">
          <img 
            src="/images/logo.png" 
            alt="GJC Vemulawada Logo" 
            className="h-16 mr-4"
          />
          <div>
            <h1 className="text-xl font-semibold text-white">Govt Junior College Vemulawada</h1>
            <p className="text-sm text-gray-300">Empowering Minds, Shaping Futures</p>
          </div>
        </div>
        
        {/* Navigation links on the right */}
        <div className="flex items-center">
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`text-gray-300 hover:text-white font-medium ${location.pathname === '/' ? 'text-white' : ''}`}>
              Home
            </Link>
            <Link to="/faculty" className={`text-gray-300 hover:text-white font-medium ${location.pathname === '/faculty' ? 'text-white' : ''}`}>
              Faculty
            </Link>
            <Link to="/academic" className={`text-gray-300 hover:text-white font-medium ${location.pathname === '/academic' ? 'text-white' : ''}`}>
              Academic
            </Link>
            <Link to="/contact" className={`text-gray-300 hover:text-white font-medium ${location.pathname === '/contact' ? 'text-white' : ''}`}>
              Contact Us
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-gray-300 hover:text-white font-medium ${location.pathname === '/dashboard' ? 'text-white' : ''}`}
                >
                  Dashboard
                </Link>
                
                {/* Session expiry indicator */}
                {tokenExpiryTime && (
                  <div className="px-3 py-1 bg-[#362222] text-white text-xs rounded-md" title="Time until session expires">
                    Session: {formatExpiryTime()}
                  </div>
                )}
                
                <Link 
                  to="/" 
                  onClick={handleLogout}
                  className="flex items-center text-gray-300 hover:text-white font-medium ml-4 px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#423F3E' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5.707-5.707A1 1 0 009.586 1H3zm0 2v10h10V7.414L8.414 3H3z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M11 10a1 1 0 00-1 1v3a1 1 0 11-2 0v-3a1 1 0 011-1h2z" clipRule="evenodd" />
                  </svg>
                  Sign Out
                </Link>
              </>
            ) : (
              <Link to="/login" className="flex items-center text-gray-300 hover:text-white font-medium ml-4 px-4 py-2 rounded-lg" style={{ backgroundColor: '#423F3E' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Log In
              </Link>
            )}
          </nav>
          
          {/* Mobile menu button - only visible on small screens */}
          <button 
            className="md:hidden text-white"
            onClick={toggleMobileMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu - Dropdown version for small screens */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#2B2B2B] border-t border-[#423F3E] py-2">
          <nav className="flex flex-col px-4">
            <Link 
              to="/" 
              className={`text-gray-300 hover:text-white py-2 border-b border-[#423F3E] ${location.pathname === '/' ? 'text-white' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/faculty" 
              className={`text-gray-300 hover:text-white py-2 border-b border-[#423F3E] ${location.pathname === '/faculty' ? 'text-white' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Faculty
            </Link>
            <Link 
              to="/academic" 
              className={`text-gray-300 hover:text-white py-2 border-b border-[#423F3E] ${location.pathname === '/academic' ? 'text-white' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Academic
            </Link>
            <Link 
              to="/contact" 
              className={`text-gray-300 hover:text-white py-2 border-b border-[#423F3E] ${location.pathname === '/contact' ? 'text-white' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact Us
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-gray-300 hover:text-white py-2 border-b border-[#423F3E] ${location.pathname === '/dashboard' ? 'text-white' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                {/* Session expiry indicator for mobile */}
                {tokenExpiryTime && (
                  <div className="py-2 text-xs text-center text-white border-b border-[#423F3E]">
                    Session: {formatExpiryTime()}
                  </div>
                )}
                
                <Link 
                  to="/" 
                  onClick={(e) => {
                    e.preventDefault();
                    authService.logout();
                    window.location.href = '/';
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-300 hover:text-white py-2"
                >
                  Sign Out
                </Link>
              </>
            ) : (
              <Link 
                to="/login" 
                className="text-gray-300 hover:text-white py-2 mt-2 text-center bg-[#423F3E] rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar; 