import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { announcementService } from '../services/api';
import { authService } from '../services/api';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isPrincipal = authService.hasRole('principal');

  useEffect(() => {
    // Fetch announcements when component mounts
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const data = await announcementService.getAllAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-[#171010]">
      <Navbar />
      
      <main className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Announcements</h1>
          {isPrincipal && (
            <Link 
              to="/announcement-management" 
              className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
            >
              Manage Announcements
            </Link>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-xl">No announcements available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id} 
                className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6"
              >
                <h2 className="text-xl font-bold text-white mb-2">{announcement.title}</h2>
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                
                {announcement.link && (
                  <div className="mb-4 p-3 bg-[#362222] rounded-md border border-[#423F3E]">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <a 
                        href={announcement.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {announcement.link_text || "Important Link"}
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-gray-400 text-sm">
                  <span>Posted: {new Date(announcement.created_at).toLocaleDateString()}</span>
                  {announcement.updated_at && (
                    <span>Updated: {new Date(announcement.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Announcements; 