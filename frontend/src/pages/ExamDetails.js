import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const ExamDetails = () => {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [marks, setMarks] = useState({});
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const data = await examService.getExam(examId);
        setExam(data);
        setMarks(data.subjects);
      } catch (err) {
        setError('Failed to fetch exam details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchExam();
    }
  }, [examId]);

  const handleGoBack = () => {
    navigate('/exam-management');
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      // When entering edit mode, initialize marks with current values
      setMarks({...exam.subjects});
    }
  };

  const handleMarkChange = (subject, value) => {
    // Ensure the mark is a valid number between 0-100
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      value = 0;
    } else if (numValue > 100) {
      value = 100;
    }
    
    setMarks({
      ...marks,
      [subject]: parseInt(value, 10)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const updateData = {
        subjects: marks
      };
      
      const updatedExam = await examService.updateExam(examId, updateData);
      setExam(updatedExam);
      setSuccess('Exam record updated successfully');
      setEditMode(false);
    } catch (err) {
      setError(err.detail || 'Failed to update exam record');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !exam) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="max-w-md p-8 rounded-2xl shadow-xl border bg-[#2B2B2B] border-[#423F3E]">
          <h2 className="text-2xl font-bold mb-4 text-white">Error</h2>
          <p className="text-gray-300">{error}</p>
          <Button 
            className="mt-6 bg-[#423F3E] hover:bg-[#544E4E] text-white" 
            onClick={handleGoBack}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="max-w-md p-8 rounded-2xl shadow-xl border bg-[#2B2B2B] border-[#423F3E]">
          <h2 className="text-2xl font-bold mb-4 text-white">Exam Not Found</h2>
          <p className="text-gray-300">The exam record you're looking for does not exist.</p>
          <Button 
            className="mt-6 bg-[#423F3E] hover:bg-[#544E4E] text-white" 
            onClick={handleGoBack}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  // Format the exam type for display
  const formatExamType = (type) => {
    if (type === 'ut1') return 'Unit Test 1 (UT1)';
    if (type === 'ut2') return 'Unit Test 2 (UT2)';
    if (type === 'ut3') return 'Unit Test 3 (UT3)';
    if (type === 'ut4') return 'Unit Test 4 (UT4)';
    if (type === 'half-yearly') return 'Half Yearly';
    if (type === 'final') return 'Final';
    return type.toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <button 
              className="p-2 mr-4 bg-[#423F3E] rounded text-white hover:bg-[#544E4E]"
              onClick={handleGoBack}
              aria-label="Go back"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-white">Exam Details</h1>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {formatExamType(exam.exam_type)}
              </h2>
              <Button 
                onClick={handleEditToggle}
                className={editMode ? 
                  "bg-gray-600 hover:bg-gray-700 text-white" : 
                  "bg-[#423F3E] hover:bg-[#544E4E] text-white"}
              >
                {editMode ? 'Cancel Edit' : 'Edit Marks'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Student Information</h3>
                <div className="bg-[#362222] p-4 rounded space-y-2">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="ml-2 text-white">{exam.student_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Admission Number:</span>
                    <span className="ml-2 text-white">{exam.admission_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Year:</span>
                    <span className="ml-2 text-white">{exam.year}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Group:</span>
                    <span className="ml-2 text-white uppercase">{exam.group}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Exam Results</h3>
                <div className="bg-[#362222] p-4 rounded space-y-2">
                  <div>
                    <span className="text-gray-400">Total Marks:</span>
                    <span className="ml-2 text-white">{exam.total_marks}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Percentage:</span>
                    <span className="ml-2 text-white">{exam.percentage.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date:</span>
                    <span className="ml-2 text-white">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Subject Marks</h3>
              
              {editMode ? (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {Object.entries(marks).map(([subject, mark]) => (
                      <div key={subject} className="bg-[#362222] p-3 rounded">
                        <label className="block text-gray-300 mb-1 capitalize">
                          {subject.replace('_', '/')}
                        </label>
                        <input 
                          type="number" 
                          className="w-full p-2 bg-[#423F3E] text-white border border-[#544E4E] rounded"
                          min="0"
                          max="100"
                          value={mark}
                          onChange={(e) => handleMarkChange(subject, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      className="bg-[#423F3E] hover:bg-[#544E4E] text-white"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(exam.subjects).map(([subject, mark]) => (
                    <div key={subject} className="bg-[#362222] p-3 rounded flex justify-between">
                      <span className="text-gray-300 capitalize">{subject.replace('_', '/')}</span>
                      <span className="text-white font-medium">{mark}/100</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamDetails; 