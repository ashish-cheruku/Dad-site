import React, { useState, useEffect, useCallback } from 'react';
import { studentService, attendanceService, authService, examService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ErrorDisplay, setSafeError } from '../utils/errorHandler';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterMedium, setFilterMedium] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // User permissions
  const [currentUser, setCurrentUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({
    can_add_student: false,
    can_edit_student: false,
    can_delete_student: false
  });
  
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
  const [studentExams, setStudentExams] = useState({exams: []});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState('2024-2025');
  const [selectedMonth, setSelectedMonth] = useState('january');
  
  // Progress card generation state
  const [pdfGenerationProgress, setPdfGenerationProgress] = useState('Initializing...');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  // Fetch current user and permissions
  useEffect(() => {
    const fetchUserAndPermissions = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setCurrentUser(userData);
        
        // Principal has all permissions by default
        if (userData.role === 'principal') {
          setUserPermissions({
            can_add_student: true,
            can_edit_student: true,
            can_delete_student: true
          });
        } else if (userData.role === 'staff') {
          // For staff, fetch their specific permissions
          try {
            const permissions = await authService.getUserPermissions(userData.id);
            setUserPermissions({
              can_add_student: permissions.can_add_student || false,
              can_edit_student: permissions.can_edit_student || false,
              can_delete_student: permissions.can_delete_student || false
            });
          } catch (err) {
            console.error('Error fetching permissions:', err);
            // Default to no permissions
            setUserPermissions({
              can_add_student: false,
              can_edit_student: false,
              can_delete_student: false
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };
    
    fetchUserAndPermissions();
  }, []);

  // Now define fetchStudents after the functions it depends on
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const year = filterYear ? parseInt(filterYear) : null;
      const group = filterGroup || null;
      const medium = filterMedium || null;
      
      // Create a filters object with the correct parameters
      const filters = {};
      if (year !== null) filters.year = year;
      if (group !== null) filters.group = group;
      if (medium !== null) filters.medium = medium;
      
      const data = await studentService.getAllStudents(filters);
      
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
    } catch (err) {
      handleError(err, 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterGroup, filterMedium, searchTerm]);
  
  // Fetch student details and attendance
  const fetchStudentDetails = async (studentId) => {
    try {
      setLoading(true);
      const studentData = await studentService.getStudent(studentId);
      setStudentDetails(studentData);
      
      // Fetch attendance data
      await fetchStudentAttendance(studentId);
      
      // Fetch exam data
      await fetchStudentExams(studentId);
      
      setShowStudentInfo(true);
    } catch (err) {
      handleError(err, 'Failed to fetch student details');
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
      // Not showing this error to the user to avoid cluttering the UI
    } finally {
      setLoadingAttendance(false);
    }
  }, [currentAcademicYear, selectedMonth]);

  // Fetch attendance for all months (for progress card)
  const fetchAllMonthsAttendance = async (studentId) => {
    try {
      const allAttendance = {};
      
      // Use Promise.all to fetch all months concurrently instead of sequentially
      const requests = months.map(month => 
        attendanceService.getStudentAttendance(
          studentId,
          currentAcademicYear,
          month
        )
        .catch(error => {
          console.error(`Error fetching attendance for ${month}:`, error);
          // Return default values on error
          return { working_days: 0, days_present: 0, attendance_percentage: 0 };
        })
      );
      
      // Wait for all requests to complete
      const results = await Promise.all(requests);
      
      // Map results to months
      months.forEach((month, index) => {
        allAttendance[month] = results[index];
      });
      
      return allAttendance;
    } catch (err) {
      console.error('Error fetching all months attendance:', err);
      return {};
    }
  };

  // Fetch student exams
  const fetchStudentExams = useCallback(async (studentId) => {
    try {
      setLoadingExams(true);
      const examData = await examService.getStudentExams(studentId);
      console.log('Exam data received:', examData);
      
      // Store the whole response but we'll use .exams for displaying the data
      setStudentExams(examData);
    } catch (err) {
      console.error('Error fetching exam data:', err);
      setStudentExams({exams: []});
      handleError(err, 'Failed to fetch exam records');
    } finally {
      setLoadingExams(false);
    }
  }, []);

  // Fetch students on component mount and when filters change
  useEffect(() => {
    fetchStudents();
  }, [filterYear, filterGroup, filterMedium, fetchStudents]);
  
  // Refetch attendance when month or academic year changes for individual student view
  useEffect(() => {
    if (studentDetails && showStudentInfo) {
      fetchStudentAttendance(studentDetails.id);
    }
  }, [selectedMonth, currentAcademicYear, studentDetails, showStudentInfo, fetchStudentAttendance]);

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
      handleError(err, 'Failed to delete selected students');
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
      // Special handling for specific validation errors
      if (err.detail) {
        if (err.detail.includes('admission number already exists')) {
          setError('A student with this admission number already exists. Please use a unique admission number.');
        } else if (err.detail.includes('Aadhar number already exists')) {
          setError('A student with this Aadhar number already exists. Please check and correct the Aadhar number.');
        } else {
          handleError(err, 'Failed to create student');
        }
      } else {
        handleError(err, 'Failed to create student');
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
      // Special handling for specific validation errors
      if (err.detail) {
        if (err.detail.includes('admission number already exists')) {
          setError('A student with this admission number already exists. Please use a unique admission number.');
        } else if (err.detail.includes('Aadhar number already exists')) {
          setError('A student with this Aadhar number already exists. Please check and correct the Aadhar number.');
        } else {
          handleError(err, 'Failed to update student');
        }
      } else {
        handleError(err, 'Failed to update student');
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
      handleError(err, 'Failed to delete student');
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
      
      // Create worksheet from data
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      const colWidths = [];
      headers.forEach(() => colWidths.push({ wch: 15 })); // Standard width for basic columns
      
      ws['!cols'] = colWidths;
      
      // Create workbook and add the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Save file
      saveAs(blob, `students_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      handleError(err, 'Failed to export student data');
    }
  };

  // Generate and download student progress card as PDF
  const generateProgressCard = () => {
    if (!studentDetails) {
      setError('Student details not available');
      return;
    }


    const generatePDF = async () => {
      setIsGeneratingPDF(true);
      setPdfGenerationProgress('Initializing...');

      try {
        // Fetch attendance data for all months
        setPdfGenerationProgress('Fetching attendance data...');
        let allMonthsAttendance = {};
        try {
          allMonthsAttendance = await fetchAllMonthsAttendance(studentDetails.id);
        } catch (attendanceError) {
          console.error('Error fetching attendance data:', attendanceError);
          allMonthsAttendance = {};
        }

        // Determine the print month (current month)
        const now = new Date();
        const printMonthIndex = now.getMonth(); // 0-based (0=Jan, 5=June)
        const startMonthIndex = 5; // June
        const monthsToInclude = months.slice(startMonthIndex, printMonthIndex + 1);

        // Aggregate attendance from June to print month
        let totalWorkingDays = 0;
        let totalDaysPresent = 0;
        monthsToInclude.forEach(month => {
          const monthData = allMonthsAttendance[month] || { working_days: 0, days_present: 0 };
          totalWorkingDays += monthData.working_days || 0;
          totalDaysPresent += monthData.days_present || 0;
        });
        const overallPercentage = totalWorkingDays > 0 ? ((totalDaysPresent / totalWorkingDays) * 100).toFixed(1) : "0.0";

        // Prepare exam data for the table
        const examTypes = [
          { key: 'UT1', label: 'Unit Test 1' },
          { key: 'UT2', label: 'Unit Test 2' },
          { key: 'HLY', label: 'Half Yearly' },
          { key: 'PF', label: 'Pre-Final Exam' }
        ];
        // Get subjects for the group from the first exam or fallback to a default
        let groupSubjects = [];
        let subjectFullNames = {};
        if (studentExams && studentExams.exams && studentExams.exams.length > 0) {
          for (const exam of studentExams.exams) {
            if (exam.subjects && Object.keys(exam.subjects).length > 0) {
              groupSubjects = Object.keys(exam.subjects);
              break;
            }
          }
        }
        // Map short subject codes to full names (customize as needed)
        const subjectNameMap = {
          eng: 'English',
          tel: 'Telugu',
          mat: 'Mathematics',
          phy: 'Physics',
          che: 'Chemistry',
          bot: 'Botany',
          zoo: 'Zoology',
          eco: 'Economics',
          civ: 'Civics',
          his: 'History',
          com: 'Commerce',
          acc: 'Accountancy',
          san: 'Sanskrit',
          soc: 'Social',
          // Add more as needed
        };
        subjectFullNames = groupSubjects.map(s => subjectNameMap[s] || s.charAt(0).toUpperCase() + s.slice(1));
        if (groupSubjects.length === 0) {
          groupSubjects = ['eng', 'tel', 'mat', 'phy', 'che'];
          subjectFullNames = groupSubjects.map(s => subjectNameMap[s] || s.charAt(0).toUpperCase() + s.slice(1));
        }

        // Build exam table rows
        const examRows = examTypes.map(typeObj => {
          const exam = (studentExams.exams || []).find(e => (e.exam_type || '').toUpperCase() === typeObj.key);
          const row = [typeObj.label];
          let total = 0;
          groupSubjects.forEach(subj => {
            const mark = exam && exam.subjects && exam.subjects[subj] !== undefined ? exam.subjects[subj] : '';
            row.push(mark);
            if (typeof mark === 'number') total += mark;
          });
          // Total
          row.push(total > 0 ? total : '');
          // Percentage
          if (exam && typeof exam.percentage === 'number') {
            row.push(exam.percentage.toFixed(1) + '%');
          } else {
            row.push('');
          }
          return row;
        });

        // Create a new jsPDF instance
        setPdfGenerationProgress('Creating PDF document...');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 15;

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Government Junior College, Vemulawada', pageWidth / 2, y, { align: 'center' });
        y += 8;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'normal');
        doc.text('Student Performance Report', pageWidth / 2, y, { align: 'center' });
        y += 7;
        doc.setFontSize(11);
        doc.text(`Academic Year: ${currentAcademicYear}`, pageWidth / 2, y, { align: 'center' });
        y += 7;
        doc.setDrawColor(54, 34, 34);
        doc.line(20, y, pageWidth - 20, y);
        y += 4;

        // Student Information Section
        y += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Information', 20, y);
        y += 10;
        doc.setFont('helvetica', 'normal');
        const infoRows = [
          [
            { label: 'Admission Number', value: studentDetails.admission_number || '' },
            { label: 'Name', value: studentDetails.name || '' }
          ],
          [
            { label: 'Year', value: studentDetails.year ? studentDetails.year.toString() : '' },
            { label: "Father's Name", value: studentDetails.father_name || '' }
          ],     
          [
            { label: 'Group', value: studentDetails.group ? capitalize(studentDetails.group) : '' },
            { label: 'Student Phone Number', value: studentDetails.student_phone || '' }
          ],
          [ 
            { label: 'Medium', value: studentDetails.medium ? capitalize(studentDetails.medium) : '' },
            { label: 'Parent Phone Number', value: studentDetails.parent_phone || '' }
          ]
        ];
        infoRows.forEach(row => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(row[0].label + ':', 20, y);
          doc.setFont('helvetica', 'normal');
          doc.text(row[0].value, 55, y);
          if (row[1].label) {
            doc.setFont('helvetica', 'bold');
            doc.text(row[1].label + ':', 110, y);
            doc.setFont('helvetica', 'normal');
            doc.text(row[1].value, 155, y);
          }
          y += 6;
        });
        y += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, pageWidth - 20, y);
        y += 4;

        // Exam Records Table
        y += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Exam Records', 20, y);
        y += 4;
        const examTableHead = [
          ['Exam', ...subjectFullNames, 'Total', 'Percentage']
        ];
        autoTable(doc, {
          startY: y,
          head: examTableHead,
          body: examRows,
          theme: 'grid',
          headStyles: { fillColor: [54, 34, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          styles: { fontSize: 8, cellPadding: 2 },
          margin: { left: 20, right: 20 },
          tableWidth: 'auto'
        });
        y = doc.lastAutoTable.finalY + 6;
        
        // Attendance Summary
        y += 4;
        doc.line(20, y, pageWidth - 20, y);
        y += 4;
        y += 4;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Attendance Summary', 20, y);
        y += 4;
        const attTableHead = [['Total Working Days', 'Total Days Present', 'Attendance Percentage']];
        const attTableBody = [[totalWorkingDays, totalDaysPresent, overallPercentage + '%']];
        autoTable(doc, {
          startY: y,
          head: attTableHead,
          body: attTableBody,
          theme: 'grid',
          headStyles: { fillColor: [54, 34, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
          bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
          styles: { fontSize: 8, cellPadding: 2 },
          margin: { left: 20, right: 20 },
          tableWidth: 'auto'
        });
        y = doc.lastAutoTable.finalY + 15;

        // Signature Section
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Parent Signature', 30, y);
        doc.text('Class Incharge', pageWidth / 2, y, { align: 'center' });
        doc.text('Principal', pageWidth - 30, y, { align: 'right' });

        setPdfGenerationProgress('Finalizing PDF...');
        try {
          doc.save(`progress_card_${studentDetails.admission_number}.pdf`);
          setError('');
        } catch (saveError) {
          console.error('Error saving PDF:', saveError);
          throw new Error('Failed to save PDF: ' + saveError.message);
        }
      } catch (err) {
        console.error('Error in overall PDF generation:', err);
        if (typeof err === 'string') {
          setError(err);
        } else if (err && err.message) {
          setError('Failed to generate progress card: ' + err.message);
        } else {
          try {
            setError('Failed to generate progress card: ' + JSON.stringify(err));
          } catch (e) {
            setError('Failed to generate progress card due to an unknown error');
          }
        }
      } finally {
        setIsGeneratingPDF(false);
      }
    };

    generatePDF();
  };

  // Error handling utility function - updated to use the imported utility
  const handleError = (err, defaultMessage = 'An error occurred') => {
    console.error(defaultMessage, err);
    setSafeError(setError, err, defaultMessage);
  };

  // Render error message safely
  const renderErrorMessage = () => {
    if (!error) return null;
    
    try {
      // If error is already a string, display it directly
      if (typeof error === 'string') {
        return (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        );
      }
      
      // If error is an object with keys {type, loc, msg, input, url}, format it
      if (error && error.type && error.msg) {
        return (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
            Error: {error.msg || 'Unknown error'}
          </div>
        );
      }
      
      // For any other object, stringify it
      return (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
          {String(error)}
        </div>
      );
    } catch (e) {
      // Last resort if rendering fails
      return (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
          An error occurred. Please try again.
        </div>
      );
    }
  };

  // Render UI - use ErrorDisplay component instead of direct error rendering
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
              <div className="flex space-x-3">
                <Button 
                  onClick={generateProgressCard}
                  className="py-2 px-4 rounded-lg"
                  style={{ backgroundColor: '#362222', color: 'white' }}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full inline-block"></div>
                      Generating...
                    </>
                  ) : 'Print Progress Card'}
                </Button>
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
            </div>
            
            <ErrorDisplay error={error} />
            
            {/* PDF Generation Progress */}
            {isGeneratingPDF && (
              <div className="bg-[#362222] rounded-lg p-4 mb-6 text-white">
                <div className="flex items-center">
                  <div className="animate-spin h-5 w-5 mr-3 border-2 border-t-transparent border-white rounded-full"></div>
                  <span className="font-medium">Generating PDF: {pdfGenerationProgress}</span>
                </div>
                <div className="w-full bg-[#171010] rounded-full h-2.5 mt-2">
                  <div className="bg-white h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
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
            
            {/* Exam Records Section */}
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Exam Records</h3>
              </div>
              
              {loadingExams ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : !studentExams || !studentExams.exams || studentExams.exams.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No exam records found for this student</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#423F3E]">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Exam Type</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Marks</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Max Marks</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#171010] divide-y divide-[#423F3E]">
                      {studentExams && studentExams.exams && studentExams.exams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-[#2B2B2B]">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-white">{exam.exam_type}</td>
                          <td className="px-3 py-4 text-sm text-white">
                            {Object.keys(exam.subjects).map((subject, index) => (
                              <span key={subject}>
                                {index > 0 && <span className="mx-1">•</span>}
                                <span className="capitalize">{subject}</span>
                              </span>
                            ))}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-white">{exam.total_marks}</td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-white">
                            {Object.keys(exam.subjects).length * 100}
                          </td>
                          <td className={`px-3 py-4 whitespace-nowrap text-sm font-medium ${
                            exam.percentage >= 75 ? 'text-green-400' : 
                            exam.percentage >= 40 ? 'text-yellow-400' : 
                            'text-red-400'
                          }`}>
                            {exam.percentage.toFixed(1)}%
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-white">{formatDate(exam.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {studentExams && studentExams.exams && studentExams.exams.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-white font-medium mb-4">Performance Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* UT1 Summary */}
                    <div className="bg-[#171010] p-4 rounded-lg border border-[#423F3E]">
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Unit Test 1</h5>
                      {studentExams.exams.filter(exam => exam.exam_type === 'UT1' || exam.exam_type === 'ut1').length > 0 ? (
                        <>
                          <p className="text-2xl font-bold text-white mb-1">
                            {(studentExams.exams
                              .filter(exam => exam.exam_type === 'UT1' || exam.exam_type === 'ut1')
                              .reduce((acc, exam) => acc + exam.percentage, 0) / 
                              studentExams.exams.filter(exam => exam.exam_type === 'UT1' || exam.exam_type === 'ut1').length
                            ).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {studentExams.exams.filter(exam => exam.exam_type === 'UT1' || exam.exam_type === 'ut1').length} subjects
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No records</p>
                      )}
                    </div>
                    
                    {/* UT2 Summary */}
                    <div className="bg-[#171010] p-4 rounded-lg border border-[#423F3E]">
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Unit Test 2</h5>
                      {studentExams.exams.filter(exam => exam.exam_type === 'UT2' || exam.exam_type === 'ut2').length > 0 ? (
                        <>
                          <p className="text-2xl font-bold text-white mb-1">
                            {(studentExams.exams
                              .filter(exam => exam.exam_type === 'UT2' || exam.exam_type === 'ut2')
                              .reduce((acc, exam) => acc + exam.percentage, 0) / 
                              studentExams.exams.filter(exam => exam.exam_type === 'UT2' || exam.exam_type === 'ut2').length
                            ).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {studentExams.exams.filter(exam => exam.exam_type === 'UT2' || exam.exam_type === 'ut2').length} subjects
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No records</p>
                      )}
                    </div>
                    
                    {/* UT3 Summary */}
                    <div className="bg-[#171010] p-4 rounded-lg border border-[#423F3E]">
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Unit Test 3</h5>
                      {studentExams.exams.filter(exam => exam.exam_type === 'UT3' || exam.exam_type === 'ut3').length > 0 ? (
                        <>
                          <p className="text-2xl font-bold text-white mb-1">
                            {(studentExams.exams
                              .filter(exam => exam.exam_type === 'UT3' || exam.exam_type === 'ut3')
                              .reduce((acc, exam) => acc + exam.percentage, 0) / 
                              studentExams.exams.filter(exam => exam.exam_type === 'UT3' || exam.exam_type === 'ut3').length
                            ).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {studentExams.exams.filter(exam => exam.exam_type === 'UT3' || exam.exam_type === 'ut3').length} subjects
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No records</p>
                      )}
                    </div>
                    
                    {/* UT4 Summary */}
                    <div className="bg-[#171010] p-4 rounded-lg border border-[#423F3E]">
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Unit Test 4</h5>
                      {studentExams.exams.filter(exam => exam.exam_type === 'UT4' || exam.exam_type === 'ut4').length > 0 ? (
                        <>
                          <p className="text-2xl font-bold text-white mb-1">
                            {(studentExams.exams
                              .filter(exam => exam.exam_type === 'UT4' || exam.exam_type === 'ut4')
                              .reduce((acc, exam) => acc + exam.percentage, 0) / 
                              studentExams.exams.filter(exam => exam.exam_type === 'UT4' || exam.exam_type === 'ut4').length
                            ).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {studentExams.exams.filter(exam => exam.exam_type === 'UT4' || exam.exam_type === 'ut4').length} subjects
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No records</p>
                      )}
                    </div>
                    
                    {/* HALF-YEARLY Summary */}
                    <div className="bg-[#171010] p-4 rounded-lg border border-[#423F3E]">
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Half Yearly</h5>
                      {studentExams.exams.filter(exam => exam.exam_type === 'HALF-YEARLY' || exam.exam_type === 'half-yearly').length > 0 ? (
                        <>
                          <p className="text-2xl font-bold text-white mb-1">
                            {(studentExams.exams
                              .filter(exam => exam.exam_type === 'HALF-YEARLY' || exam.exam_type === 'half-yearly')
                              .reduce((acc, exam) => acc + exam.percentage, 0) / 
                              studentExams.exams.filter(exam => exam.exam_type === 'HALF-YEARLY' || exam.exam_type === 'half-yearly').length
                            ).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {studentExams.exams.filter(exam => exam.exam_type === 'HALF-YEARLY' || exam.exam_type === 'half-yearly').length} subjects
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No records</p>
                      )}
                    </div>
                    
                    {/* FINAL Summary */}
                    <div className="bg-[#171010] p-4 rounded-lg border border-[#423F3E]">
                      <h5 className="text-sm font-medium text-gray-400 mb-2">Final Exam</h5>
                      {studentExams.exams.filter(exam => exam.exam_type === 'FINAL' || exam.exam_type === 'final').length > 0 ? (
                        <>
                          <p className="text-2xl font-bold text-white mb-1">
                            {(studentExams.exams
                              .filter(exam => exam.exam_type === 'FINAL' || exam.exam_type === 'final')
                              .reduce((acc, exam) => acc + exam.percentage, 0) / 
                              studentExams.exams.filter(exam => exam.exam_type === 'FINAL' || exam.exam_type === 'final').length
                            ).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-400">
                            {studentExams.exams.filter(exam => exam.exam_type === 'FINAL' || exam.exam_type === 'final').length} subjects
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No records</p>
                      )}
                    </div>
                    
                    {/* Overall Performance */}
                    <div className="bg-[#362222] p-4 rounded-lg border border-[#423F3E] md:col-span-3">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Overall Performance</h5>
                      {studentExams && studentExams.exams && studentExams.exams.length > 0 ? (
                        <>
                          <div className="flex justify-between items-center">
                            <p className="text-2xl font-bold text-white">
                              {(studentExams.exams
                                .reduce((acc, exam) => acc + exam.percentage, 0) / 
                                studentExams.exams.length
                              ).toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-300">
                              {studentExams.exams.length} total records across {new Set(studentExams.exams.map(exam => exam.exam_type)).size} exam types
                            </p>
                          </div>
                          
                          <div className="w-full mt-2 bg-[#171010] rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full ${
                                (studentExams.exams.reduce((acc, exam) => acc + exam.percentage, 0) / studentExams.exams.length) >= 75 
                                  ? 'bg-green-500' 
                                  : (studentExams.exams.reduce((acc, exam) => acc + exam.percentage, 0) / studentExams.exams.length) >= 40 
                                  ? 'bg-yellow-500' 
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${(studentExams.exams.reduce((acc, exam) => acc + exam.percentage, 0) / studentExams.exams.length)}%` }}
                            ></div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No exam records</p>
                      )}
                    </div>
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
            {userPermissions.can_add_student && (
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="py-2 px-4 rounded-lg"
                style={{ backgroundColor: '#362222', color: 'white' }}
              >
                Add New Student
              </Button>
            )}
          </div>
          
          <ErrorDisplay error={error} />
          
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
          
          {/* View Mode Switch - Removing comprehensive table option */}
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-[#362222] text-white rounded-lg hover:bg-[#423F3E] text-sm flex items-center"
                title="Export to Excel"
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
          
          {/* Basic Student List */}
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
                            
                            {userPermissions.can_edit_student && (
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
                            )}
                            
                            {userPermissions.can_delete_student && (
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
                            )}
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