import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { studentService, attendanceService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterMedium, setFilterMedium] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected students for bulk operations
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  
  // Student info page state
  const [showStudentInfo, setShowStudentInfo] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState('2024-2025');
  const [selectedMonth, setSelectedMonth] = useState('january');

  // View mode state (normal list or comprehensive table)
  const [viewMode, setViewMode] = useState('list');
  
  // Student attendance for comprehensive view
  const [studentsWithAttendance, setStudentsWithAttendance] = useState([]);
  const [loadingComprehensiveData, setLoadingComprehensiveData] = useState(false);
  const [allMonthsAttendance, setAllMonthsAttendance] = useState({});

  // New student form state
  const [newStudent, setNewStudent] = useState({
    admission_number: '',
    year: 1,
    group: 'mpc',
    medium: 'english',
    name: '',
    father_name: '',
    date_of_birth: '',
    caste: '',
    gender: 'male',
    aadhar_number: '',
    student_phone: '',
    parent_phone: ''
  });

  // Months for attendance data
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june', 
    'july', 'august', 'september', 'october', 'november', 'december'
  ];

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const year = filterYear ? parseInt(filterYear) : null;
      const group = filterGroup || null;
      const medium = filterMedium || null;
      
      const data = await studentService.getAllStudents(year, group, medium);
      
      // Apply client-side search filtering if search term exists
      let filteredData = data;
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        filteredData = data.filter(student => 
          student.name.toLowerCase().includes(term) || 
          student.admission_number.toLowerCase().includes(term) ||
          student.father_name?.toLowerCase().includes(term) ||
          (student.aadhar_number && student.aadhar_number.toLowerCase().includes(term))
        );
      }
      
      setStudents(filteredData);
      
      // If in comprehensive view, fetch attendance data for all students
      if (viewMode === 'table') {
        await fetchAllStudentsAttendance(filteredData);
      }
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterGroup, filterMedium, searchTerm, viewMode]);
  
  // Fetch attendance data for all students in the list
  const fetchAllStudentsAttendance = useCallback(async (studentsList) => {
    try {
      setLoadingComprehensiveData(true);
      const studentsData = [...studentsList];
      const allAttendanceData = {};
      
      // Process students in larger batches to reduce the number of render cycles
      const batchSize = 10; // Increased from 3 to 10
      
      // Create a month-student mapping to optimize API calls
      const monthsToFetch = {};
      
      // Initialize all student attendance data
      for (const student of studentsData) {
        student.monthlyAttendance = {};
        allAttendanceData[student.id] = {};
        
        // Only fetch attendance for January initially (to show something quickly)
        monthsToFetch[student.id] = ['january'];
      }
      
      // Set initial data with just January to show something quickly
      setStudentsWithAttendance(studentsData);
      setAllMonthsAttendance(allAttendanceData);
      
      // Process initial batch with just January data
      for (let i = 0; i < studentsData.length; i += batchSize) {
        const batch = studentsData.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (student) => {
            try {
              const monthToFetch = 'january';
              const attendanceData = await attendanceService.getStudentAttendance(
                student.id,
                currentAcademicYear,
                monthToFetch
              );
              
              // Store in student object
              student.monthlyAttendance[monthToFetch] = {
                working_days: attendanceData.working_days || 0,
                days_present: attendanceData.days_present || 0,
                attendance_percentage: attendanceData.attendance_percentage || 0
              };
              
              // Also store in global state
              allAttendanceData[student.id][monthToFetch] = {
                working_days: attendanceData.working_days || 0,
                days_present: attendanceData.days_present || 0,
                attendance_percentage: attendanceData.attendance_percentage || 0
              };
            } catch (error) {
              console.error(`Error fetching attendance for student ${student.id}:`, error);
              student.monthlyAttendance['january'] = {
                working_days: 0,
                days_present: 0,
                attendance_percentage: 0
              };
              allAttendanceData[student.id]['january'] = {
                working_days: 0,
                days_present: 0,
                attendance_percentage: 0
              };
            }
            
            // Calculate initial annual summary based on just January
            calculateStudentAnnualSummary(student);
          })
        );
        
        // Update state after each batch to show progress
        setStudentsWithAttendance([...studentsData]);
        setAllMonthsAttendance({...allAttendanceData});
      }
      
      // Mark that initial data is loaded
      setLoadingComprehensiveData(false);
      
      // Now fetch the rest of the months in the background
      fetchRemainingMonthsData(studentsData, allAttendanceData);
      
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setLoadingComprehensiveData(false);
    }
  }, [currentAcademicYear]);
  
  // Helper function to calculate annual summary for a student
  const calculateStudentAnnualSummary = (student) => {
    let totalWorkingDays = 0;
    let totalDaysPresent = 0;
    let totalMonthsWithData = 0;
    
    for (const month of months) {
      const monthData = student.monthlyAttendance[month];
      if (monthData && monthData.working_days > 0) {
        totalWorkingDays += monthData.working_days;
        totalDaysPresent += monthData.days_present;
        totalMonthsWithData++;
      }
    }
    
    // Add annual summary to student object
    student.attendance = {
      working_days: totalWorkingDays,
      days_present: totalDaysPresent,
      attendance_percentage: totalWorkingDays > 0 
        ? (totalDaysPresent / totalWorkingDays) * 100 
        : 0
    };
  };
  
  // Fetch the rest of the months' data in the background after showing initial data
  const fetchRemainingMonthsData = async (studentsData, allAttendanceData) => {
    const batchSize = 5; // Process 5 students at a time
    const remainingMonths = months.filter(month => month !== 'january');
    
    try {
      // Process students in batches
      for (let i = 0; i < studentsData.length; i += batchSize) {
        const studentBatch = studentsData.slice(i, i + batchSize);
        
        // For each student in the batch, fetch all remaining months
        await Promise.all(
          studentBatch.map(async (student) => {
            // Process each remaining month
            await Promise.all(
              remainingMonths.map(async (month) => {
                try {
                  const attendanceData = await attendanceService.getStudentAttendance(
                    student.id,
                    currentAcademicYear,
                    month
                  );
                  
                  // Store in student object
                  student.monthlyAttendance[month] = {
                    working_days: attendanceData.working_days || 0,
                    days_present: attendanceData.days_present || 0,
                    attendance_percentage: attendanceData.attendance_percentage || 0
                  };
                  
                  // Also store in global state
                  allAttendanceData[student.id][month] = {
                    working_days: attendanceData.working_days || 0,
                    days_present: attendanceData.days_present || 0,
                    attendance_percentage: attendanceData.attendance_percentage || 0
                  };
                } catch (error) {
                  console.error(`Error fetching attendance for student ${student.id} month ${month}:`, error);
                  student.monthlyAttendance[month] = {
                    working_days: 0,
                    days_present: 0,
                    attendance_percentage: 0
                  };
                  allAttendanceData[student.id][month] = {
                    working_days: 0,
                    days_present: 0,
                    attendance_percentage: 0
                  };
                }
              })
            );
            
            // Recalculate annual summary with all months
            calculateStudentAnnualSummary(student);
          })
        );
        
        // Update the state after each batch to show progress
        setStudentsWithAttendance([...studentsData]);
        setAllMonthsAttendance({...allAttendanceData});
      }
    } catch (err) {
      console.error('Error fetching remaining months data:', err);
    }
  };
  
  // Fetch student details and attendance
  const fetchStudentDetails = async (studentId) => {
    try {
      setLoading(true);
      const studentData = await studentService.getStudent(studentId);
      setStudentDetails(studentData);
      
      // Fetch attendance data
      await fetchStudentAttendance(studentId);
      
      setShowStudentInfo(true);
    } catch (err) {
      setError('Failed to fetch student details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch student attendance
  const fetchStudentAttendance = useCallback(async (studentId) => {
    try {
      setLoadingAttendance(true);
      const attendanceData = await attendanceService.getStudentAttendance(
        studentId,
        currentAcademicYear,
        selectedMonth
      );
      setStudentAttendance(attendanceData);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoadingAttendance(false);
    }
  }, [currentAcademicYear, selectedMonth]);

  // Fetch students on component mount and when filters change
  useEffect(() => {
    fetchStudents();
  }, [filterYear, filterGroup, filterMedium, fetchStudents]);
  
  // Refetch attendance data when view mode or academic year changes
  useEffect(() => {
    if (viewMode === 'table' && students.length > 0) {
      fetchAllStudentsAttendance(students);
    }
  }, [viewMode, currentAcademicYear, students, fetchAllStudentsAttendance]);

  // Refetch attendance when month or academic year changes for individual student view
  useEffect(() => {
    if (studentDetails && showStudentInfo) {
      fetchStudentAttendance(studentDetails.id);
    }
  }, [selectedMonth, currentAcademicYear, studentDetails, showStudentInfo, fetchStudentAttendance]);

  // Memoize the filtered students in the table view for better performance
  const filteredStudentsWithAttendance = useMemo(() => {
    if (viewMode !== 'table') return [];
    
    // Return the full list of students with attendance data
    return studentsWithAttendance;
  }, [studentsWithAttendance, viewMode]);

  // Handle input change for new/edit student form
  const handleStudentInputChange = (e, isNew = true) => {
    const { name, value } = e.target;
    if (isNew) {
      setNewStudent({
        ...newStudent,
        [name]: value
      });
    } else {
      setCurrentStudent({
        ...currentStudent,
        [name]: value
      });
    }
  };

  // Handle checkbox selection for bulk actions
  const handleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Handle select all checkbox
  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student.id));
    }
  };

  // Handle bulk delete action
  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      
      // Delete each selected student one by one
      for (const studentId of selectedStudents) {
        await studentService.deleteStudent(studentId);
      }
      
      setIsBulkDeleteModalOpen(false);
      setSelectedStudents([]);
      fetchStudents();
    } catch (err) {
      setError('Failed to delete selected students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk action selection
  const handleBulkAction = (action) => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }
    
    if (action === 'delete') {
      setIsBulkDeleteModalOpen(true);
    }
  };

  // Create new student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      await studentService.createStudent(newStudent);
      setIsAddModalOpen(false);
      setNewStudent({
        admission_number: '',
        year: 1,
        group: 'mpc',
        medium: 'english',
        name: '',
        father_name: '',
        date_of_birth: '',
        caste: '',
        gender: 'male',
        aadhar_number: '',
        student_phone: '',
        parent_phone: ''
      });
      fetchStudents();
    } catch (err) {
      console.error(err);
      if (err.detail) {
        // Check for specific validation errors
        if (err.detail.includes('admission number already exists')) {
          setError('A student with this admission number already exists. Please use a unique admission number.');
        } else if (err.detail.includes('Aadhar number already exists')) {
          setError('A student with this Aadhar number already exists. Please check and correct the Aadhar number.');
        } else {
          setError(err.detail || 'Failed to create student');
        }
      } else {
        setError('Failed to create student');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update student
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      await studentService.updateStudent(currentStudent.id, currentStudent);
      setIsEditModalOpen(false);
      fetchStudents();
      
      // Update student details if viewing the same student
      if (studentDetails && studentDetails.id === currentStudent.id) {
        setStudentDetails(currentStudent);
      }
    } catch (err) {
      console.error(err);
      if (err.detail) {
        // Check for specific validation errors
        if (err.detail.includes('admission number already exists')) {
          setError('A student with this admission number already exists. Please use a unique admission number.');
        } else if (err.detail.includes('Aadhar number already exists')) {
          setError('A student with this Aadhar number already exists. Please check and correct the Aadhar number.');
        } else {
          setError(err.detail || 'Failed to update student');
        }
      } else {
        setError('Failed to update student');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const handleDeleteStudent = async () => {
    try {
      setLoading(true);
      await studentService.deleteStudent(currentStudent.id);
      setIsDeleteModalOpen(false);
      
      // Close student info if viewing the deleted student
      if (studentDetails && studentDetails.id === currentStudent.id) {
        setShowStudentInfo(false);
        setStudentDetails(null);
      }
      
      fetchStudents();
    } catch (err) {
      setError('Failed to delete student');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Capitalize first letter
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Export student data to Excel
  const exportToExcel = () => {
    // Only export if there are students
    if (students.length === 0) {
      setError('No students to export');
      return;
    }

    try {
      // Define if we're exporting basic student info or comprehensive data with attendance
      const isComprehensiveExport = viewMode === 'table';
      
      // Basic headers for student information
      const headers = [
        'Admission Number',
        'Name',
        'Year',
        'Group',
        'Medium',
        'Father Name',
        'Date of Birth',
        'Caste',
        'Gender',
        'Aadhar Number',
        'Student Phone',
        'Parent Phone'
      ];
      
      let data = [];
      
      if (isComprehensiveExport && studentsWithAttendance.length > 0) {
        // For comprehensive view, include attendance data
        const attendanceHeaders = [];
        
        // Add month headers for attendance (P, W, %)
        months.forEach(month => {
          attendanceHeaders.push(`${capitalize(month)} - Present`);
          attendanceHeaders.push(`${capitalize(month)} - Working Days`);
          attendanceHeaders.push(`${capitalize(month)} - Percentage`);
        });
        
        // Add annual summary header
        attendanceHeaders.push('Annual Attendance %');
        
        // Combine all headers
        const allHeaders = [...headers, ...attendanceHeaders];
        
        // Add headers row
        data.push(allHeaders);
        
        // Add data for each student with attendance
        studentsWithAttendance.forEach(student => {
          const studentRow = [
            student.admission_number,
            student.name,
            student.year,
            capitalize(student.group),
            capitalize(student.medium),
            student.father_name || '',
            formatDate(student.date_of_birth) || '',
            student.caste || '',
            capitalize(student.gender) || '',
            student.aadhar_number || '',
            student.student_phone || '',
            student.parent_phone || ''
          ];
          
          // Add attendance data for each month
          months.forEach(month => {
            const monthData = student.monthlyAttendance?.[month] || {
              days_present: 0,
              working_days: 0,
              attendance_percentage: 0
            };
            
            studentRow.push(monthData.days_present);
            studentRow.push(monthData.working_days);
            studentRow.push(monthData.attendance_percentage ? 
              Number(monthData.attendance_percentage.toFixed(1)) : 0);
          });
          
          // Add annual attendance percentage
          studentRow.push(student.attendance?.attendance_percentage ? 
            Number(student.attendance.attendance_percentage.toFixed(1)) : 0);
          
          data.push(studentRow);
        });
      } else {
        // For basic view, just include student info
        // Add headers row
        data.push(headers);
        
        // Add data for each student
        students.forEach(student => {
          const studentRow = [
            student.admission_number,
            student.name,
            student.year,
            capitalize(student.group),
            capitalize(student.medium),
            student.father_name || '',
            formatDate(student.date_of_birth) || '',
            student.caste || '',
            capitalize(student.gender) || '',
            student.aadhar_number || '',
            student.student_phone || '',
            student.parent_phone || ''
          ];
          
          data.push(studentRow);
        });
      }
      
      // Create worksheet from data
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      const colWidths = [];
      headers.forEach(() => colWidths.push({ wch: 15 })); // Standard width for basic columns
      
      if (isComprehensiveExport) {
        months.forEach(() => {
          colWidths.push({ wch: 10 }); // Width for present
          colWidths.push({ wch: 10 }); // Width for working days
          colWidths.push({ wch: 10 }); // Width for percentage
        });
        colWidths.push({ wch: 15 }); // Width for annual
      }
      
      ws['!cols'] = colWidths;
      
      // Create workbook and add the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb, 
        ws, 
        isComprehensiveExport ? 'Students with Attendance' : 'Students'
      );
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(
        blob, 
        `students_export_${viewMode === 'table' ? 'with_attendance_' : ''}${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      setError('Failed to export student data');
      console.error(err);
    }
  };

  // Old CSV export function kept for reference or backup
  const exportToCSV = () => {
    // Only export if there are students
    if (students.length === 0) {
      setError('No students to export');
      return;
    }

    try {
      // Define CSV headers based on student properties
      const headers = [
        'Admission Number',
        'Name',
        'Year',
        'Group',
        'Medium',
        'Father Name',
        'Date of Birth',
        'Caste',
        'Gender',
        'Aadhar Number',
        'Student Phone',
        'Parent Phone'
      ];

      // Convert student data to CSV format
      const csvData = students.map(student => [
        student.admission_number,
        student.name,
        student.year,
        capitalize(student.group),
        capitalize(student.medium),
        student.father_name || '',
        formatDate(student.date_of_birth) || '',
        student.caste || '',
        capitalize(student.gender) || '',
        student.aadhar_number || '',
        student.student_phone || '',
        student.parent_phone || ''
      ]);

      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      csvContent += csvData.map(row => 
        row.map(cell => {
          // Handle cells that may contain commas or quotes
          if (cell && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      ).join('\n');

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `students_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to export student data');
      console.error(err);
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-[#171010]">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
        </div>
      </div>
    );
  }

  // If showing student info, render detailed student view
  if (showStudentInfo && studentDetails) {
    return (
      <div className="min-h-screen flex flex-col bg-[#171010]">
        <Navbar />
        
        <main className="flex-1 container py-8 mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#423F3E]">
              <div>
                <h1 className="text-3xl font-bold text-white">Student Information</h1>
                <p className="mt-2 text-gray-300">Comprehensive details and attendance records</p>
              </div>
              <Button 
                onClick={() => {
                  setShowStudentInfo(false);
                  setStudentDetails(null);
                }}
                className="py-2 px-4 rounded-lg"
                style={{ backgroundColor: '#362222', color: 'white' }}
              >
                Back to Student List
              </Button>
            </div>
            
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            {/* Student Details Card */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {/* Personal Info */}
              <div className="col-span-1 bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="h-24 w-24 rounded-full bg-[#362222] flex items-center justify-center text-3xl font-bold text-white mb-4">
                    {studentDetails.name.charAt(0)}
                  </div>
                  <h2 className="text-xl font-semibold text-white text-center">{studentDetails.name}</h2>
                  <p className="text-gray-400 text-center">{studentDetails.admission_number}</p>
                </div>
                
                <div className="border-t border-[#423F3E] pt-4 mt-2">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Year:</span>
                    <span className="text-white font-medium">{studentDetails.year}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Group:</span>
                    <span className="text-white font-medium capitalize">{studentDetails.group}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Medium:</span>
                    <span className="text-white font-medium capitalize">{studentDetails.medium}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => {
                      setCurrentStudent(studentDetails);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full py-2 mt-4"
                    style={{ backgroundColor: '#362222', color: 'white' }}
                  >
                    Edit Student
                  </Button>
                </div>
              </div>
              
              {/* Detailed Info */}
              <div className="col-span-3 bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Detailed Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <h4 className="text-gray-400 text-sm">Father's Name</h4>
                    <p className="text-white font-medium">{studentDetails.father_name || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-400 text-sm">Date of Birth</h4>
                    <p className="text-white font-medium">{formatDate(studentDetails.date_of_birth) || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-400 text-sm">Gender</h4>
                    <p className="text-white font-medium capitalize">{studentDetails.gender || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-400 text-sm">Caste</h4>
                    <p className="text-white font-medium">{studentDetails.caste || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-400 text-sm">Aadhar Number</h4>
                    <p className="text-white font-medium">{studentDetails.aadhar_number || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-400 text-sm">Student Phone</h4>
                    <p className="text-white font-medium">{studentDetails.student_phone || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-400 text-sm">Parent Phone</h4>
                    <p className="text-white font-medium">{studentDetails.parent_phone || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-gray-400 text-sm">Created At</h4>
                    <p className="text-white font-medium">{formatDate(studentDetails.created_at) || 'Not available'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Attendance Section */}
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-4 md:mb-0">Attendance Record</h3>
                
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
                  <div>
                    <select
                      value={currentAcademicYear}
                      onChange={(e) => setCurrentAcademicYear(e.target.value)}
                      className="px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                    >
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                    </select>
                  </div>
                  
                  <div>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {capitalize(month)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {loadingAttendance ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-[#171010] rounded-lg p-4 border border-[#423F3E]">
                      <h4 className="text-gray-400 text-sm mb-2">Working Days</h4>
                      <p className="text-3xl font-bold text-white">{studentAttendance.working_days || 0}</p>
                    </div>
                    
                    <div className="bg-[#171010] rounded-lg p-4 border border-[#423F3E]">
                      <h4 className="text-gray-400 text-sm mb-2">Days Present</h4>
                      <p className="text-3xl font-bold text-white">{studentAttendance.days_present || 0}</p>
                    </div>
                    
                    <div className="bg-[#171010] rounded-lg p-4 border border-[#423F3E]">
                      <h4 className="text-gray-400 text-sm mb-2">Attendance Percentage</h4>
                      <p className={`text-3xl font-bold ${
                        studentAttendance.attendance_percentage >= 75 ? 'text-green-400' : 
                        studentAttendance.attendance_percentage >= 50 ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}>
                        {studentAttendance.attendance_percentage ? `${studentAttendance.attendance_percentage.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-[#171010] rounded-lg p-4 border border-[#423F3E]">
                    <h4 className="text-white font-medium mb-2">Attendance Status</h4>
                    {studentAttendance.working_days ? (
                      <div className="w-full bg-[#362222] rounded-full h-4 overflow-hidden">
                        <div 
                          className={`h-full ${
                            studentAttendance.attendance_percentage >= 75 ? 'bg-green-500' : 
                            studentAttendance.attendance_percentage >= 50 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`}
                          style={{ width: `${studentAttendance.attendance_percentage || 0}%` }}
                        ></div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No attendance data available for this month</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        
        {/* Edit Student Modal */}
        {isEditModalOpen && currentStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-2xl w-full overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-bold text-white mb-4">Edit Student</h2>
              
              <form onSubmit={handleUpdateStudent}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Admission Number</label>
                    <input
                      type="text"
                      name="admission_number"
                      value={currentStudent.admission_number}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={currentStudent.name}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Year</label>
                    <select
                      name="year"
                      value={currentStudent.year}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Group</label>
                    <select
                      name="group"
                      value={currentStudent.group}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    >
                      <option value="mpc">MPC</option>
                      <option value="bipc">BiPC</option>
                      <option value="cec">CEC</option>
                      <option value="hec">HEC</option>
                      <option value="thm">T&HM</option>
                      <option value="oas">OAS</option>
                      <option value="mphw">MPHW</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Medium</label>
                    <select
                      name="medium"
                      value={currentStudent.medium}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    >
                      <option value="english">English</option>
                      <option value="telugu">Telugu</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Father's Name</label>
                    <input
                      type="text"
                      name="father_name"
                      value={currentStudent.father_name}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={currentStudent.date_of_birth}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Caste</label>
                    <input
                      type="text"
                      name="caste"
                      value={currentStudent.caste}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Gender</label>
                    <select
                      name="gender"
                      value={currentStudent.gender}
                      onChange={(e) => handleStudentInputChange(e, false)}
                      className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
              <h1 className="text-3xl font-bold text-white">Student Management</h1>
              <p className="mt-2 text-gray-300">Manage student information and records</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: '#362222', color: 'white' }}
            >
              Add New Student
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Filters */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">Filter Students</h3>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, admission number, father's name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchTerm && (
                  <button
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchTerm('')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Year</label>
                <select 
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                >
                  <option value="">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Group</label>
                <select 
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                >
                  <option value="">All Groups</option>
                  <option value="mpc">MPC</option>
                  <option value="bipc">BiPC</option>
                  <option value="cec">CEC</option>
                  <option value="hec">HEC</option>
                  <option value="thm">T&HM</option>
                  <option value="oas">OAS</option>
                  <option value="mphw">MPHW</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Medium</label>
                <select 
                  value={filterMedium}
                  onChange={(e) => setFilterMedium(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                >
                  <option value="">All Mediums</option>
                  <option value="english">English</option>
                  <option value="telugu">Telugu</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* View Mode Switch */}
          <div className="flex justify-between items-center mb-6">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  viewMode === 'list'
                    ? 'bg-[#362222] text-white'
                    : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#262626]'
                }`}
              >
                Basic List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  viewMode === 'table'
                    ? 'bg-[#362222] text-white'
                    : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#262626]'
                }`}
              >
                Comprehensive Table
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-[#362222] text-white rounded-lg hover:bg-[#423F3E] text-sm flex items-center"
                title={viewMode === 'table' ? 'Export to Excel with Attendance Data' : 'Export to Excel'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export to Excel
              </button>
              <div className="text-gray-400 text-sm">
                {students.length} students found
              </div>
            </div>
          </div>
          
          {/* Bulk Action Bar - Only visible when items are selected */}
          {selectedStudents.length > 0 && (
            <div className="bg-[#362222] rounded-lg shadow-md border border-[#423F3E] p-3 mb-6 flex justify-between items-center">
              <div className="text-white text-sm">
                {selectedStudents.length} {selectedStudents.length === 1 ? 'student' : 'students'} selected
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="px-3 py-1 bg-[#171010] border border-[#423F3E] rounded-md text-white text-sm"
                  onChange={(e) => handleBulkAction(e.target.value)}
                  value=""
                >
                  <option value="" disabled>Bulk Actions</option>
                  <option value="delete">Delete Selected</option>
                </select>
                <button
                  onClick={() => setSelectedStudents([])}
                  className="px-3 py-1 bg-[#171010] text-white rounded-md hover:bg-[#2B2B2B] text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          
          {/* Academic Year selector for comprehensive view */}
          {viewMode === 'table' && (
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-3 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <h3 className="text-white font-semibold mb-2 sm:mb-0">Academic Year</h3>
                <div className="flex items-center">
                  <select
                    value={currentAcademicYear}
                    onChange={(e) => setCurrentAcademicYear(e.target.value)}
                    className="px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                  >
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Basic Student List */}
          {viewMode === 'list' && (
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#423F3E]">
                  <thead className="bg-[#362222]">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-[#362222] bg-[#171010] border-[#423F3E] rounded focus:ring-0"
                          checked={students.length > 0 && selectedStudents.length === students.length}
                          onChange={handleSelectAllStudents}
                        />
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Admission No.
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Year
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Group
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Medium
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#2B2B2B] divide-y divide-[#423F3E]">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-4 text-center text-gray-300">
                          No students found. Add a new student or adjust your filters.
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-[#362222]">
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-[#362222] bg-[#171010] border-[#423F3E] rounded focus:ring-0"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleSelectStudent(student.id)}
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                            {student.admission_number}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                            {student.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                            {student.year}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200 capitalize">
                            {student.group}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200 capitalize">
                            {student.medium}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200 text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => fetchStudentDetails(student.id)}
                                className="px-2 py-1 bg-[#171010] text-white rounded-md hover:bg-[#362222] text-xs"
                                title="View Details"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentStudent(student);
                                  setIsEditModalOpen(true);
                                }}
                                className="px-2 py-1 bg-[#362222] text-white rounded-md hover:bg-[#423F3E] text-xs"
                                title="Edit Student"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentStudent(student);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="px-2 py-1 bg-red-800 text-white rounded-md hover:bg-red-700 text-xs"
                                title="Delete Student"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination - Placeholder for future implementation */}
              <div className="px-4 py-3 bg-[#202020] flex items-center justify-between border-t border-[#423F3E]">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button className="px-3 py-1 bg-[#362222] text-white rounded-md text-sm hover:bg-[#423F3E] disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-[#362222] text-white rounded-md text-sm hover:bg-[#423F3E] disabled:opacity-50" disabled>
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Showing <span className="font-medium">{students.length}</span> students
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">
                      Page 1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Comprehensive Student Table */}
          {viewMode === 'table' && (
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
              {loadingComprehensiveData ? (
                <div className="flex flex-col justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mb-4"></div>
                  <p className="text-gray-300">Loading initial data...</p>
                  <p className="text-gray-400 text-sm mt-2">The rest of the data will load in the background</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="min-w-max">
                    <table className="w-full divide-y divide-[#423F3E]">
                      <thead className="bg-[#362222]">
                        <tr>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider sticky left-0 top-0 z-20 bg-[#362222] min-w-[100px]">
                            ADM. NO
                          </th>
                          <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider sticky left-[100px] top-0 z-20 bg-[#362222] min-w-[150px]">
                            NAME
                          </th>
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider sticky top-0 z-10 bg-[#362222] min-w-[50px]">
                            YEAR
                          </th>
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider sticky top-0 z-10 bg-[#362222] min-w-[80px]">
                            GROUP
                          </th>
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider sticky top-0 z-10 bg-[#362222] min-w-[80px]">
                            MEDIUM
                          </th>
                          
                          {/* Month columns */}
                          {months.map((month) => (
                            <th 
                              key={month} 
                              scope="col" 
                              className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider sticky top-0 z-10 bg-[#423F3E] min-w-[90px]"
                              colSpan={3}
                            >
                              {capitalize(month.substring(0, 3))}
                            </th>
                          ))}
                          
                          {/* Annual summary column */}
                          <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider sticky top-0 right-0 z-10 bg-[#262626] min-w-[100px]">
                            ANNUAL
                          </th>
                        </tr>
                        
                        {/* Sub-header for attendance columns */}
                        <tr className="bg-[#362222]">
                          <th scope="col" className="px-2 py-2 text-left text-[10px] font-medium text-gray-400 sticky left-0 z-20 bg-[#362222]">
                            ID
                          </th>
                          <th scope="col" className="px-2 py-2 text-left text-[10px] font-medium text-gray-400 sticky left-[100px] z-20 bg-[#362222]">
                            STUDENT
                          </th>
                          <th scope="col" className="px-2 py-2 text-center text-[10px] font-medium text-gray-400 sticky top-[41px] z-10 bg-[#362222]">
                            YR
                          </th>
                          <th scope="col" className="px-2 py-2 text-center text-[10px] font-medium text-gray-400 sticky top-[41px] z-10 bg-[#362222]">
                            GRP
                          </th>
                          <th scope="col" className="px-2 py-2 text-center text-[10px] font-medium text-gray-400 sticky top-[41px] z-10 bg-[#362222]">
                            MED
                          </th>
                          
                          {/* Month sub-columns */}
                          {months.map((month) => (
                            <React.Fragment key={`${month}-sub`}>
                              <th scope="col" className="px-1 py-2 text-center text-[10px] font-medium text-gray-400 sticky top-[41px] z-10 bg-[#423F3E]">
                                P
                              </th>
                              <th scope="col" className="px-1 py-2 text-center text-[10px] font-medium text-gray-400 sticky top-[41px] z-10 bg-[#423F3E]">
                                W
                              </th>
                              <th scope="col" className="px-1 py-2 text-center text-[10px] font-medium text-gray-400 sticky top-[41px] z-10 bg-[#423F3E]">
                                %
                              </th>
                            </React.Fragment>
                          ))}
                          
                          {/* Annual column */}
                          <th scope="col" className="px-2 py-2 text-center text-[10px] font-medium text-white sticky top-[41px] right-0 z-10 bg-[#262626]">
                            PERCENT
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#2B2B2B] divide-y divide-[#423F3E]">
                        {filteredStudentsWithAttendance.length === 0 ? (
                          <tr>
                            <td colSpan={5 + (months.length * 3) + 1} className="px-3 py-4 text-center text-gray-300">
                              No students found. Add a new student or adjust your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredStudentsWithAttendance.map((student) => (
                            <tr key={student.id} className="hover:bg-[#362222] text-xs">
                              <td className="px-2 py-3 whitespace-nowrap text-gray-200 sticky left-0 bg-[#2B2B2B] z-10 min-w-[100px] hover:bg-[#362222]">
                                {student.admission_number}
                              </td>
                              <td className="px-2 py-3 whitespace-nowrap text-gray-200 font-medium sticky left-[100px] bg-[#2B2B2B] z-10 min-w-[150px] hover:bg-[#362222]">
                                {student.name}
                              </td>
                              <td className="px-2 py-3 whitespace-nowrap text-center text-gray-200">
                                {student.year}
                              </td>
                              <td className="px-2 py-3 whitespace-nowrap text-center text-gray-200 capitalize">
                                {student.group}
                              </td>
                              <td className="px-2 py-3 whitespace-nowrap text-center text-gray-200 capitalize">
                                {student.medium}
                              </td>
                              
                              {/* Month attendance data */}
                              {months.map((month) => {
                                const monthData = student.monthlyAttendance?.[month] || {
                                  days_present: 0,
                                  working_days: 0,
                                  attendance_percentage: 0
                                };
                                
                                return (
                                  <React.Fragment key={`${student.id}-${month}`}>
                                    <td className="px-1 py-3 whitespace-nowrap text-center text-gray-200 bg-[#242424]">
                                      {monthData.days_present}
                                    </td>
                                    <td className="px-1 py-3 whitespace-nowrap text-center text-gray-200 bg-[#242424]">
                                      {monthData.working_days}
                                    </td>
                                    <td className="px-1 py-3 whitespace-nowrap text-center bg-[#242424]">
                                      {monthData.working_days > 0 ? (
                                        <span className={`px-1 py-0.5 text-[10px] rounded-full ${
                                          monthData.attendance_percentage >= 75 ? 'bg-green-900 text-green-300' : 
                                          monthData.attendance_percentage >= 50 ? 'bg-yellow-900 text-yellow-300' : 
                                          monthData.attendance_percentage > 0 ? 'bg-red-900 text-red-300' : 
                                          'bg-gray-700 text-gray-400'
                                        }`}>
                                          {monthData.attendance_percentage.toFixed(1)}%
                                        </span>
                                      ) : (
                                        <span className="text-gray-500">-</span>
                                      )}
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                              
                              {/* Annual attendance percentage */}
                              <td className="px-2 py-3 whitespace-nowrap text-center font-medium bg-[#262626] sticky right-0 z-10">
                                {student.attendance?.working_days > 0 ? (
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    student.attendance.attendance_percentage >= 75 ? 'bg-green-900 text-green-300' : 
                                    student.attendance.attendance_percentage >= 50 ? 'bg-yellow-900 text-yellow-300' : 
                                    'bg-red-900 text-red-300'
                                  }`}>
                                    {student.attendance.attendance_percentage.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-500">No Data</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-2xl w-full overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-4">Add New Student</h2>
            
            <form onSubmit={handleCreateStudent}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Admission Number</label>
                  <input
                    type="text"
                    name="admission_number"
                    value={newStudent.admission_number}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newStudent.name}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Year</label>
                  <select
                    name="year"
                    value={newStudent.year}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Group</label>
                  <select
                    name="group"
                    value={newStudent.group}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  >
                    <option value="mpc">MPC</option>
                    <option value="bipc">BiPC</option>
                    <option value="cec">CEC</option>
                    <option value="hec">HEC</option>
                    <option value="thm">T&HM</option>
                    <option value="oas">OAS</option>
                    <option value="mphw">MPHW</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Medium</label>
                  <select
                    name="medium"
                    value={newStudent.medium}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  >
                    <option value="english">English</option>
                    <option value="telugu">Telugu</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Father's Name</label>
                  <input
                    type="text"
                    name="father_name"
                    value={newStudent.father_name}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={newStudent.date_of_birth}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Caste</label>
                  <input
                    type="text"
                    name="caste"
                    value={newStudent.caste}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Gender</label>
                  <select
                    name="gender"
                    value={newStudent.gender}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Aadhar Number</label>
                  <input
                    type="text"
                    name="aadhar_number"
                    value={newStudent.aadhar_number}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Student Phone (Optional)</label>
                  <input
                    type="text"
                    name="student_phone"
                    value={newStudent.student_phone}
                    onChange={(e) => handleStudentInputChange(e)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Parent Phone</label>
                  <input
                    type="text"
                    name="parent_phone"
                    value={newStudent.parent_phone}
                    onChange={(e) => handleStudentInputChange(e)}
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
                  {loading ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Student Modal */}
      {isEditModalOpen && currentStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-2xl w-full overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-white mb-4">Edit Student</h2>
            
            <form onSubmit={handleUpdateStudent}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Admission Number</label>
                  <input
                    type="text"
                    name="admission_number"
                    value={currentStudent.admission_number}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={currentStudent.name}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Year</label>
                  <select
                    name="year"
                    value={currentStudent.year}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Group</label>
                  <select
                    name="group"
                    value={currentStudent.group}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  >
                    <option value="mpc">MPC</option>
                    <option value="bipc">BiPC</option>
                    <option value="cec">CEC</option>
                    <option value="hec">HEC</option>
                    <option value="thm">T&HM</option>
                    <option value="oas">OAS</option>
                    <option value="mphw">MPHW</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Medium</label>
                  <select
                    name="medium"
                    value={currentStudent.medium}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  >
                    <option value="english">English</option>
                    <option value="telugu">Telugu</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Father's Name</label>
                  <input
                    type="text"
                    name="father_name"
                    value={currentStudent.father_name}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={currentStudent.date_of_birth}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Caste</label>
                  <input
                    type="text"
                    name="caste"
                    value={currentStudent.caste}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300">Gender</label>
                  <select
                    name="gender"
                    value={currentStudent.gender}
                    onChange={(e) => handleStudentInputChange(e, false)}
                    className="mt-1 block w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white focus:outline-none"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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
                  type="submit"
                  className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && currentStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Delete</h2>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete the student <span className="font-semibold">{currentStudent.name}</span>? This action cannot be undone.
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
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Confirm Bulk Delete</h2>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete {selectedStudents.length} selected {selectedStudents.length === 1 ? 'student' : 'students'}? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement; 