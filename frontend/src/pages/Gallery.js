import React, { useState } from 'react';
import Navbar from '../components/Navbar';

const Gallery = () => {
  // All gallery images
  const galleryImages = [
    { id: 1, src: '/images/img1.png', alt: 'Campus 1' },
    { id: 2, src: '/images/img2.png', alt: 'Campus 2' },
    { id: 3, src: '/images/img3.png', alt: 'Campus 3' },
    { id: 4, src: '/images/img4.png', alt: 'Campus 4' },
    { id: 5, src: '/images/img5.png', alt: 'Campus 5' },
    { id: 6, src: '/images/img6.png', alt: 'Campus 6' },
    { id: 7, src: '/images/img7.png', alt: 'Campus 7' },
    { id: 8, src: '/images/img8.png', alt: 'Campus 8' },
    { id: 9, src: '/images/img9.png', alt: 'Campus 9' },
    { id: 10, src: '/images/img10.png', alt: 'Campus 10' },
    { id: 11, src: '/images/img11.png', alt: 'Campus 11' }
  ];

  // State for modal
  const [selectedImage, setSelectedImage] = useState(null);

  const openModal = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Handle navigation between images
  const navigateImages = (direction) => {
    if (!selectedImage) return;
    
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % galleryImages.length;
    } else {
      newIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    }
    
    setSelectedImage(galleryImages[newIndex]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#171010]">
      <Navbar />
      
      <main className="flex-grow">
        {/* Page header */}
        <div className="bg-[#2B2B2B] py-12 border-b border-[#423F3E]">
          <div className="max-w-screen-xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-white text-center">Campus Gallery</h1>
            <p className="text-gray-300 text-center mt-4 max-w-2xl mx-auto">
              Explore our campus facilities and environment through this collection of images
            </p>
          </div>
        </div>
        
        {/* Gallery grid */}
        <div className="max-w-screen-xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleryImages.map((image) => (
              <div 
                key={image.id} 
                className="group relative rounded-lg overflow-hidden bg-[#2B2B2B] border border-[#423F3E] shadow-md cursor-pointer"
                onClick={() => openModal(image)}
              >
                <div className="h-64 overflow-hidden">
                  <img 
                    src={image.src} 
                    alt={image.alt} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-[#2B2B2B] rounded-full p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Image viewing features */}
        <div className="max-w-screen-xl mx-auto px-4 py-6 pb-12">
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-white">GJC Vemulawada Campus</h2>
            <p className="text-gray-300 mb-6">
              Our campus provides an ideal environment for academic excellence and extracurricular activities.
              With modern facilities, laboratories, and recreational spaces, students experience a balanced educational journey.
            </p>
            <p className="text-gray-400 text-sm">
              Click on any image above to view it in full size
            </p>
          </div>
        </div>
        
        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4" onClick={closeModal}>
            <div 
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image container */}
              <div className="overflow-hidden bg-[#2B2B2B] rounded-lg border border-[#423F3E] shadow-xl">
                <img 
                  src={selectedImage.src} 
                  alt={selectedImage.alt}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
              
              {/* Controls */}
              <div className="absolute top-1/2 w-full flex justify-between items-center px-2 transform -translate-y-1/2">
                <button 
                  onClick={() => navigateImages('prev')}
                  className="bg-[#2B2B2B] rounded-full p-2 text-white hover:bg-[#423F3E] focus:outline-none"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => navigateImages('next')}
                  className="bg-[#2B2B2B] rounded-full p-2 text-white hover:bg-[#423F3E] focus:outline-none"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Close button */}
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 md:top-6 md:right-6 bg-[#2B2B2B] rounded-full p-2 text-white hover:bg-[#423F3E] focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                <span className="bg-[#2B2B2B] px-4 py-2 rounded-full text-sm">
                  {galleryImages.findIndex(img => img.id === selectedImage.id) + 1} / {galleryImages.length}
                </span>
              </div>
            </div>
          </div>
        )}
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

export default Gallery; 