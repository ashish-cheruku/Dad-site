import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { facultyService } from '../services/api';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const data = await facultyService.getAllFaculty();
        setFaculty(data);
      } catch (err) {
        setError('Failed to fetch faculty data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#171010]">
      <Navbar />
      
      <main className="flex-grow">
        {/* Page header */}
        <div className="bg-[#2B2B2B] py-12 border-b border-[#423F3E]">
          <div className="max-w-screen-xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-white text-center">Our Faculty</h1>
            <p className="text-gray-300 text-center mt-4 max-w-2xl mx-auto">
              Meet our dedicated team of educators who are committed to providing quality education and guidance to our students.
            </p>
          </div>
        </div>
        
        {/* Loading and Error States */}
        {loading ? (
          <div className="max-w-screen-xl mx-auto px-4 py-12 flex justify-center">
            <div className="text-2xl font-semibold animate-pulse text-white">Loading faculty information...</div>
          </div>
        ) : error ? (
          <div className="max-w-screen-xl mx-auto px-4 py-12">
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-6 rounded-lg text-center">
              {error}
            </div>
          </div>
        ) : (
          <>
            {/* Faculty grid */}
            <div className="max-w-screen-xl mx-auto px-4 py-12">
              {faculty.length === 0 ? (
                <div className="text-center text-gray-300 py-8">
                  No faculty information available at this time.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {faculty.map((member) => (
                    <div key={member.id} className="bg-[#2B2B2B] rounded-lg shadow-md overflow-hidden border border-[#423F3E] transition-transform hover:scale-[1.02]">
                      <div className="p-4">
                        <div className="flex items-center mb-4">
                          <div className="h-16 w-16 rounded-full bg-[#362222] flex items-center justify-center text-2xl font-bold text-white mr-4">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-xl">{member.name}</h3>
                            <p className="text-gray-300">{member.position}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3">{member.department}</p>
                        
                        <div className="border-t border-[#423F3E] pt-3 space-y-1">
                          <p className="text-gray-300 text-sm flex items-start">
                            <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {member.education}
                          </p>
                          <p className="text-gray-300 text-sm flex items-start">
                            <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {member.experience}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-[#2B2B2B] text-white py-8 border-t border-[#423F3E]">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <p className="mb-2 text-gray-300">Govt Junior College Vemulawada</p>
              <p className="mb-2 text-gray-300">Vemulawada, Rajanna Sircilla District</p>
              <p className="mb-2 text-gray-300">Telangana, India</p>
              <p className="text-gray-300">Email: info@gjcvemulawada.edu.in</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-300 hover:text-white">Home</a></li>
                <li><a href="/about" className="text-gray-300 hover:text-white">About Us</a></li>
                <li><a href="/faculty" className="text-gray-300 hover:text-white">Faculty</a></li>
                <li><a href="/contact" className="text-gray-300 hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#423F3E] mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Government Junior College Vemulawada. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Faculty; 