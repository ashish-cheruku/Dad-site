import React, { useState, useEffect } from 'react';
import { announcementService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New announcement form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    link: '',
    link_text: ''
  });
  
  // Edit announcement modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editLinkText, setEditLinkText] = useState('');
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  // Fetch all announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const allAnnouncements = await announcementService.getAllAnnouncements();
      setAnnouncements(allAnnouncements);
    } catch (err) {
      setError('Failed to fetch announcements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle create announcement form input changes
  const handleNewAnnouncementChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement({
      ...newAnnouncement,
      [name]: value
    });
  };

  // Handle create announcement form submission
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await announcementService.createAnnouncement(
        newAnnouncement.title, 
        newAnnouncement.content,
        newAnnouncement.link || null,
        newAnnouncement.link_text || null
      );
      setIsAddModalOpen(false);
      setNewAnnouncement({
        title: '',
        content: '',
        link: '',
        link_text: ''
      });
      fetchAnnouncements();
    } catch (err) {
      setError(err.detail || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  // Open edit announcement modal
  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setEditTitle(announcement.title);
    setEditContent(announcement.content);
    setEditLink(announcement.link || '');
    setEditLinkText(announcement.link_text || '');
    setIsEditModalOpen(true);
  };

  // Handle update announcement
  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;
    
    try {
      setLoading(true);
      await announcementService.updateAnnouncement(
        editingAnnouncement.id, 
        editTitle, 
        editContent,
        editLink || null,
        editLinkText || null
      );
      setIsEditModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      setError(err.detail || 'Failed to update announcement');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteModalOpen(true);
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    
    try {
      setLoading(true);
      await announcementService.deleteAnnouncement(announcementToDelete.id);
      setIsDeleteModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      setError(err.detail || 'Failed to delete announcement');
    } finally {
      setLoading(false);
    }
  };

  if (loading && announcements.length === 0) {
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
              <h1 className="text-3xl font-bold text-white">Announcement Management</h1>
              <p className="mt-2 text-gray-300">Create, edit, and delete announcements</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: '#362222', color: 'white' }}
            >
              Add New Announcement
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Announcements Table */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#423F3E]">
                <thead className="bg-[#362222]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Content
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Important Link
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Updated At
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#423F3E]">
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-300">
                        No announcements found. Create your first announcement.
                      </td>
                    </tr>
                  ) : (
                    announcements.map((announcement) => (
                      <tr key={announcement.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{announcement.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300 line-clamp-2">{announcement.content}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {announcement.link ? (
                            <a 
                              href={announcement.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sm text-blue-400 hover:text-blue-300 underline"
                            >
                              {announcement.link_text || "Important Link"}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {announcement.updated_at ? new Date(announcement.updated_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openEditModal(announcement)}
                            className="text-white hover:text-indigo-300 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => openDeleteModal(announcement)}
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
      
      {/* Add Announcement Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Add New Announcement</h2>
            
            <form onSubmit={handleCreateAnnouncement}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newAnnouncement.title}
                    onChange={handleNewAnnouncementChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-300">Content</label>
                  <textarea
                    id="content"
                    name="content"
                    rows="4"
                    value={newAnnouncement.content}
                    onChange={handleNewAnnouncementChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  ></textarea>
                </div>
                
                <div className="pt-4 border-t border-[#423F3E]">
                  <h3 className="text-lg font-medium text-white mb-2">Important Link (Optional)</h3>
                  
                  <div className="mt-3">
                    <label htmlFor="link" className="block text-sm font-medium text-gray-300">Link URL</label>
                    <input
                      type="url"
                      id="link"
                      name="link"
                      value={newAnnouncement.link}
                      onChange={handleNewAnnouncementChange}
                      placeholder="https://example.com"
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label htmlFor="link_text" className="block text-sm font-medium text-gray-300">Link Text</label>
                    <input
                      type="text"
                      id="link_text"
                      name="link_text"
                      value={newAnnouncement.link_text}
                      onChange={handleNewAnnouncementChange}
                      placeholder="Click here for more details"
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    />
                    <p className="mt-1 text-sm text-gray-400">Leave blank to use "Important Link" as default</p>
                  </div>
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
                  {loading ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Announcement Modal */}
      {isEditModalOpen && editingAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Edit Announcement</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="editTitle" className="block text-sm font-medium text-gray-300">Title</label>
                <input
                  type="text"
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="editContent" className="block text-sm font-medium text-gray-300">Content</label>
                <textarea
                  id="editContent"
                  rows="4"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                  required
                ></textarea>
              </div>
              
              <div className="pt-4 border-t border-[#423F3E]">
                <h3 className="text-lg font-medium text-white mb-2">Important Link (Optional)</h3>
                
                <div className="mt-3">
                  <label htmlFor="editLink" className="block text-sm font-medium text-gray-300">Link URL</label>
                  <input
                    type="url"
                    id="editLink"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                  />
                </div>
                
                <div className="mt-3">
                  <label htmlFor="editLinkText" className="block text-sm font-medium text-gray-300">Link Text</label>
                  <input
                    type="text"
                    id="editLinkText"
                    value={editLinkText}
                    onChange={(e) => setEditLinkText(e.target.value)}
                    placeholder="Click here for more details"
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                  />
                  <p className="mt-1 text-sm text-gray-400">Leave blank to use "Important Link" as default</p>
                </div>
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
                onClick={handleUpdateAnnouncement}
                className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && announcementToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Delete</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete the announcement <span className="font-semibold">"{announcementToDelete.title}"</span>? This action cannot be undone.
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
                onClick={handleDeleteAnnouncement}
                className="px-4 py-2 bg-red-900 text-white rounded-md hover:bg-red-800"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement; 