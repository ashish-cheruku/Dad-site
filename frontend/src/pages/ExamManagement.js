import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examService, studentService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExamManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [examType, setExamType] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState({});
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    year: '',
    group: '',
    medium: ''
  });
  
  // Filter options
  const yearOptions = [1, 2, 3];
  const groupOptions = ['mpc', 'bipc', 'cec', 'hec', 'thm', 'oas', 'mphw', 'other'];
  const mediumOptions = ['english', 'telugu'];
  
  const navigate = useNavigate();

  // Get all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await studentService.getAllStudents();
        setStudents(data);
        setFilteredStudents(data);
      } catch (err) {
        setError('Failed to fetch students');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    if (!students.length) return;
    
    let filtered = [...students];
    
    // Apply year filter
    if (filters.year) {
      filtered = filtered.filter(student => student.year === parseInt(filters.year, 10));
    }
    
    // Apply group filter
    if (filters.group) {
      filtered = filtered.filter(student => student.group === filters.group);
    }
    
    // Apply medium filter
    if (filters.medium) {
      filtered = filtered.filter(student => student.medium === filters.medium);
    }
    
    setFilteredStudents(filtered);
  }, [filters, students]);

  // Get exam data for selected student
  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedStudent) return;
      
      try {
        setLoading(true);
        const data = await examService.getStudentExams(selectedStudent.id);
        setExamData(data);
        
        // Get subjects for the student's group
        const subjectsData = await examService.getSubjectsForGroup(selectedStudent.group);
        setSubjects(subjectsData.subjects);
        
        // Initialize marks object with empty values
        const initialMarks = {};
        subjectsData.subjects.forEach(subject => {
          initialMarks[subject] = '';
        });
        setMarks(initialMarks);
      } catch (err) {
        setError('Failed to fetch exam data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedStudent) {
      fetchExams();
    }
  }, [selectedStudent]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      year: '',
      group: '',
      medium: ''
    });
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setFormVisible(false);
    setSuccess('');
    setError('');
  };

  const handleNewExam = () => {
    setFormVisible(true);
    setExamType('');
    
    // Reset marks
    const initialMarks = {};
    subjects.forEach(subject => {
      initialMarks[subject] = '';
    });
    setMarks(initialMarks);
    
    setSuccess('');
    setError('');
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
      [subject]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !examType) {
      setError('Please select a student and exam type');
      return;
    }
    
    // Convert marks to integers
    const marksData = {};
    Object.entries(marks).forEach(([subject, mark]) => {
      marksData[subject] = mark === '' ? 0 : parseInt(mark, 10);
    });
    
    try {
      setLoading(true);
      
      const examData = {
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        admission_number: selectedStudent.admission_number,
        year: selectedStudent.year,
        group: selectedStudent.group,
        exam_type: examType,
        subjects: marksData
      };
      
      await examService.createExam(examData);
      
      // Refresh exam data
      const data = await examService.getStudentExams(selectedStudent.id);
      setExamData(data);
      
      setSuccess('Exam record created successfully');
      setFormVisible(false);
    } catch (err) {
      setError(err.detail || 'Failed to create exam record');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam record?')) {
      return;
    }
    
    try {
      setLoading(true);
      await examService.deleteExam(examId);
      
      // Refresh exam data
      const data = await examService.getStudentExams(selectedStudent.id);
      setExamData(data);
      
      setSuccess('Exam record deleted successfully');
    } catch (err) {
      setError(err.detail || 'Failed to delete exam record');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format the exam type for display
  const formatExamType = (type) => {
    if (type === 'ut1') return 'UT1';
    if (type === 'ut2') return 'UT2';
    if (type === 'ut3') return 'UT3';
    if (type === 'ut4') return 'UT4';
    if (type === 'half-yearly') return 'HALF-YEARLY';
    if (type === 'final') return 'FINAL';
    return type.toUpperCase();
  };
  
  // Export exam data to Excel
  const exportToExcel = async () => {
    if (filteredStudents.length === 0) {
      setError('No students to export');
      return;
    }
    
    try {
      setLoading(true);
      
      // Basic headers for student information
      const headers = [
        'Admission Number',
        'Name',
        'Year',
        'Group',
        'Medium'
      ];
      
      // Add exam type headers - we'll fetch these dynamically
      const examTypes = ['UT1', 'UT2', 'UT3', 'UT4', 'HALF-YEARLY', 'FINAL'];
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // WORKSHEET 1: Student List with basic info
      const studentsData = [headers];
      
      // Add data for each student
      filteredStudents.forEach(student => {
        const studentRow = [
          student.admission_number,
          student.name,
          student.year,
          student.group.toUpperCase(),
          student.medium.charAt(0).toUpperCase() + student.medium.slice(1)
        ];
        
        studentsData.push(studentRow);
      });
      
      // Create students worksheet
      const wsStudents = XLSX.utils.aoa_to_sheet(studentsData);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');
      
      // BATCH FETCH all student exam data at once
      const studentIds = filteredStudents.map(student => student.id);
      const allExamsData = await examService.getBatchStudentExams(studentIds);
      
      // WORKSHEET 2: Exam Summary - for each student and each exam type
      let examSummaryData = [];
      
      // Create headers for exam summary
      const summaryHeaders = ['Admission Number', 'Name', 'Group', 'Exam Type', 'Total Marks', 'Percentage'];
      examSummaryData.push(summaryHeaders);
      
      // For each student, add their exam data to the summary
      filteredStudents.forEach(student => {
        const studentExams = allExamsData[student.id] || { exams: [] };
        
        if (studentExams.exams && studentExams.exams.length > 0) {
          studentExams.exams.forEach(exam => {
            examSummaryData.push([
              student.admission_number,
              student.name,
              student.group.toUpperCase(),
              formatExamType(exam.exam_type),
              exam.total_marks,
              exam.percentage.toFixed(2) + '%'
            ]);
          });
        }
      });
      
      // Create exam summary worksheet
      const wsSummary = XLSX.utils.aoa_to_sheet(examSummaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Exam Summary');
      
      // WORKSHEET 3+: Detailed Marks - one worksheet per exam type
      for (const examType of examTypes) {
        const examTypeData = [];
        const examTypeKey = examType.toLowerCase().replace('-', '_').replace('-yearly', '_yearly');
        
        // Create headers for detailed marks - admission number, name, and subjects
        let detailedHeaders = ['Admission Number', 'Name', 'Group'];
        
        // Flag to check if we have any data for this exam type
        let hasData = false;
        let subjectColumns = new Set();
        
        // First pass - collect all possible subject columns across all students
        filteredStudents.forEach(student => {
          const studentExams = allExamsData[student.id] || { exams: [] };
          
          if (studentExams.exams && studentExams.exams.length > 0) {
            const exam = studentExams.exams.find(e => 
              formatExamType(e.exam_type) === examType
            );
            
            if (exam) {
              hasData = true;
              Object.keys(exam.subjects).forEach(subject => {
                subjectColumns.add(subject);
              });
            }
          }
        });
        
        // If we have data for this exam type, create the worksheet
        if (hasData) {
          // Convert subject set to array and sort
          const subjectArray = Array.from(subjectColumns).sort();
          
          // Add subject columns to headers
          subjectArray.forEach(subject => {
            detailedHeaders.push(subject.replace('_', '/').toUpperCase());
          });
          
          // Add total and percentage columns
          detailedHeaders.push('TOTAL', 'PERCENTAGE');
          examTypeData.push(detailedHeaders);
          
          // Second pass - add student data rows
          filteredStudents.forEach(student => {
            const studentExams = allExamsData[student.id] || { exams: [] };
            
            const exam = studentExams.exams?.find(e => 
              formatExamType(e.exam_type) === examType
            );
            
            if (exam) {
              // Add student data
              const studentRow = [
                student.admission_number,
                student.name,
                student.group.toUpperCase()
              ];
              
              // Add subject marks in same order as headers
              subjectArray.forEach(subject => {
                studentRow.push(exam.subjects[subject] || 0);
              });
              
              // Add total and percentage
              studentRow.push(exam.total_marks);
              studentRow.push(exam.percentage.toFixed(2) + '%');
              
              examTypeData.push(studentRow);
            }
          });
          
          const wsExamType = XLSX.utils.aoa_to_sheet(examTypeData);
          XLSX.utils.book_append_sheet(wb, wsExamType, examType);
        }
      }
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(blob, `exam_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      setSuccess('Exam data exported successfully');
    } catch (err) {
      setError('Failed to export exam data: ' + (err.message || 'Unknown error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !students.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 pb-4 border-b border-[#423F3E]">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Exam Management</h1>
                <p className="mt-2 text-gray-300">
                  Manage student exam records and marks
                </p>
              </div>
              
              <Button
                onClick={exportToExcel}
                className="bg-[#423F3E] hover:bg-[#544E4E] text-white"
                disabled={filteredStudents.length === 0 || loading}
              >
                {loading ? 'Loading...' : 'Export to Excel'}
              </Button>
            </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student List with Filters */}
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4">
              <h2 className="text-xl font-semibold mb-4 text-white">Students</h2>
              
              {/* Filter Controls */}
              <div className="mb-4 bg-[#362222] p-3 rounded">
                <h3 className="text-white text-lg mb-2">Filters</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Year</label>
                    <select 
                      name="year" 
                      value={filters.year} 
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#423F3E] text-white border border-[#544E4E] rounded"
                    >
                      <option value="">All Years</option>
                      {yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Group</label>
                    <select 
                      name="group" 
                      value={filters.group} 
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#423F3E] text-white border border-[#544E4E] rounded"
                    >
                      <option value="">All Groups</option>
                      {groupOptions.map(group => (
                        <option key={group} value={group}>{group.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Medium</label>
                    <select 
                      name="medium" 
                      value={filters.medium} 
                      onChange={handleFilterChange}
                      className="w-full p-2 bg-[#423F3E] text-white border border-[#544E4E] rounded"
                    >
                      <option value="">All Mediums</option>
                      {mediumOptions.map(medium => (
                        <option key={medium} value={medium}>{medium.charAt(0).toUpperCase() + medium.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={handleClearFilters}
                      className="w-full p-2 bg-[#423F3E] hover:bg-[#544E4E] text-white text-sm rounded"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Student List */}
              {filteredStudents.length === 0 ? (
                <p className="text-gray-400">No students found</p>
              ) : (
                <div className="overflow-y-auto max-h-[400px]">
                  <p className="text-gray-400 mb-2 text-sm">Found {filteredStudents.length} students</p>
                  <ul className="space-y-2">
                    {filteredStudents.map((student) => (
                      <li 
                        key={student.id} 
                        className={`p-3 rounded cursor-pointer ${
                          selectedStudent?.id === student.id 
                            ? 'bg-[#423F3E] text-white' 
                            : 'bg-[#362222] text-gray-300 hover:bg-[#423F3E] hover:text-white'
                        }`}
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm">
                          <span className="mr-2">{student.admission_number}</span>
                          <span className="uppercase">{student.group}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Year: {student.year} | Medium: {student.medium.charAt(0).toUpperCase() + student.medium.slice(1)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Exam Data */}
            <div className="md:col-span-2">
              {selectedStudent ? (
                <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      {selectedStudent.name} - Exams
                    </h2>
                    <Button 
                      onClick={handleNewExam}
                      className="bg-[#423F3E] hover:bg-[#544E4E] text-white"
                    >
                      Add New Exam
                    </Button>
                  </div>
                  
                  {formVisible && (
                    <div className="mb-6 bg-[#362222] p-4 rounded">
                      <h3 className="text-lg font-medium text-white mb-3">New Exam Record</h3>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                          <label className="block text-gray-300 mb-2">Exam Type</label>
                          <select 
                            className="w-full p-2 bg-[#423F3E] text-white border border-[#544E4E] rounded"
                            value={examType}
                            onChange={(e) => setExamType(e.target.value)}
                            required
                          >
                            <option value="">Select Exam Type</option>
                            <option value="ut1">Unit Test 1 (UT1)</option>
                            <option value="ut2">Unit Test 2 (UT2)</option>
                            <option value="ut3">Unit Test 3 (UT3)</option>
                            <option value="ut4">Unit Test 4 (UT4)</option>
                            <option value="half-yearly">Half Yearly</option>
                            <option value="final">Final</option>
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-white mb-2">Subject Marks (0-100)</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subjects.map((subject) => (
                              <div key={subject} className="mb-2">
                                <label className="block text-gray-300 mb-1 capitalize">
                                  {subject.replace('_', '/')}
                                </label>
                                <input 
                                  type="number" 
                                  className="w-full p-2 bg-[#423F3E] text-white border border-[#544E4E] rounded"
                                  min="0"
                                  max="100"
                                  value={marks[subject]}
                                  onChange={(e) => handleMarkChange(subject, e.target.value)}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button"
                            className="bg-transparent border border-[#423F3E] text-white hover:bg-[#423F3E]/20"
                            onClick={() => setFormVisible(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            className="bg-[#423F3E] hover:bg-[#544E4E] text-white"
                            disabled={loading}
                          >
                            {loading ? 'Saving...' : 'Save Exam'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {examData?.exams.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-[#423F3E]">
                          <tr>
                            <th className="px-4 py-3 text-white">Exam Type</th>
                            <th className="px-4 py-3 text-white">Total Marks</th>
                            <th className="px-4 py-3 text-white">Percentage</th>
                            <th className="px-4 py-3 text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examData.exams.map((exam) => (
                            <tr key={exam.id} className="border-b border-[#423F3E] hover:bg-[#362222]">
                              <td className="px-4 py-3 text-gray-300">{formatExamType(exam.exam_type)}</td>
                              <td className="px-4 py-3 text-gray-300">{exam.total_marks}</td>
                              <td className="px-4 py-3 text-gray-300">{exam.percentage.toFixed(2)}%</td>
                              <td className="px-4 py-3 text-gray-300">
                                <div className="flex space-x-2">
                                  <button 
                                    className="px-3 py-1 bg-[#423F3E] hover:bg-[#544E4E] text-white rounded text-sm"
                                    onClick={() => {
                                      navigate(`/exam-details/${exam.id}`);
                                    }}
                                  >
                                    View
                                  </button>
                                  <button 
                                    className="px-3 py-1 bg-red-900/70 hover:bg-red-800 text-white rounded text-sm"
                                    onClick={() => handleDeleteExam(exam.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 py-4">No exam records found for this student</p>
                  )}
                </div>
              ) : (
                <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 flex items-center justify-center">
                  <p className="text-gray-400">Select a student to view exam records</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamManagement; 