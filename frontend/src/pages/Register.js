import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Call register API
      await authService.register(username, email, password);
      
      // Auto login after successful registration
      setTimeout(async () => {
        try {
          await authService.login(username, password);
          navigate('/dashboard');
        } catch (loginErr) {
          console.error('Auto-login failed:', loginErr);
          navigate('/login');
        }
      }, 1500);
    } catch (err) {
      // Handle registration error
      setError(err.detail || 'Registration failed. Please try again.');
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
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">GJC Vemulawada</h2>
              <p className="text-sm text-gray-300">Established in 1981, our college has a long legacy of academic excellence in Rajanna Sircilla District.</p>
            </div>
            
            <div className="bg-[#362222] bg-opacity-70 p-4 rounded-lg border border-[#423F3E] mb-4">
              <h3 className="font-semibold mb-2 text-sm">Student Portal Benefits</h3>
              <ul className="space-y-1 text-xs text-gray-300">
                <li className="flex items-center">
                  <svg className="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View upcoming exams and results
                </li>
                <li className="flex items-center">
                  <svg className="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Access academic calendar events
                </li>
                <li className="flex items-center">
                  <svg className="h-3 w-3 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Download study materials
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Right side - Register Form */}
        <div className="w-full md:w-1/2 p-6 bg-[#2B2B2B] border-[#423F3E]">
          <div className="text-center mb-4">
            <div className="inline-block w-12 h-12 rounded-full bg-[#362222] flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
            <p className="mt-1 text-xs text-gray-300">
              Join GJC Vemulawada community
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-2 text-xs rounded-lg" style={{ backgroundColor: 'rgba(236, 100, 75, 0.1)', borderColor: 'rgba(236, 100, 75, 0.3)', color: 'rgba(236, 100, 75, 0.9)', border: '1px solid' }}>
              {error}
            </div>
          )}
          
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Label htmlFor="username" className="text-gray-300 text-sm">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="border text-white placeholder-gray-400 py-1 text-sm"
                style={{ 
                  backgroundColor: '#171010', 
                  borderColor: '#423F3E', 
                  color: 'white'
                }}
              />
              <p className="text-xs text-gray-400">
                Username will be used for login
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-300 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="border text-white placeholder-gray-400 py-1 text-sm"
                style={{ 
                  backgroundColor: '#171010', 
                  borderColor: '#423F3E', 
                  color: 'white'
                }}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-300 text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="border text-white placeholder-gray-400 py-1 text-sm"
                style={{ 
                  backgroundColor: '#171010', 
                  borderColor: '#423F3E', 
                  color: 'white'
                }}
              />
              <p className="text-xs text-gray-400">
                Min. 8 characters
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="border text-white placeholder-gray-400 py-1 text-sm"
                style={{ 
                  backgroundColor: '#171010', 
                  borderColor: '#423F3E', 
                  color: 'white'
                }}
              />
            </div>
            
            <div className="mt-2">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-3 w-3 border border-[#423F3E] rounded bg-[#171010] focus:ring-0"
                  />
                </div>
                <div className="ml-2">
                  <label htmlFor="terms" className="text-xs text-gray-300">
                    I accept the <Link to="/terms" className="text-white hover:text-gray-200 underline">Terms</Link> and <Link to="/privacy" className="text-white hover:text-gray-200 underline">Privacy Policy</Link>
                  </label>
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-1.5 mt-3 rounded-lg transition-colors text-sm"
              style={{ backgroundColor: '#423F3E', color: 'white' }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          
          <div className="mt-3 text-center text-xs">
            <span className="text-gray-400">Already have an account? </span>
            <Link to="/login" className="font-medium hover:text-gray-200 text-white">
              Sign in
            </Link>
          </div>
          
          {/* Additional section */}
          <div className="mt-4 pt-4 border-t border-[#423F3E]">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-2">Or register using</p>
              <div className="flex justify-center space-x-3">
                <Button
                  className="inline-flex items-center px-3 py-1 rounded-lg border border-[#423F3E] bg-[#171010] text-white text-xs"
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <Button
                  className="inline-flex items-center px-3 py-1 rounded-lg border border-[#423F3E] bg-[#171010] text-white text-xs"
                >
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.162 6.839 9.49.5.092.682-.217.682-.48 0-.237-.01-1.025-.014-1.86-2.782.603-3.369-1.338-3.369-1.338-.454-1.152-1.11-1.459-1.11-1.459-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.09-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.592 1.028 2.683 0 3.841-2.337 4.687-4.565 4.934.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.48A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 