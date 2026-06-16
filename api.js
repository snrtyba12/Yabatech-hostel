// api.js - Frontend helper for connecting to the backend API
// Place this file in your website root (same folder as index.html)
// Include it in every HTML page: <script src="api.js"></script>

// Auto-detect API URL - works locally AND on Render
const API_BASE_URL = (() => {
  // If running on Render (or any production domain)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // The API is on the SAME domain (backend serves frontend)
    return '/api';
  }
  // Local development
  return 'http://localhost:10000/api';
})();

console.log('API URL:', API_BASE_URL);

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Add auth token if available
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

// Student API helpers
const StudentAPI = {
  register: (data) => apiCall('/students/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiCall('/students/login', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => apiCall('/students/profile'),
  updateProfile: (data) => apiCall('/students/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => apiCall('/students/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  getRoomTypes: () => apiCall('/students/room-types'),
  apply: (data) => apiCall('/students/apply', { method: 'POST', body: JSON.stringify(data) }),
  getApplications: () => apiCall('/students/my-applications'),
  submitComplaint: (data) => apiCall('/students/complaint', { method: 'POST', body: JSON.stringify(data) }),
  getComplaints: () => apiCall('/students/my-complaints')
};

// Admin API helpers
const AdminAPI = {
  login: (data) => apiCall('/admin/login', { method: 'POST', body: JSON.stringify(data) }),
  getDashboard: () => apiCall('/admin/dashboard'),
  getStudents: (params = '') => apiCall(`/admin/students?${params}`),
  getStudent: (id) => apiCall(`/admin/students/${id}`),
  getApplications: (params = '') => apiCall(`/admin/applications?${params}`),
  approveApplication: (id, data) => apiCall(`/admin/applications/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),
  rejectApplication: (id, data) => apiCall(`/admin/applications/${id}/reject`, { method: 'PUT', body: JSON.stringify(data) }),
  getComplaints: (params = '') => apiCall(`/admin/complaints?${params}`),
  updateComplaint: (id, data) => apiCall(`/admin/complaints/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  getContacts: (params = '') => apiCall(`/admin/contacts?${params}`),
  replyContact: (id, data) => apiCall(`/admin/contacts/${id}/reply`, { method: 'PUT', body: JSON.stringify(data) }),
  getRooms: (params = '') => apiCall(`/admin/rooms?${params}`),
  getActivityLogs: () => apiCall('/admin/activity-logs')
};

// Public API helpers (no auth needed)
const PublicAPI = {
  submitContact: (data) => apiCall('/public/contact', { method: 'POST', body: JSON.stringify(data) }),
  getRoomTypes: () => apiCall('/public/room-types'),
  getRoomType: (id) => apiCall(`/public/room-types/${id}`),
  getStats: () => apiCall('/public/stats'),
  getTestimonials: () => apiCall('/public/testimonials'),
  getRoutine: () => apiCall('/public/routine')
};

// Auth helpers
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function isAdminLoggedIn() {
  return !!localStorage.getItem('adminToken');
}

function studentLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('studentName');
  localStorage.removeItem('studentInitial');
  localStorage.removeItem('studentMatric');
  localStorage.removeItem('studentLevel');
  localStorage.removeItem('studentGender');
  localStorage.removeItem('studentEmail');
  localStorage.removeItem('studentPhone');
  localStorage.removeItem('studentFname');
  localStorage.removeItem('studentLname');
  localStorage.removeItem('studentUsername');
  localStorage.removeItem('studentLoggedIn');
  window.location.href = 'studentlogin.html';
}

function adminLogout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminInitial');
  localStorage.removeItem('adminLoggedIn');
  window.location.href = 'adminlogin.html';
}

// Export for use in other scripts
// In browser, these are global variables
