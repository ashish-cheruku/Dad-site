import React, { useState, useEffect } from 'react';
import { authService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // New user form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student'
  });
  
  // Edit role modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  
  // Change password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Filter users when search term or active tab changes
  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchTerm, activeTab]);
  
  const filterUsers = () => {
    let result = [...users];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
    }
    
    // Filter by role (tab)
    if (activeTab !== 'all') {
      result = result.filter(user => user.role === activeTab);
    }
    
    setFilteredUsers(result);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await authService.getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Set active tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Count users by role
  const getUserCounts = () => {
    const counts = {
      all: users.length,
      student: users.filter(user => user.role === 'student').length,
      staff: users.filter(user => user.role === 'staff').length,
      principal: users.filter(user => user.role === 'principal').length
    };
    return counts;
  };

  // Handle create user form input changes
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  // Handle create user form submission
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authService.createUser(newUser);
      setIsAddModalOpen(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'student'
      });
      fetchUsers();
    } catch (err) {
      setError(err.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Open edit role modal
  const openEditRoleModal = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setIsEditModalOpen(true);
  };

  // Handle update user role
  const handleUpdateUserRole = async () => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      await authService.updateUserRole(editingUser.id, selectedRole);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.detail || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  // Open change password modal
  const openPasswordModal = (user) => {
    setPasswordUser(user);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  // Handle update user password
  const handleUpdateUserPassword = async () => {
    if (!passwordUser || !newPassword) return;
    
    try {
      setLoading(true);
      await authService.updateUserPassword(passwordUser.id, newPassword);
      setIsPasswordModalOpen(false);
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      setError(err.detail || 'Failed to update user password');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      await authService.deleteUser(userToDelete.id);
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.detail || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
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
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#423F3E]">
            <div>
              <h1 className="text-3xl font-bold text-white">User Management</h1>
              <p className="mt-2 text-gray-300">Manage users and their roles</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: '#362222', color: 'white' }}
            >
              Add New User
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="w-full md:w-1/3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 pl-10 bg-[#2B2B2B] border border-[#423F3E] rounded-md text-white focus:outline-none"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-1 overflow-x-auto pb-2 w-full md:w-auto">
              {Object.entries(getUserCounts()).map(([role, count]) => (
                <button
                  key={role}
                  onClick={() => handleTabChange(role)}
                  className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    activeTab === role
                      ? 'bg-[#362222] text-white'
                      : 'bg-[#2B2B2B] text-gray-300 hover:bg-[#423F3E]'
                  }`}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)} ({count})
                </button>
              ))}
            </div>
          </div>
          
          {/* Users Table */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#423F3E]">
                <thead className="bg-[#362222]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#423F3E]">
                  {loading && users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-300">
                        {searchTerm ? 'No users match your search.' : 'No users found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-[#423F3E] flex items-center justify-center text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role === 'principal' ? 'bg-purple-900 text-purple-100' : 
                              user.role === 'staff' ? 'bg-blue-900 text-blue-100' : 
                              'bg-green-900 text-green-100'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openEditRoleModal(user)}
                            className="text-white hover:text-indigo-300 mr-3"
                          >
                            Edit Role
                          </button>
                          <button 
                            onClick={() => openPasswordModal(user)}
                            className="text-yellow-400 hover:text-yellow-300 mr-3"
                          >
                            Change Password
                          </button>
                          <button 
                            onClick={() => openDeleteModal(user)}
                            className="text-red-500 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      
      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Add New User</h2>
            
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={newUser.username}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={newUser.role}
                    onChange={handleNewUserChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="principal">Principal</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Role Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Change User Role</h2>
            <p className="text-gray-300 mb-4">
              Update role for <span className="font-semibold">{editingUser.username}</span>
            </p>
            
            <div className="mb-4">
              <label htmlFor="selectedRole" className="block text-sm font-medium text-gray-300">Select Role</label>
              <select
                id="selectedRole"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="principal">Principal</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateUserRole}
                className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Delete</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the user <span className="font-semibold">{userToDelete.username}</span>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && passwordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
            <p className="text-gray-300 mb-4">
              Set new password for <span className="font-semibold">{passwordUser.username}</span>
            </p>
            
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateUserPassword}
                className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                disabled={loading || !newPassword}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 