import React, { useState, useEffect } from 'react';
import { facultyService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const StaffManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New faculty form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    position: '',
    department: '',
    education: '',
    experience: ''
  });
  
  // Edit faculty modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);

  // Fetch all faculty on component mount
  useEffect(() => {
    fetchFaculty();
  }, []);
  
  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const facultyList = await facultyService.getAllFaculty();
      setFaculty(facultyList);
    } catch (err) {
      setError('Failed to fetch faculty data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle create faculty form input changes
  const handleNewFacultyChange = (e) => {
    const { name, value } = e.target;
    setNewFaculty({
      ...newFaculty,
      [name]: value
    });
  };

  // Handle edit faculty form input changes
  const handleEditingFacultyChange = (e) => {
    const { name, value } = e.target;
    setEditingFaculty({
      ...editingFaculty,
      [name]: value
    });
  };

  // Handle create faculty form submission
  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await facultyService.createFaculty(newFaculty);
      setIsAddModalOpen(false);
      setNewFaculty({
        name: '',
        position: '',
        department: '',
        education: '',
        experience: ''
      });
      fetchFaculty();
    } catch (err) {
      setError(err.detail || 'Failed to create faculty member');
    } finally {
      setLoading(false);
    }
  };

  // Open edit faculty modal
  const openEditModal = (faculty) => {
    setEditingFaculty(faculty);
    setIsEditModalOpen(true);
  };

  // Handle update faculty
  const handleUpdateFaculty = async () => {
    if (!editingFaculty) return;
    
    try {
      setLoading(true);
      await facultyService.updateFaculty(editingFaculty.id, {
        name: editingFaculty.name,
        position: editingFaculty.position,
        department: editingFaculty.department,
        education: editingFaculty.education,
        experience: editingFaculty.experience
      });
      setIsEditModalOpen(false);
      fetchFaculty();
    } catch (err) {
      setError(err.detail || 'Failed to update faculty member');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (faculty) => {
    setFacultyToDelete(faculty);
    setIsDeleteModalOpen(true);
  };

  // Handle delete faculty
  const handleDeleteFaculty = async () => {
    if (!facultyToDelete) return;
    
    try {
      setLoading(true);
      await facultyService.deleteFaculty(facultyToDelete.id);
      setIsDeleteModalOpen(false);
      fetchFaculty();
    } catch (err) {
      setError(err.detail || 'Failed to delete faculty member');
    } finally {
      setLoading(false);
    }
  };

  if (loading && faculty.length === 0) {
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
              <h1 className="text-3xl font-bold text-white">Staff Management</h1>
              <p className="mt-2 text-gray-300">Manage faculty members' information</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: '#362222', color: 'white' }}
            >
              Add New Faculty
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Faculty Table */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#423F3E]">
                <thead className="bg-[#362222]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Position
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Education
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#423F3E]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                        </div>
                      </td>
                    </tr>
                  ) : faculty.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-300">
                        No faculty members found. Add some using the button above.
                      </td>
                    </tr>
                  ) : (
                    faculty.map((member) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-[#423F3E] flex items-center justify-center text-white">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{member.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{member.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{member.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{member.education}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openEditModal(member)}
                            className="text-white hover:text-indigo-300 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => openDeleteModal(member)}
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
      
      {/* Add Faculty Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Add New Faculty Member</h2>
            
            <form onSubmit={handleCreateFaculty}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newFaculty.name}
                    onChange={handleNewFacultyChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-300">Position</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={newFaculty.position}
                    onChange={handleNewFacultyChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-300">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={newFaculty.department}
                    onChange={handleNewFacultyChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="education" className="block text-sm font-medium text-gray-300">Education</label>
                  <input
                    type="text"
                    id="education"
                    name="education"
                    value={newFaculty.education}
                    onChange={handleNewFacultyChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-300">Experience</label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={newFaculty.experience}
                    onChange={handleNewFacultyChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
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
                  {loading ? 'Adding...' : 'Add Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Faculty Modal */}
      {isEditModalOpen && editingFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Edit Faculty Member</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editingFaculty.name}
                  onChange={handleEditingFacultyChange}
                  className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="edit-position" className="block text-sm font-medium text-gray-300">Position</label>
                <input
                  type="text"
                  id="edit-position"
                  name="position"
                  value={editingFaculty.position}
                  onChange={handleEditingFacultyChange}
                  className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="edit-department" className="block text-sm font-medium text-gray-300">Department</label>
                <input
                  type="text"
                  id="edit-department"
                  name="department"
                  value={editingFaculty.department}
                  onChange={handleEditingFacultyChange}
                  className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="edit-education" className="block text-sm font-medium text-gray-300">Education</label>
                <input
                  type="text"
                  id="edit-education"
                  name="education"
                  value={editingFaculty.education}
                  onChange={handleEditingFacultyChange}
                  className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                />
              </div>
              
              <div>
                <label htmlFor="edit-experience" className="block text-sm font-medium text-gray-300">Experience</label>
                <input
                  type="text"
                  id="edit-experience"
                  name="experience"
                  value={editingFaculty.experience}
                  onChange={handleEditingFacultyChange}
                  className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateFaculty}
                className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && facultyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Delete</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">{facultyToDelete.name}</span> from the faculty list? This action cannot be undone.
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
                onClick={handleDeleteFaculty}
                className="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Faculty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement; 