import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      setError('Please fill all required fields');
      return;
    }
    
    // Form submission would go here in a real application
    console.log('Form submitted:', formData);
    
    // Show success message
    setSubmitted(true);
    setError('');
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#423F3E]">
            <div>
              <h1 className="text-3xl font-bold text-white">Contact Us</h1>
              <p className="mt-2 text-gray-300">Get in touch with Government Junior College, Vemulawada</p>
            </div>
          </div>
          
          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#362222] flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-white">Address</h3>
                      <p className="text-gray-300 mt-1">
                        Government Junior College<br />
                        Vemulawada, Rajanna Sircilla Dist.<br />
                        Telangana - 505302
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#362222] flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-white">Phone</h3>
                      <p className="text-gray-300 mt-1">
                        Office: 08723 - 236043<br />
                        Reception: 08723 - 236018
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#362222] flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-white">Email</h3>
                      <p className="text-gray-300 mt-1">
                        gjc.vemulawada@gmail.com<br />
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#362222] flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-white">Office Hours</h3>
                      <p className="text-gray-300 mt-1">
                        Monday - Saturday: 9:00 AM - 5:00 PM<br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
                {/* <h2 className="text-xl font-semibold text-white mb-4">Admissions Contact</h2> */}
                <div className="space-y-4">
                  {/* <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#362222] flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-white">Admissions Officer</h3>
                      <p className="text-gray-300 mt-1">
                        Phone: 08723 - 236040<br />
                        Email: admissions.gjcvemulawada@telangana.gov.in
                      </p>
                    </div>
                  </div> */}
                  
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-white mb-2">Admission Hours</h3>
                    <p className="text-gray-300">
                      During admission season (May-June):<br />
                      Monday - Saturday: 9:00 AM - 4:00 PM
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
                <h2 className="text-xl font-semibold text-white mb-4">How to Reach</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-medium text-white">By Bus</h3>
                    <p className="text-gray-300 mt-1">
                      Regular TSRTC buses available from Karimnagar (35 km) and other major towns. The college is located near the main bus station in Vemulawada.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-white">By Train</h3>
                    <p className="text-gray-300 mt-1">
                      Nearest railway station is at Karimnagar (35 km). Auto-rickshaws and buses are available from the station to Vemulawada.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-white">By Road</h3>
                    <p className="text-gray-300 mt-1">
                      Well-connected by road to Karimnagar, Hyderabad, Warangal and other major cities. Private vehicles can reach the college via the main town road.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form and Map */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Send us a Message</h2>
                
                {submitted ? (
                  <div className="bg-green-900/30 border border-green-700 text-green-300 p-4 rounded-lg mb-6">
                    Thank you for your message! We will get back to you as soon as possible.
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
                        {error}
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name*</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email*</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone*</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                          <select
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                          >
                            <option value="">Select a subject</option>
                            <option value="Admission Inquiry">Admission Inquiry</option>
                            <option value="Fee Structure">Fee Structure</option>
                            <option value="Course Information">Course Information</option>
                            <option value="Document Verification">Document Verification</option>
                            <option value="Transfer Certificate">Transfer Certificate</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Message*</label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows="5"
                          className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                          required
                        ></textarea>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="px-6 py-3 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300"
                        >
                          Send Message
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </div>
              
              {/* Location Map (Placeholder) */}
              {/* <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Our Location</h2>
                <div className="bg-[#171010] p-2 rounded-lg border border-[#423F3E]">
                  <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
                    <div className="h-80 w-full bg-[#362222] rounded-lg flex items-center justify-center text-white">
                      <div className="text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h3 className="text-lg font-medium mb-2">Government Junior College, Vemulawada</h3>
                        <p className="text-gray-300">
                          Located next to Sri Raja Rajeshwara Swamy Temple<br />
                          Vemulawada, Rajanna Sircilla District<br />
                          Telangana - 505302
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  * Interactive map would be integrated here in production environment
                </p>
              </div> */}
              
              {/* FAQ Section */}
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
                
                <div className="space-y-4">
                  <div className="bg-[#362222] p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-white">When does the admission process start?</h3>
                    <p className="text-gray-300 mt-2">
                      Admissions generally begin after the announcement of 10th class results, usually in May-June. Check our website or contact the admissions office for exact dates.
                    </p>
                  </div>
                  
                  <div className="bg-[#362222] p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-white">What documents are required for admission?</h3>
                    <p className="text-gray-300 mt-2">
                      Required documents include 10th class marks memo, transfer certificate, caste certificate (if applicable), Aadhaar card, and passport-sized photographs.
                    </p>
                  </div>
                  
                  <div className="bg-[#362222] p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-white">Are hostel facilities available?</h3>
                    <p className="text-gray-300 mt-2">
                      Government hostels for SC, ST, BC, and minority students are available near the college. Contact the office for details on application process and availability.
                    </p>
                  </div>
                  
                  <div className="bg-[#362222] p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-white">How can I apply for scholarships?</h3>
                    <p className="text-gray-300 mt-2">
                      Eligible students can apply for state government scholarships through the ePASS portal. The college office provides guidance for the application process during admissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact; 