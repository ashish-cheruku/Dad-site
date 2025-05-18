import axios from 'axios';

const API_URL = 'http://localhost:8004';

// Token expiration handling
const checkTokenExpiration = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // JWT tokens consist of three parts: header.payload.signature
    const payload = token.split('.')[1];
    // The payload is base64 encoded, decode it
    const decodedPayload = JSON.parse(atob(payload));
    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    
    if (decodedPayload.exp && decodedPayload.exp < currentTime) {
      // Token has expired, log the user out
      console.log('Token expired, logging out');
      authService.logout();
      window.location.href = '/login'; // Redirect to login page
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add token to authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Check if token is expired before making the request
      if (!checkTokenExpiration()) {
        // If token is expired, this will redirect to login
        return Promise.reject(new Error('Token expired'));
      }
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // If the server returns a 401, log the user out
      console.log('Unauthorized response, logging out');
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  // Register new user
  register: async (username, email, password) => {
    try {
      const response = await api.post('/register', {
        username,
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Login user
  login: async (username, password) => {
    try {
      console.log(`Attempting login for user: ${username}`);
      
      // Create URLSearchParams for proper form encoding (the FastAPI way)
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      // Get the headers ready - include Authorization if token exists
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      
      // Add token to request if it exists (will trigger "already logged in" error)
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.post(`${API_URL}/token`, formData.toString(), {
        headers: headers,
      });

      console.log('Login response:', response.data);

      // Store the token and role
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('userRole', response.data.role);
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  },

  // Get current user data
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Get principal-specific dashboard data
  getPrincipalDashboard: async () => {
    try {
      const response = await api.get('/principal/dashboard');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Get staff-specific dashboard data
  getStaffDashboard: async () => {
    try {
      const response = await api.get('/staff/dashboard');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Check if user has a specific role
  hasRole: (role) => {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) return false;
    
    // Principal has access to all roles
    if (userRole === 'principal') return true;
    
    // Staff has access to staff and student roles
    if (userRole === 'staff' && (role === 'staff' || role === 'student')) return true;
    
    // Student only has access to student role
    return userRole === role;
  },

  // User Management - Principal only
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/users/${userId}`, { role });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  updateUserPassword: async (userId, password) => {
    try {
      const response = await api.put(`/users/${userId}/password`, { password });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  deleteUser: async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      return true;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Check if token is valid and not expired
  isTokenValid: () => {
    return checkTokenExpiration();
  }
};

// Announcement service
export const announcementService = {
  // Get all announcements
  getAllAnnouncements: async () => {
    try {
      const response = await api.get('/announcements');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Create new announcement (Principal only)
  createAnnouncement: async (title, content, link = null, link_text = null) => {
    try {
      const response = await api.post('/announcements', { title, content, link, link_text });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Update existing announcement (Principal only)
  updateAnnouncement: async (id, title, content, link = null, link_text = null) => {
    try {
      const response = await api.put(`/announcements/${id}`, { title, content, link, link_text });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Delete announcement (Principal only)
  deleteAnnouncement: async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      return true;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  }
};

// Faculty service
export const facultyService = {
  // Get all faculty members
  getAllFaculty: async () => {
    try {
      const response = await api.get('/faculty');
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Create new faculty member (Principal only)
  createFaculty: async (facultyData) => {
    try {
      const response = await api.post('/faculty', facultyData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Update existing faculty member (Principal only)
  updateFaculty: async (id, facultyData) => {
    try {
      const response = await api.put(`/faculty/${id}`, facultyData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },

  // Delete faculty member (Principal only)
  deleteFaculty: async (id) => {
    try {
      await api.delete(`/faculty/${id}`);
      return true;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  }
};

// Student service
export const studentService = {
  // Get all students with optional filtering
  getAllStudents: async (year = null, group = null, medium = null) => {
    try {
      let url = '/students';
      const params = new URLSearchParams();
      
      if (year !== null) params.append('year', year);
      if (group !== null) params.append('group', group);
      if (medium !== null) params.append('medium', medium);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Get a specific student by ID
  getStudent: async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Create a new student
  createStudent: async (studentData) => {
    try {
      const response = await api.post('/students', studentData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Update an existing student
  updateStudent: async (studentId, studentData) => {
    try {
      const response = await api.put(`/students/${studentId}`, studentData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Delete a student
  deleteStudent: async (studentId) => {
    try {
      await api.delete(`/students/${studentId}`);
      return true;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  }
};

// Attendance service
export const attendanceService = {
  // Set working days for a month (Principal only)
  setWorkingDays: async (month, academicYear, workingDays) => {
    try {
      const response = await api.post('/attendance/working-days', {
        month,
        academic_year: academicYear,
        working_days: workingDays
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Get working days for a month
  getWorkingDays: async (academicYear, month) => {
    try {
      const response = await api.get(`/attendance/working-days/${academicYear}/${month}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Update student attendance
  updateStudentAttendance: async (studentId, academicYear, month, daysPresent) => {
    try {
      const response = await api.put(`/attendance/student/${studentId}/${academicYear}/${month}`, {
        days_present: daysPresent
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Get attendance for a specific student
  getStudentAttendance: async (studentId, academicYear, month) => {
    try {
      const response = await api.get(`/attendance/student/${studentId}/${academicYear}/${month}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Get attendance for all students in a class
  getClassAttendance: async (year, group, academicYear, month) => {
    try {
      const response = await api.get(`/attendance/class/${year}/${group}/${academicYear}/${month}`);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  },
  
  // Get students with attendance below threshold
  getStudentsWithLowAttendance: async (academicYear, month, percentageThreshold, year = null, group = null) => {
    try {
      let url = `/attendance/low-attendance/${academicYear}/${month}?percentage_threshold=${percentageThreshold}`;
      
      if (year !== null) {
        url += `&year=${year}`;
      }
      
      if (group !== null) {
        url += `&group=${group}`;
      }
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : { detail: 'Network error' };
    }
  }
};

export default api; 