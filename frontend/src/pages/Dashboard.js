import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [principalStats, setPrincipalStats] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await authService.getCurrentUser();
        setUser(userData);
        
        // Determine data to fetch based on current route or user role
        const currentPath = location.pathname;
        
        if (currentPath.includes('principal') || userData.role === 'principal') {
          const principalData = await authService.getPrincipalDashboard();
          setPrincipalStats(principalData.statistics);
        }
        
        if (currentPath.includes('staff') || userData.role === 'staff') {
          const staffDashboardData = await authService.getStaffDashboard();
          setStaffData(staffDashboardData);
        }
      } catch (err) {
        setError('Failed to fetch user data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="max-w-md p-8 rounded-2xl shadow-xl border bg-[#2B2B2B] border-[#423F3E]">
          <h2 className="text-2xl font-bold mb-4 text-white">Error</h2>
          <p className="text-gray-300">{error}</p>
          <Button 
            className="mt-6" 
            onClick={() => navigate('/login')}
            style={{ backgroundColor: '#423F3E', color: 'white' }}
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // Render different dashboard content based on user role
  const renderRoleBasedContent = () => {
    switch (user?.role) {
      case 'principal':
        return (
          <>
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Principal Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#362222] p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-2">Total Students</h4>
                  <p className="text-3xl font-bold text-white">{principalStats?.total_students || 0}</p>
                </div>
                <div className="bg-[#362222] p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-2">Total Staff</h4>
                  <p className="text-3xl font-bold text-white">{principalStats?.total_staff || 0}</p>
                </div>
                <div className="bg-[#362222] p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-2">Departments</h4>
                  <p className="text-3xl font-bold text-white">{principalStats?.departments || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Administrative Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/user-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Manage Users & Roles
                  </button>
                </Link>
                <Link to="/announcement-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Manage Announcements
                  </button>
                </Link>
                <Link to="/staff-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Manage Staff
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Student Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/student-management" className="text-white">
                  <h3 className="text-xl font-semibold mb-2">Student Management</h3>
                  <p className="text-gray-300 mb-4">Manage student records, enrollments, and information</p>
                  <span className="text-white flex items-center">
                    Access Student Records <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
              
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/attendance-management" className="text-white">
                  <h3 className="text-xl font-semibold mb-2">Attendance Management</h3>
                  <p className="text-gray-300 mb-4">Set working days, record attendance and view low attendance reports</p>
                  <span className="text-white flex items-center">
                    Manage Attendance <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </>
        );
      
      case 'staff':
        return (
          <>
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Staff Dashboard</h3>
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-3">Your Classes</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {staffData?.classes?.length > 0 ? (
                    staffData.classes.map((className, index) => (
                      <div key={index} className="bg-[#362222] p-4 rounded-lg">
                        <p className="text-lg font-medium text-white">{className}</p>
                        <div className="mt-3 flex justify-between">
                          <button className="text-sm bg-[#423F3E] hover:bg-[#544E4E] text-white py-1 px-3 rounded">
                            Attendance
                          </button>
                          <button className="text-sm bg-[#423F3E] hover:bg-[#544E4E] text-white py-1 px-3 rounded">
                            Grades
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 bg-[#362222] p-4 rounded-lg">
                      <p className="text-gray-300">No classes assigned yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Teaching Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300 text-left">
                  Lesson Plan Templates
                </button>
                <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300 text-left">
                  Assessment Tools
                </button>
              </div>
            </div>
            
            {/* Student Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/student-management" className="text-white">
                  <h3 className="text-xl font-semibold mb-2">Student Management</h3>
                  <p className="text-gray-300 mb-4">Access and manage student information records</p>
                  <span className="text-white flex items-center">
                    View Students <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
              
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/attendance-management" className="text-white">
                  <h3 className="text-xl font-semibold mb-2">Attendance Management</h3>
                  <p className="text-gray-300 mb-4">Record attendance and identify students with low attendance</p>
                  <span className="text-white flex items-center">
                    Record Attendance <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </>
        );
      
      default: // Student view
        return (
          <>
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Student Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#362222] p-5 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-3">Course Schedule</h4>
                  <p className="text-gray-300">No courses available yet. Please check back later.</p>
                </div>
                
                <div className="bg-[#362222] p-5 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-3">Upcoming Exams</h4>
                  <p className="text-gray-300">No scheduled exams at this time.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Academic Resources</h3>
              <div className="bg-[#362222] p-5 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-3">Available Resources</h4>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Library access</li>
                  <li>Online learning materials</li>
                  <li>Study groups</li>
                </ul>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 pb-4 border-b border-[#423F3E]">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-gray-300">
              Welcome to your personal dashboard, {user?.username}
              {user?.role && <span className="ml-2 inline-block px-2 py-1 text-xs bg-[#362222] rounded-full">{user.role}</span>}
            </p>
          </div>
          
          <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center mb-6">
              <div className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-semibold bg-[#362222] text-white mb-4 md:mb-0 md:mr-6">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
                <p className="text-gray-400">{user?.email}</p>
              </div>
              <div className="ml-auto mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="border text-white hover:bg-[#423F3E]/20"
                  style={{ borderColor: '#423F3E', backgroundColor: 'transparent' }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
            
            <div className="pt-6 border-t border-[#423F3E]">
              <h3 className="text-xl font-semibold mb-4 text-white">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-gray-400 mb-1">Username</span>
                  <span className="font-medium text-white">{user?.username}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 mb-1">Email</span>
                  <span className="font-medium text-white">{user?.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 mb-1">Role</span>
                  <span className="font-medium text-white capitalize">{user?.role || 'Student'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Role-specific content */}
          {renderRoleBasedContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 