import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('citysync_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('citysync_token');
        localStorage.removeItem('citysync_user');
        // Only redirect if not already on auth page
        if (!window.location.pathname.startsWith('/auth') && !window.location.pathname.startsWith('/map')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOTP: (mobile) => api.post('/auth/send-otp', { mobile }),
  verifyOTP: (mobile, otp) => api.post('/auth/verify-otp', { mobile, otp }),
  authorityLogin: (username, password) => api.post('/auth/authority-login', { username, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Complaints API
export const complaintsAPI = {
  create: (data) => api.post('/complaints', data),
  getMyComplaints: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getNearby: (params) => api.get('/complaints/nearby', { params }),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  resolve: (id, data) => api.put(`/complaints/${id}/resolve`, data),
  reassign: (id, data) => api.put(`/complaints/${id}/reassign`, data),
  upvote: (id) => api.post(`/complaints/${id}/upvote`),
};

// Admin API
export const adminAPI = {
  getDashboard: (params) => api.get('/admin/dashboard', { params }),
  getComplaints: (params) => api.get('/admin/complaints', { params }),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getDepartments: () => api.get('/admin/departments'),
  escalate: (id, reason) => api.post(`/admin/escalate/${id}`, { reason }),
};

// Map API
export const mapAPI = {
  getComplaints: (params) => api.get('/map/complaints', { params }),
  getHeatmap: (params) => api.get('/map/heatmap', { params }),
  getClusters: () => api.get('/map/clusters'),
};

export default api;
