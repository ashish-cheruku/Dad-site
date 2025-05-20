import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const PermissionsManagement = () => {
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({
    can_add_student: false,
    can_edit_student: false,
    can_delete_student: false
  });

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  const fetchStaffUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await authService.getAllUsers();
      // Filter to only staff users
      const staffOnly = allUsers.filter(user => user.role === 'staff');
      setStaffUsers(staffOnly);
    } catch (err) {
      setError('Failed to fetch staff users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user) => {
    try {
      setLoading(true);
      setSelectedUser(user);
      
      // Reset error/success messages
      setError('');
      setSuccess('');
      
      // Fetch user permissions
      const userPermissions = await authService.getUserPermissions(user.id);
      
      // Set permissions state
      setPermissions({
        can_add_student: userPermissions.can_add_student || false,
        can_edit_student: userPermissions.can_edit_student || false,
        can_delete_student: userPermissions.can_delete_student || false
      });
    } catch (err) {
      // If permissions don't exist yet, set defaults
      setPermissions({
        can_add_student: false,
        can_edit_student: false,
        can_delete_student: false
      });
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permission) => {
    setPermissions({
      ...permissions,
      [permission]: !permissions[permission]
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await authService.updateUserPermissions(selectedUser.id, permissions);
      setSuccess(`Permissions updated successfully for ${selectedUser.username}`);
    } catch (err) {
      setError('Failed to update permissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && staffUsers.length === 0) {
    return (
      <div className="min-h-screen bg-[#171010]">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#423F3E]">
            <div>
              <h1 className="text-3xl font-bold text-white">Staff Permissions Management</h1>
              <p className="mt-2 text-gray-300">Manage access permissions for staff members</p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/30 border border-green-700 text-green-300 p-4 rounded-lg mb-6">
              {success}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Staff users list */}
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4">
              <h3 className="text-xl font-semibold mb-4 text-white">Staff Users</h3>
              
              {staffUsers.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No staff users found</p>
              ) : (
                <div className="space-y-2 max-h-[550px] overflow-y-auto pr-2">
                  {staffUsers.map((user) => (
                    <div 
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`p-3 rounded-lg cursor-pointer ${
                        selectedUser?.id === user.id 
                          ? 'bg-[#423F3E] text-white' 
                          : 'bg-[#362222] text-gray-300 hover:bg-[#423F3E] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-[#544E4E] flex items-center justify-center text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Permissions panel */}
            <div className="md:col-span-2">
              {selectedUser ? (
                <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-6 text-white">
                      Permissions for {selectedUser.username}
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="p-5 bg-[#362222] rounded-lg">
                        <h4 className="text-lg font-medium mb-4 text-white">Student Management Permissions</h4>
                        
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-3 bg-[#2B2B2B] rounded-lg">
                            <label className="text-gray-300 flex-1">
                              <span className="font-medium">Add Students</span>
                              <p className="text-sm text-gray-400">Can create new student records</p>
                            </label>
                            <div 
                              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                                permissions.can_add_student ? 'bg-green-700' : 'bg-[#423F3E]'
                              }`}
                              onClick={() => handlePermissionChange('can_add_student')}
                            >
                              <div 
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                                  permissions.can_add_student ? 'translate-x-6' : ''
                                }`} 
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-[#2B2B2B] rounded-lg">
                            <label className="text-gray-300 flex-1">
                              <span className="font-medium">Edit Students</span>
                              <p className="text-sm text-gray-400">Can modify existing student records</p>
                            </label>
                            <div 
                              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                                permissions.can_edit_student ? 'bg-green-700' : 'bg-[#423F3E]'
                              }`}
                              onClick={() => handlePermissionChange('can_edit_student')}
                            >
                              <div 
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                                  permissions.can_edit_student ? 'translate-x-6' : ''
                                }`} 
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-[#2B2B2B] rounded-lg">
                            <label className="text-gray-300 flex-1">
                              <span className="font-medium">Delete Students</span>
                              <p className="text-sm text-gray-400">Can remove student records from the system</p>
                            </label>
                            <div 
                              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                                permissions.can_delete_student ? 'bg-green-700' : 'bg-[#423F3E]'
                              }`}
                              onClick={() => handlePermissionChange('can_delete_student')}
                            >
                              <div 
                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                                  permissions.can_delete_student ? 'translate-x-6' : ''
                                }`} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleSavePermissions}
                      disabled={loading}
                      className="w-full md:w-auto bg-[#423F3E] hover:bg-[#544E4E] text-white py-2 px-6"
                    >
                      {loading ? 'Saving...' : 'Save Permissions'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 flex flex-col items-center justify-center h-full min-h-[550px]">
                  <div className="h-20 w-20 rounded-full bg-[#362222] flex items-center justify-center text-3xl font-bold text-white mb-4">
                    ?
                  </div>
                  <p className="text-gray-400 text-center mb-2">
                    No staff user selected
                  </p>
                  <p className="text-gray-500 text-center text-sm max-w-md">
                    Select a staff user from the list to manage their permissions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PermissionsManagement; 