// api-service.js - API Service Layer
const ApiService = {
  // ============ AUTH METHODS ============
  
  async signup(userData) {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.SIGNUP), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      // Store token and user data
      if (data.data.token) {
        localStorage.setItem('hh-token', data.data.token);
        localStorage.setItem('hh-user', JSON.stringify(data.data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },
  
  async login(credentials) {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store token and user data
      if (data.data.token) {
        localStorage.setItem('hh-token', data.data.token);
        localStorage.setItem('hh-user', JSON.stringify(data.data.user));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  async getProfile() {
    try {
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROFILE), {
        method: 'GET',
        headers: API_CONFIG.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get profile');
      }
      
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  logout() {
    localStorage.removeItem('hh-token');
    localStorage.removeItem('hh-user');
    window.location.href = 'index.html';
  },
  
  // ============ PROPERTY METHODS ============
  
  async getProperties(filters = {}) {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.q) queryParams.append('q', filters.q);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.bedrooms) queryParams.append('bedrooms', filters.bedrooms);
      if (filters.parking !== undefined) queryParams.append('parking', filters.parking);
      if (filters.balcony !== undefined) queryParams.append('balcony', filters.balcony);
      if (filters.sort) queryParams.append('sort', filters.sort);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      
      const url = `${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROPERTIES)}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch properties');
      }
      
      return data;
    } catch (error) {
      console.error('Get properties error:', error);
      throw error;
    }
  },
  
  async getPropertyById(id) {
    try {
      const response = await fetch(
        API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROPERTY_BY_ID(id)),
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch property');
      }
      
      return data;
    } catch (error) {
      console.error('Get property error:', error);
      throw error;
    }
  },
  
  async createProperty(propertyData, images) {
    try {
      const formData = new FormData();
      
      // Append property data
      Object.keys(propertyData).forEach(key => {
        if (propertyData[key] !== undefined && propertyData[key] !== null) {
          formData.append(key, propertyData[key]);
        }
      });
      
      // Append images
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          formData.append('images', images[i]);
        }
      }
      
      const response = await fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROPERTIES), {
        method: 'POST',
        headers: API_CONFIG.getAuthHeadersMultipart(),
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create property');
      }
      
      return data;
    } catch (error) {
      console.error('Create property error:', error);
      throw error;
    }
  },
  
  async updateProperty(id, propertyData, images) {
    try {
      const formData = new FormData();
      
      // Append property data
      Object.keys(propertyData).forEach(key => {
        if (propertyData[key] !== undefined && propertyData[key] !== null) {
          formData.append(key, propertyData[key]);
        }
      });
      
      // Append new images if any
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          formData.append('images', images[i]);
        }
      }
      
      const response = await fetch(
        API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROPERTY_BY_ID(id)),
        {
          method: 'PUT',
          headers: API_CONFIG.getAuthHeadersMultipart(),
          body: formData
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update property');
      }
      
      return data;
    } catch (error) {
      console.error('Update property error:', error);
      throw error;
    }
  },
  
  async deleteProperty(id) {
    try {
      const response = await fetch(
        API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.PROPERTY_BY_ID(id)),
        {
          method: 'DELETE',
          headers: API_CONFIG.getAuthHeaders()
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete property');
      }
      
      return data;
    } catch (error) {
      console.error('Delete property error:', error);
      throw error;
    }
  },
  
  async togglePublish(id) {
    try {
      const response = await fetch(
        API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.TOGGLE_PUBLISH(id)),
        {
          method: 'POST',
          headers: API_CONFIG.getAuthHeaders()
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle publish status');
      }
      
      return data;
    } catch (error) {
      console.error('Toggle publish error:', error);
      throw error;
    }
  },
  
  // ============ OWNER METHODS ============
  
  async getOwnerProperties(ownerId, page = 1, limit = 10) {
    try {
      const url = `${API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.OWNER_PROPERTIES(ownerId))}?page=${page}&limit=${limit}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch owner properties');
      }
      
      return data;
    } catch (error) {
      console.error('Get owner properties error:', error);
      throw error;
    }
  },
  
  // ============ UTILITY METHODS ============
  
  isAuthenticated() {
    return !!localStorage.getItem('hh-token');
  },
  
  getCurrentUser() {
    const userStr = localStorage.getItem('hh-user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  isOwner() {
    const user = this.getCurrentUser();
    return user && user.role === 'owner';
  },
  
  isTenant() {
    const user = this.getCurrentUser();
    return user && user.role === 'tenant';
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}