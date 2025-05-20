import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

const Academic = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#423F3E]">
            <div>
              <h1 className="text-3xl font-bold text-white">Academic Programs</h1>
              <p className="mt-2 text-gray-300">Excellence in Junior College Education</p>
            </div>
          </div>
          
          {/* Overview Section */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">About Our Academic Programs</h2>
            <p className="text-gray-300 mb-4">
              Government Junior College, Vemulawada was established in 1981 and is one of the premier educational institutions in Rajanna Sircilla District, Telangana. We are committed to providing quality education and comprehensive development for students pursuing their intermediate education.
            </p>
            <p className="text-gray-300">
              Our college offers various intermediate groups catering to diverse student interests and future career paths, with a focus on academic excellence, practical learning, and holistic development.
            </p>
          </div>
          
          {/* Groups Offered */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Groups Offered</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">MPC Group</h3>
                <p className="text-gray-300 mb-3">Mathematics, Physics, Chemistry</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                  <li>Ideal for Engineering aspirants</li>
                  <li>Focus on problem-solving skills</li>
                  <li>Practical laboratory experience</li>
                  <li>Preparation for JEE, EAMCET</li>
                </ul>
              </div>
              
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">BiPC Group</h3>
                <p className="text-gray-300 mb-3">Biology, Physics, Chemistry</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                  <li>Pathway to Medical and Life Sciences</li>
                  <li>Modern biology laboratory</li>
                  <li>Extensive practical training</li>
                  <li>Preparation for NEET, EAMCET</li>
                </ul>
              </div>
              
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">CEC Group</h3>
                <p className="text-gray-300 mb-3">Commerce, Economics, Civics</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                  <li>Foundation for Commerce careers</li>
                  <li>Business and financial education</li>
                  <li>Economic principles and practices</li>
                  <li>Career paths in Business, CA, Banking</li>
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">HEC Group</h3>
                <p className="text-gray-300 mb-3">History, Economics, Civics</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                  <li>Focus on Humanities and Social Sciences</li>
                  <li>Historical and political understanding</li>
                  <li>Economic fundamentals</li>
                  <li>Preparation for Civil Services</li>
                </ul>
              </div>
              
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">Vocational Groups</h3>
                <p className="text-gray-300 mb-3">Specialized skill-based education</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                  <li>T&HM (Travel & Hospitality Management)</li>
                  <li>MPHW (Multi Purpose Health Worker)</li>
                  <li>OAS (Office Administration & Stenography)</li>
                  <li>Practical training for direct employment</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Medium of Instruction */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Medium of Instruction</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">Telugu Medium</h3>
                <p className="text-gray-300">
                  Our college offers comprehensive education in Telugu medium, providing students with the comfort of learning in their native language. All subjects are taught by experienced faculty members who specialize in Telugu medium instruction.
                </p>
              </div>
              
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">English Medium</h3>
                <p className="text-gray-300">
                  For students preferring to study in English, we offer English medium instruction across all groups. This option helps students prepare for higher education in English medium institutions and builds their confidence in the language.
                </p>
              </div>
            </div>
          </div>
          
          {/* Academic Facilities */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Academic Facilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">Science Laboratories</h3>
                <p className="text-gray-300 mb-2">
                  The college is equipped with well-maintained laboratories for Physics, Chemistry, and Biology, providing students with hands-on practical experience.
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                  <li>Modern equipment and apparatus</li>
                  <li>Trained lab assistants</li>
                  <li>Regular practical sessions</li>
                </ul>
              </div>
              
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">Library</h3>
                <p className="text-gray-300 mb-2">
                  Our college library houses an extensive collection of textbooks, reference books, journals, and magazines to support students' academic needs.
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                  <li>Over 5,000 books across subjects</li>
                  <li>Reading room facility</li>
                  <li>Subject-specific reference materials</li>
                </ul>
              </div>
              
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">Classrooms</h3>
                <p className="text-gray-300 mb-2">
                  Spacious and well-ventilated classrooms provide an ideal learning environment for students across all groups.
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                  <li>Adequate seating capacity</li>
                  <li>Blackboards and teaching aids</li>
                  <li>Proper lighting and ventilation</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Examination System */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Examination System</h2>
            <p className="text-gray-300 mb-4">
              The college follows the examination system prescribed by the Board of Intermediate Education, Telangana. This includes:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">Internal Assessment</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 pl-2">
                  <li>Regular unit tests throughout the academic year</li>
                  <li>Quarterly examinations</li>
                  <li>Half-yearly examinations</li>
                  <li>Pre-final examinations</li>
                  <li>Practical examinations for science subjects</li>
                </ul>
              </div>
              
              <div className="bg-[#362222] p-5 rounded-lg">
                <h3 className="text-xl font-medium text-white mb-3">External Examinations</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2 pl-2">
                  <li>First-year Intermediate Public Examinations (IPE)</li>
                  <li>Second-year Intermediate Public Examinations (IPE)</li>
                  <li>Conducted by the Board of Intermediate Education</li>
                  <li>Practical examinations for science subjects</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Faculty */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Our Faculty</h2>
            <p className="text-gray-300 mb-4">
              Our college is proud to have a team of dedicated and experienced faculty members who are committed to providing quality education. The faculty members are:
            </p>
            <ul className="text-gray-300 space-y-2 pl-2">
              <li>• Highly qualified with relevant academic credentials</li>
              <li>• Experienced in teaching intermediate syllabus</li>
              <li>• Regularly updated with the latest teaching methodologies</li>
              <li>• Dedicated to providing individual attention to students</li>
              <li>• Focused on preparing students for competitive examinations</li>
            </ul>
          </div>
          
          {/* Academic Calendar */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Academic Calendar 2024-25</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[#171010] border border-[#423F3E] divide-y divide-[#423F3E]">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-[#423F3E]">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Academic Activities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#423F3E]">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">June</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Commencement of academic year, Admissions, Bridge Course</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">July</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Regular classes, First Unit Test</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">August</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Independence Day celebrations, Second Unit Test</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">September</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Teachers' Day celebrations, Quarterly Examinations</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">October</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Dasara vacation, Third Unit Test after vacation</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">November</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Children's Day celebrations, Fourth Unit Test</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">December</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Half-yearly Examinations, Winter vacation</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">January</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Republic Day celebrations, Fifth Unit Test</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">February</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Pre-final Examinations, Practical Examinations for second-year students</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">March</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Board Examinations for second-year students, Final preparations for first-year students</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 border-r border-[#423F3E]">April</td>
                    <td className="px-6 py-4 text-sm text-gray-300">Board Examinations for first-year students, Commencement of summer vacation</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-400 mt-4 text-sm italic">
              * The academic calendar is subject to change based on government directives and Board of Intermediate Education schedules.
            </p>
          </div>
          
          <div className="flex justify-center mt-8">
            <Link to="/contact">
              <button className="px-6 py-3 bg-[#362222] text-white rounded-lg hover:bg-[#423F3E] transition duration-200">
                Contact Us for Admissions
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Academic; 