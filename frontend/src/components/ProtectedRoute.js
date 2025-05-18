import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const navigate = useNavigate();
  
  // Check if token is valid and not expired
  useEffect(() => {
    const checkTokenValidity = () => {
      if (!authService.isTokenValid()) {
        navigate('/login');
      }
    };
    
    // Check token validity initially
    checkTokenValidity();
    
    // Set up interval to check token validity every minute
    const intervalId = setInterval(checkTokenValidity, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [navigate]);

  const isAuthenticated = () => {
    // This will also check if the token is valid and not expired
    return localStorage.getItem('token') !== null && authService.isTokenValid();
  };

  // Check if user has required role
  const hasRole = (role) => {
    return authService.hasRole(role);
  };

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // If a specific role is required, check it
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedRoute; 