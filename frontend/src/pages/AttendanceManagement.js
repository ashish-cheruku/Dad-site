import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../services/api';
import { authService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ErrorDisplay, setSafeError } from '../utils/errorHandler';

const AttendanceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  
  // Filters for class selection
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedGroup, setSelectedGroup] = useState('mpc');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('january');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  
  // Multi-month selection for export
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Working days state (for principal)
  const [workingDays, setWorkingDays] = useState(0);
  const [isWorkingDaysModalOpen, setIsWorkingDaysModalOpen] = useState(false);
  const [newWorkingDays, setNewWorkingDays] = useState(0);
  
  // Students and attendance data
  const [classAttendance, setClassAttendance] = useState(null);
  // Add state for temporary attendance values
  const [tempAttendance, setTempAttendance] = useState({});
  
  // Add student-specific loading state
  const [savingStudents, setSavingStudents] = useState({});
  
  // Tab state for switching between regular attendance and low attendance view
  const [activeTab, setActiveTab] = useState('attendance');
  
  // Low attendance state
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [percentageThreshold, setPercentageThreshold] = useState(75);
  const [loadingLowAttendance, setLoadingLowAttendance] = useState(false);
  
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserRole(user.role);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    
    getCurrentUser();
  }, []);
  
  const fetchClassAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // First fetch the working days to ensure we have the latest value
      const workingDaysData = await attendanceService.getWorkingDays(
        academicYear,
        selectedMonth
      );
      
      console.log('Working days data:', workingDaysData);
      setWorkingDays(workingDaysData.working_days);
      
      // Then fetch the class attendance data
      const data = await attendanceService.getClassAttendance(
        parseInt(selectedYear),
        selectedGroup,
        academicYear,
        selectedMonth,
        selectedMedium || null
      );
      
      console.log('Class attendance data:', data);
      setClassAttendance(data);
      
      // Double-check to make sure working days are consistent
      if (data.working_days !== workingDaysData.working_days) {
        console.warn('Working days mismatch between API endpoints');
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setSafeError(setError, err, 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedGroup, selectedMedium, academicYear, selectedMonth]);
  
  const fetchLowAttendanceStudents = useCallback(async () => {
    try {
      setLoadingLowAttendance(true);
      setError('');
      
      const year = selectedYear ? parseInt(selectedYear) : null;
      const group = selectedGroup || null;
      const medium = selectedMedium || null;
      
      const data = await attendanceService.getStudentsWithLowAttendance(
        academicYear,
        selectedMonth,
        percentageThreshold,
        year,
        group,
        medium
      );
      
      setLowAttendanceStudents(data.students);
    } catch (err) {
      console.error('Error fetching low attendance data:', err);
      setSafeError(setError, err, 'Failed to fetch students with low attendance');
    } finally {
      setLoadingLowAttendance(false);
    }
  }, [academicYear, selectedMonth, percentageThreshold, selectedYear, selectedGroup, selectedMedium]);
  
  useEffect(() => {
    if (selectedYear && selectedGroup && selectedMonth && academicYear) {
      fetchClassAttendance();
    }
  }, [selectedYear, selectedGroup, selectedMedium, selectedMonth, academicYear, fetchClassAttendance]);
  
  // Fetch low attendance data when tab changes to low attendance or when filters change
  useEffect(() => {
    if (activeTab === 'lowAttendance' && percentageThreshold > 0) {
      fetchLowAttendanceStudents();
    }
  }, [activeTab, academicYear, selectedMonth, percentageThreshold, selectedYear, selectedGroup, selectedMedium, fetchLowAttendanceStudents]);
  
  // Initialize temporary attendance values when class attendance is fetched
  useEffect(() => {
    if (classAttendance && classAttendance.students) {
      const initialValues = {};
      classAttendance.students.forEach(student => {
        initialValues[student.student_id] = student.days_present;
      });
      setTempAttendance(initialValues);
    }
  }, [classAttendance]);
  
  const handleAttendanceInputChange = (studentId, value) => {
    // Validate input
    let parsedValue = parseInt(value) || 0;
    
    // Ensure value is within valid range
    parsedValue = Math.max(0, parsedValue);
    if (workingDays > 0) {
      parsedValue = Math.min(parsedValue, workingDays);
    }
    
    // Update temporary state
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: parsedValue
    }));
  };
  
  const handleUpdateAttendance = async (studentId) => {
    try {
      // Set loading state just for this student
      setSavingStudents(prev => ({ ...prev, [studentId]: true }));
      setError(''); // Clear any previous errors
      
      const daysPresent = tempAttendance[studentId];
      
      if (daysPresent < 0 || (workingDays > 0 && daysPresent > workingDays)) {
        setError(`Days present must be between 0 and ${workingDays}`);
        setSavingStudents(prev => ({ ...prev, [studentId]: false }));
        return;
      }
      
      // Save the current days present value to update the UI optimistically
      const currentDaysPresent = daysPresent;
      
      // Call API to update attendance
      const result = await attendanceService.updateStudentAttendance(
        studentId,
        academicYear,
        selectedMonth,
        daysPresent
      );
      
      // Update the local state with the returned value to ensure UI consistency
      setTempAttendance(prev => ({
        ...prev,
        [studentId]: result.days_present
      }));
      
      // Only refresh the full data if necessary to avoid resetting values
      // This is commented out to prevent resetting values
      // await fetchClassAttendance();
      
      // Instead, update the specific student's attendance in the classAttendance state
      if (classAttendance && classAttendance.students) {
        const updatedStudents = classAttendance.students.map(student => {
          if (student.student_id === studentId) {
            return {
              ...student,
              days_present: currentDaysPresent,
              attendance_percentage: workingDays > 0 
                ? Math.round((currentDaysPresent / workingDays) * 100 * 10) / 10 
                : 0
            };
          }
          return student;
        });
        
        setClassAttendance({
          ...classAttendance,
          students: updatedStudents
        });
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
      setSafeError(setError, err, 'Failed to update attendance');
    } finally {
      setSavingStudents(prev => ({ ...prev, [studentId]: false }));
    }
  };
  
  const handleSetWorkingDays = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Validate the new working days value
      const workingDaysValue = parseInt(newWorkingDays);
      if (isNaN(workingDaysValue) || workingDaysValue < 0 || workingDaysValue > 31) {
        setError('Working days must be between 0 and 31');
        setLoading(false);
        return;
      }
      
      console.log('Setting working days to:', workingDaysValue);
      
      // Call the API to update working days
      const result = await attendanceService.setWorkingDays(
        selectedMonth,
        academicYear,
        workingDaysValue
      );
      
      console.log('Set working days result:', result);
      
      // Close the modal
      setIsWorkingDaysModalOpen(false);
      
      // Update the working days in the UI immediately
      setWorkingDays(workingDaysValue);
      
      // Then refresh the full data to ensure consistency
      await fetchClassAttendance();
    } catch (err) {
      console.error('Error setting working days:', err);
      setSafeError(setError, err, 'Failed to set working days');
    } finally {
      setLoading(false);
    }
  };
  
  // Format month name for display (capitalize first letter)
  const formatMonthName = (month) => {
    return month.charAt(0).toUpperCase() + month.slice(1);
  };
  
  // Add handler for toggling month selection
  const handleMonthToggle = (month) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };
  
  // Handler to select all months
  const handleSelectAllMonths = () => {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    setSelectedMonths(months);
  };
  
  // Handler to clear selection
  const handleClearMonthSelection = () => {
    setSelectedMonths([]);
  };
  
  // Export attendance data for selected months
  const exportAttendanceData = async () => {
    if (selectedMonths.length === 0) {
      setError('Please select at least one month to export');
      return;
    }
    
    try {
      setExportLoading(true);
      setError('');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Process each selected month
      for (const month of selectedMonths) {
        try {
          // Fetch data for this month
          const data = await attendanceService.getClassAttendance(
            parseInt(selectedYear),
            selectedGroup,
            academicYear,
            month,
            selectedMedium || null
          );
          
          // Skip if no data
          if (!data || !data.students || data.students.length === 0) {
            continue;
          }
          
          // Create headers
          const headers = [
            'Admission Number',
            'Student Name',
            'Days Present',
            'Working Days',
            'Attendance Percentage'
          ];
          
          // Create data rows
          const rows = data.students.map(student => [
            student.admission_number,
            student.student_name,
            student.days_present,
            data.working_days,
            `${student.attendance_percentage.toFixed(1)}%`
          ]);
          
          // Add headers as first row
          const sheetData = [headers, ...rows];
          
          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          
          // Set column widths
          ws['!cols'] = [
            { wch: 15 }, // Admission Number
            { wch: 25 }, // Student Name
            { wch: 12 }, // Days Present
            { wch: 12 }, // Working Days
            { wch: 20 }  // Attendance Percentage
          ];
          
          // Add worksheet to workbook (sheet name is capitalized month name)
          XLSX.utils.book_append_sheet(wb, ws, formatMonthName(month));
        } catch (err) {
          console.error(`Error fetching data for ${month}:`, err);
          // Continue with next month
        }
      }
      
      // Check if any data was added
      if (wb.SheetNames.length === 0) {
        setError('No data available for the selected months');
        setExportLoading(false);
        return;
      }
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create filename with class and date info
      const filename = `attendance_${selectedYear}_${selectedGroup}${selectedMedium ? '_' + selectedMedium : ''}_${academicYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Save file
      saveAs(blob, filename);
      
      // Close modal after successful export
      setIsExportModalOpen(false);
    } catch (err) {
      console.error('Error exporting attendance data:', err);
      setSafeError(setError, err, 'Failed to export attendance data');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Export low attendance data
  const exportLowAttendanceData = async () => {
    try {
      setExportLoading(true);
      setError('');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create headers
      const headers = [
        'Admission Number',
        'Student Name',
        'Year',
        'Group',
        'Days Present',
        'Working Days',
        'Attendance Percentage'
      ];
      
      // Create data rows
      const rows = lowAttendanceStudents.map(student => [
        student.admission_number,
        student.student_name,
        student.year,
        student.group.toUpperCase(),
        student.days_present,
        student.working_days,
        `${student.attendance_percentage.toFixed(1)}%`
      ]);
      
      // Add headers as first row
      const sheetData = [headers, ...rows];
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Admission Number
        { wch: 25 }, // Student Name
        { wch: 8 },  // Year
        { wch: 10 }, // Group
        { wch: 12 }, // Days Present
        { wch: 12 }, // Working Days
        { wch: 20 }  // Attendance Percentage
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `Low Attendance Below ${percentageThreshold}%`);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create filename with info
      const filename = `low_attendance_below_${percentageThreshold}pct_${selectedMonth}_${academicYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Save file
      saveAs(blob, filename);
    } catch (err) {
      console.error('Error exporting low attendance data:', err);
      setSafeError(setError, err, 'Failed to export low attendance data');
    } finally {
      setExportLoading(false);
    }
  };
  
  if (loading && !classAttendance && activeTab === 'attendance') {
    return (
      <div className="min-h-screen bg-[#171010]">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
        </div>
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
              <h1 className="text-3xl font-bold text-white">Attendance Management</h1>
              <p className="mt-2 text-gray-300">Track and manage student attendance records</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setIsExportModalOpen(true)}
                className="py-2 px-4 rounded-lg"
                style={{ backgroundColor: '#362222', color: 'white' }}
              >
                Export Attendance
              </Button>
              {userRole === 'principal' && (
                <Button 
                  onClick={() => {
                    // Initialize the new working days input with the current working days value
                    setNewWorkingDays(workingDays);
                    setIsWorkingDaysModalOpen(true);
                  }}
                  className="py-2 px-4 rounded-lg"
                  style={{ backgroundColor: '#362222', color: 'white' }}
                >
                  Set Working Days
                </Button>
              )}
            </div>
          </div>
          
          <ErrorDisplay error={error} />
          
          {/* Class Selection */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">Select Class and Month</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Year</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Group</label>
                <select 
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                >
                  <option value="mpc">MPC</option>
                  <option value="bipc">BiPC</option>
                  <option value="cec">CEC</option>
                  <option value="hec">HEC</option>
                  <option value="thm">T&HM</option>
                  <option value="oas">OAS</option>
                  <option value="mphw">MPHW</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Medium</label>
                <select 
                  value={selectedMedium}
                  onChange={(e) => setSelectedMedium(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                >
                  <option value="">All Mediums</option>
                  <option value="english">English</option>
                  <option value="telugu">Telugu</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Month</label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                >
                  <option value="january">January</option>
                  <option value="february">February</option>
                  <option value="march">March</option>
                  <option value="april">April</option>
                  <option value="may">May</option>
                  <option value="june">June</option>
                  <option value="july">July</option>
                  <option value="august">August</option>
                  <option value="september">September</option>
                  <option value="october">October</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Academic Year</label>
                <select 
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Working Days Summary */}
          <div className="bg-[#1e1e1e] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold">
                  Working Days for {formatMonthName(selectedMonth)} {academicYear}
                </h3>
                <p className="text-gray-300 mt-1">
                  Total working days: <span className="font-bold">{workingDays}</span>
                </p>
              </div>
              {userRole === 'principal' && (
                <Button 
                  onClick={() => {
                    setNewWorkingDays(workingDays);
                    setIsWorkingDaysModalOpen(true);
                  }}
                  className="py-1 px-3 rounded-lg"
                  style={{ backgroundColor: '#362222', color: 'white' }}
                >
                  Update
                </Button>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex justify-between items-center border-b border-[#423F3E] mb-6 py-1">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {activeTab === 'attendance' ? 'Attendance Records' : 'Low Attendance Report'}
              </h3>
            </div>
            <div>
              <button
                className={`py-2 px-4 font-medium text-white rounded-lg hover:opacity-90 transition-all ${activeTab === 'lowAttendance' ? 'bg-[#f44336]' : 'bg-[#362222] hover:bg-[#423F3E]'}`}
                onClick={() => setActiveTab(activeTab === 'attendance' ? 'lowAttendance' : 'attendance')}
              >
                {activeTab === 'attendance' ? 'View Low Attendance Report' : 'Return to Attendance Records'}
              </button>
            </div>
          </div>
          
          {activeTab === 'attendance' ? (
            /* Regular Attendance Table */
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#423F3E]">
                  <thead className="bg-[#362222]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Adm. No
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Days Present
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Attendance %
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#2B2B2B] divide-y divide-[#423F3E]">
                    {!classAttendance || classAttendance.students.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-300">
                          No students found in this class or no attendance records available.
                        </td>
                      </tr>
                    ) : (
                      classAttendance.students.map((student) => (
                        <tr key={student.student_id} className="hover:bg-[#362222]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {student.admission_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {student.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <input
                              type="number"
                              min="0"
                              max={workingDays}
                              value={tempAttendance[student.student_id] !== undefined ? tempAttendance[student.student_id] : student.days_present}
                              onChange={(e) => handleAttendanceInputChange(student.student_id, e.target.value)}
                              className="w-20 px-3 py-1 bg-[#171010] border border-[#423F3E] rounded-md text-white text-center"
                              disabled={userRole !== 'staff' && userRole !== 'principal'}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${student.attendance_percentage >= 75 ? 'bg-green-900 text-green-300' : 
                                (student.attendance_percentage >= 50 ? 'bg-yellow-900 text-yellow-300' : 
                                  'bg-red-900 text-red-300')}`}>
                              {student.attendance_percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <button
                              onClick={() => handleUpdateAttendance(student.student_id)}
                              className="px-3 py-1 bg-[#362222] text-white rounded hover:bg-[#423F3E]"
                              disabled={(userRole !== 'staff' && userRole !== 'principal') || savingStudents[student.student_id]}
                            >
                              {savingStudents[student.student_id] ? 'Saving...' : 'Save'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Low Attendance Report */
            <>
              {/* Threshold Filter */}
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-full md:w-64">
                    <label className="block text-gray-300 text-sm mb-1">Attendance Threshold (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={percentageThreshold}
                      onChange={(e) => setPercentageThreshold(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                    />
                  </div>
                  <div className="w-full md:w-auto mt-4 md:mt-6 flex gap-2">
                    <Button
                      onClick={fetchLowAttendanceStudents}
                      className="w-full md:w-auto py-2 px-4 rounded-lg"
                      style={{ backgroundColor: '#362222', color: 'white' }}
                    >
                      Apply Filter
                    </Button>
                    {lowAttendanceStudents.length > 0 && (
                      <Button
                        onClick={exportLowAttendanceData}
                        className="w-full md:w-auto py-2 px-4 rounded-lg flex items-center"
                        style={{ backgroundColor: '#362222', color: 'white' }}
                        disabled={exportLoading}
                      >
                        {exportLoading ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                            Exporting...
                          </>
                        ) : (
                          <>Export</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Low Attendance Table */}
              {loadingLowAttendance ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#423F3E]">
                      <thead className="bg-[#362222]">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Adm. No
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Student Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Year
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Group
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Present Days
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Working Days
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Attendance %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#2B2B2B] divide-y divide-[#423F3E]">
                        {lowAttendanceStudents.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-gray-300">
                              No students found with attendance below {percentageThreshold}%.
                            </td>
                          </tr>
                        ) : (
                          lowAttendanceStudents.map((student) => (
                            <tr key={student.student_id} className="hover:bg-[#362222]">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                {student.admission_number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                {student.student_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                                {student.year}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 capitalize">
                                {student.group}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-center">
                                {student.days_present}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 text-center">
                                {student.working_days}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-center ${student.attendance_percentage < 50 ? 'text-red-400' : 'text-yellow-400'}`}>
                                {student.attendance_percentage.toFixed(2)}%
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Set Working Days Modal */}
      {isWorkingDaysModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Set Working Days</h2>
            <p className="text-gray-300 mb-4">
              Set the total working days for {formatMonthName(selectedMonth)} {academicYear}
            </p>
            
            <form onSubmit={handleSetWorkingDays}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Working Days</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={newWorkingDays}
                  onChange={(e) => setNewWorkingDays(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsWorkingDaysModalOpen(false)}
                  className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Export Attendance Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold text-white mb-4">Export Attendance Data</h2>
            <p className="text-gray-300 mb-6">
              Select the months to include in the export for {selectedYear}st Year, {selectedGroup.toUpperCase()}
              {selectedMedium && ` (${selectedMedium.charAt(0).toUpperCase() + selectedMedium.slice(1)} Medium)`} ({academicYear})
            </p>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Months</h3>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSelectAllMonths}
                    className="px-3 py-1 text-sm bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearMonthSelection}
                    className="px-3 py-1 text-sm bg-[#171010] text-white rounded-md hover:bg-[#2B2B2B]"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {['january', 'february', 'march', 'april', 'may', 'june', 
                  'july', 'august', 'september', 'october', 'november', 'december'].map((month) => (
                  <div key={month} 
                    className={`p-3 rounded-lg cursor-pointer border ${
                      selectedMonths.includes(month) 
                        ? 'bg-[#362222] text-white border-[#423F3E]' 
                        : 'bg-[#171010] text-gray-300 border-[#2B2B2B] hover:bg-[#202020]'
                    }`}
                    onClick={() => handleMonthToggle(month)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(month)}
                        onChange={() => {}} // Handled by div onClick
                        className="h-4 w-4 rounded border-gray-600 bg-[#171010] checked:bg-[#362222]"
                      />
                      <span className="ml-2">{formatMonthName(month)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={exportAttendanceData}
                className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E] flex items-center"
                disabled={exportLoading || selectedMonths.length === 0}
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                    Exporting...
                  </>
                ) : (
                  <>Export</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement; 