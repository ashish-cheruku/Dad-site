import axios from 'axios';

const API_URL = 'http://localhost:8004';

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
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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

export default api; 