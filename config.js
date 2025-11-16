// config.js - API Configuration
const API_CONFIG = {
  BASE_URL: 'https://house-hunt-5sg5.onrender.com/api',
  ENDPOINTS: {
    // Auth endpoints
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/auth/me',
    
    // Property endpoints
    PROPERTIES: '/properties',
    PROPERTY_BY_ID: (id) => `/properties/${id}`,
    TOGGLE_PUBLISH: (id) => `/properties/${id}/publish`,
    
    // Owner endpoints
    OWNER_PROPERTIES: (ownerId) => `/owners/${ownerId}/properties`
  },
  
  // Helper to get full URL
  getUrl: (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`,
  
  // Helper to get auth headers
  getAuthHeaders: () => {
    const token = localStorage.getItem('hh-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  },
  
  // Helper for multipart form data (file uploads)
  getAuthHeadersMultipart: () => {
    const token = localStorage.getItem('hh-token');
    return {
      ...(token && { 'Authorization': `Bearer ${token}` })
      // Don't set Content-Type for multipart - browser sets it automatically
    };
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}