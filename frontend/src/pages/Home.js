import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { announcementService } from '../services/api';
import { authService } from '../services/api';

const Home = () => {
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
    <div className="flex flex-col min-h-screen bg-[#171010]">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero section */}
        <section className="relative">
          <div className="w-full h-96 bg-cover bg-center" style={{ backgroundImage: "url('/images/img.png')" }}>
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Welcome to GJC Vemulawada</h1>
              <p className="text-xl md:text-2xl max-w-2xl text-center">
                Empowering students through quality education and holistic development
              </p>
            </div>
          </div>
        </section>
        
        {/* Main content with split layout */}
        <div className="max-w-screen-xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* About Us (2/3 width on large screens) */}
            <div className="w-full lg:w-2/3">
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-12">
                <h2 className="text-3xl font-bold mb-6 text-white">About Us</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  At Government Junior College Vemulawada, we are dedicated for providing a transformative educational experience that nurtures individual growth and fosters a culture of academic excellence. Our commitment to innovation and inclusivity ensures that every student receives a holistic education that prepares them for success in a rapidly evolving world.
                </p>
              </div>
              
              {/* Courses Offered Section */}
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-12">
                <h2 className="text-3xl font-bold mb-6 text-white">Courses Offered</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white border-b border-[#423F3E] pb-2">General</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-[#423F3E] mr-3"></div>
                        <span>MPC (T/M, E/M)</span>
                      </li>
                      <li className="flex items-center text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-[#423F3E] mr-3"></div>
                        <span>BPC (T/M, E/M)</span>
                      </li>
                      <li className="flex items-center text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-[#423F3E] mr-3"></div>
                        <span>CEC (T/M, E/M)</span>
                      </li>
                      <li className="flex items-center text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-[#423F3E] mr-3"></div>
                        <span>HEC (T/M, E/M)</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-white border-b border-[#423F3E] pb-2">Vocational</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-[#423F3E] mr-3"></div>
                        <span>T&HM (E/M)</span>
                      </li>
                      <li className="flex items-center text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-[#423F3E] mr-3"></div>
                        <span>O.A.S (E/M)</span>
                      </li>
                      <li className="flex items-center text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-[#423F3E] mr-3"></div>
                        <span>MPHW(F) (E/M)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Gallery Section - New addition */}
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-12">
                <h2 className="text-3xl font-bold mb-6 text-white">Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative h-48 overflow-hidden rounded-lg group animate-slideRight hover:-translate-y-1 transition-transform duration-300">
                    <img 
                      src="/images/img1.png" 
                      alt="Campus 1" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className="relative h-48 overflow-hidden rounded-lg group animate-slideRight animation-delay-200 hover:-translate-y-1 transition-transform duration-300">
                    <img 
                      src="/images/img2.png" 
                      alt="Campus 2" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className="relative h-48 overflow-hidden rounded-lg group animate-slideRight animation-delay-400 hover:-translate-y-1 transition-transform duration-300">
                    <img 
                      src="/images/img3.png" 
                      alt="Campus 3" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className="relative h-48 overflow-hidden rounded-lg group animate-slideLeft hover:-translate-y-1 transition-transform duration-300">
                    <img 
                      src="/images/img4.png" 
                      alt="Campus 4" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className="relative h-48 overflow-hidden rounded-lg group animate-slideLeft animation-delay-200 hover:-translate-y-1 transition-transform duration-300">
                    <img 
                      src="/images/img5.png" 
                      alt="Campus 5" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  
                  <div className="relative h-48 overflow-hidden rounded-lg group animate-slideLeft animation-delay-400 hover:-translate-y-1 transition-transform duration-300">
                    <img 
                      src="/images/img6.png" 
                      alt="Campus 6" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Link to="/gallery" className="inline-block px-6 py-2 bg-[#362222] text-white rounded-lg hover:bg-[#423F3E] transition-colors">
                    View Full Gallery
                  </Link>
                </div>
              </div>
              
              {/* Features section */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-10 text-white">Our Features</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#2B2B2B] p-6 rounded-lg shadow-md border border-[#423F3E]">
                    <div className="w-12 h-12 rounded-full bg-[#362222] flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Quality Education</h3>
                    <p className="text-gray-300">
                      We provide high-quality education with experienced faculty to ensure academic excellence.
                    </p>
                  </div>
                  
                  <div className="bg-[#2B2B2B] p-6 rounded-lg shadow-md border border-[#423F3E]">
                    <div className="w-12 h-12 rounded-full bg-[#362222] flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Modern Facilities</h3>
                    <p className="text-gray-300">
                      Our campus is equipped with modern facilities and infrastructure to support student learning.
                    </p>
                  </div>
                  
                  <div className="bg-[#2B2B2B] p-6 rounded-lg shadow-md border border-[#423F3E]">
                    <div className="w-12 h-12 rounded-full bg-[#362222] flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Holistic Development</h3>
                    <p className="text-gray-300">
                      We focus on the overall development of students through various extracurricular activities.
                    </p>
                  </div>
                </div>
              </section>
            </div>
            
            {/* Announcements sidebar (1/3 width on large screens) */}
            <div className="w-full lg:w-1/3">
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] sticky top-4">
                <div className="p-4 border-b border-[#423F3E] bg-[#362222] rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Announcements</h2>
                    {isPrincipal && (
                      <Link 
                        to="/announcement-management" 
                        className="text-white bg-[#423F3E] px-3 py-1 rounded-md text-sm hover:bg-[#362222]"
                      >
                        Manage
                      </Link>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                        <p className="text-gray-300 mt-2">Loading announcements...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-4">
                        <p className="text-red-400">{error}</p>
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-300">No announcements available</p>
                      </div>
                    ) : (
                      announcements.map((announcement) => (
                        <div key={announcement.id} className="border-b border-[#423F3E] pb-4">
                          <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                          <p className="text-gray-300 text-sm mb-2">
                            {announcement.content}
                          </p>
                          {announcement.link && (
                            <div className="mb-2">
                              <a 
                                href={announcement.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                {announcement.link_text || "Important Link"}
                              </a>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                              {new Date(announcement.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {announcements.length > 0 && (
                    <div className="mt-4 text-center">
                      <Link to="/announcements" className="text-white bg-[#362222] px-4 py-2 rounded-md inline-block hover:bg-[#423F3E]">
                        View All Announcements
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
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
                <li><Link to="/admissions" className="text-gray-300 hover:text-white">Admissions</Link></li>
                <li><Link to="/calendar" className="text-gray-300 hover:text-white">Academic Calendar</Link></li>
                <li><Link to="/facilities" className="text-gray-300 hover:text-white">Facilities</Link></li>
                <li><Link to="/results" className="text-gray-300 hover:text-white">Results</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect with Us</h3>
              <div className="flex space-x-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-[#423F3E] text-center">
            <p className="text-gray-300">&copy; {new Date().getFullYear()} Govt Junior College Vemulawada. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 