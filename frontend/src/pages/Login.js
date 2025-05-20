import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ErrorDisplay, setSafeError } from '../utils/errorHandler';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userRole) {
      // Redirect based on role
      if (userRole === 'principal') {
        navigate('/principal/dashboard');
      } else if (userRole === 'staff') {
        navigate('/staff/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    try {
      setError(''); // Clear any existing errors
      setLoading(true);
      
      const data = await authService.login(username, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      
      // Redirect based on role
      if (data.role === 'principal') {
        navigate('/dashboard');
      } else if (data.role === 'staff') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
      
      // Handle validation errors specifically
      if (err && Array.isArray(err)) {
        // Format FastAPI validation errors
        const errorMessages = err.map(e => {
          if (e.type === 'missing' && e.loc && e.loc.includes('username')) {
            return 'Username is required';
          } else if (e.type === 'missing' && e.loc && e.loc.includes('password')) {
            return 'Password is required';
          } else {
            return e.msg || 'Validation error';
          }
        });
        setError(errorMessages.join('. '));
      } else {
        setSafeError(setError, err, 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#171010]">
      <div className="w-full max-w-5xl flex rounded-xl overflow-hidden shadow-2xl">
        {/* Left side - Image with overlay content */}
        <div className="hidden md:block w-1/2 relative">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/image.png')" }}></div>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(23, 16, 16, 0.6)' }}></div>
          
          {/* Overlay content on image side */}
          <div className="absolute inset-0 flex flex-col justify-center px-8 text-white">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
              <p className="text-gray-300">Access your student dashboard to view course materials, assignments, and important announcements.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#362222] flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Stay Updated</h3>
                  <p className="text-sm text-gray-300">Get the latest announcements and updates</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#362222] flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Access Resources</h3>
                  <p className="text-sm text-gray-300">View and download course materials</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#362222] flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Track Events</h3>
                  <p className="text-sm text-gray-300">Never miss important dates and events</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Login Form */}
        <div className="w-full md:w-1/2 p-8 bg-[#2B2B2B] border-[#423F3E]">
          <div className="text-center mb-8">
            <div className="inline-block w-16 h-16 rounded-full bg-[#362222] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">GJC Vemulawada</h1>
            <p className="mt-2 text-sm text-gray-300">
              Enter your credentials to access your account
            </p>
          </div>
          
          <ErrorDisplay error={error} />
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="border text-white placeholder-gray-400"
                style={{ 
                  backgroundColor: '#171010', 
                  borderColor: '#423F3E', 
                  color: 'white'
                }}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">
                  Password
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="border text-white placeholder-gray-400"
                style={{ 
                  backgroundColor: '#171010', 
                  borderColor: '#423F3E', 
                  color: 'white'
                }}
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 border border-[#423F3E] rounded bg-[#171010] focus:ring-0"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-300">
                Remember me for 30 days
              </label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#423F3E', color: 'white' }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-400">
              Contact administrator for an account
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 