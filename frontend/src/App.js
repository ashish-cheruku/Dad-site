import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
// Register import is commented out as registration is disabled
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Faculty from './pages/Faculty';
import Gallery from './pages/Gallery';
import UserManagement from './pages/UserManagement';
import AnnouncementManagement from './pages/AnnouncementManagement';
import StaffManagement from './pages/StaffManagement';
import StudentManagement from './pages/StudentManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import Announcements from './pages/Announcements';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* Registration is disabled - redirect to login */}
        <Route path="/register" element={<Navigate to="/login" />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/announcements" element={<Announcements />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Principal-only routes */}
        <Route 
          path="/principal/dashboard" 
          element={
            <ProtectedRoute requiredRole="principal">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* User Management - Principal only */}
        <Route 
          path="/user-management" 
          element={
            <ProtectedRoute requiredRole="principal">
              <UserManagement />
            </ProtectedRoute>
          } 
        />

        {/* Announcement Management - Principal only */}
        <Route 
          path="/announcement-management" 
          element={
            <ProtectedRoute requiredRole="principal">
              <AnnouncementManagement />
            </ProtectedRoute>
          } 
        />

        {/* Staff Management - Principal only */}
        <Route 
          path="/staff-management" 
          element={
            <ProtectedRoute requiredRole="principal">
              <StaffManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* Student Management - Principal and Staff */}
        <Route 
          path="/student-management" 
          element={
            <ProtectedRoute requiredRole="staff">
              <StudentManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* Attendance Management - Principal and Staff */}
        <Route 
          path="/attendance-management" 
          element={
            <ProtectedRoute requiredRole="staff">
              <AttendanceManagement />
            </ProtectedRoute>
          } 
        />

        {/* Staff-only routes */}
        <Route 
          path="/staff/dashboard" 
          element={
            <ProtectedRoute requiredRole="staff">
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Placeholder routes for navigation menu items */}
        <Route path="/academic" element={<Home />} />
        <Route path="/contact" element={<Home />} />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App; 