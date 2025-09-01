import { config } from '../config/index.js';

const API_BASE_URL = config.api.baseUrl;
const API_TIMEOUT = config.api.timeout;
const AUTH_STORAGE_KEY = config.auth.storageKey;

// Helper function to create fetch with timeout
const fetchWithTimeout = (url, options = {}) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), API_TIMEOUT)
    )
  ]);
};

// Base API helper
const api = {
  async call(endpoint, options = {}) {
    const token = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || '{}').access_token;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: { 
        ...defaultOptions.headers, 
        ...options.headers 
      }
    };

    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, mergedOptions);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Network error' } }));
      throw new Error(error.error?.message || 'Request failed');
    }
    
    return await response.json();
  },

  auth: {
    async login(credentials) {
      return await api.call('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },

    async register(userData) {
      return await api.call('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    async logout() {
      return await api.call('/api/auth/logout', {
        method: 'POST'
      });
    }
  },

  products: {
    async list(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';
      return await api.call(endpoint);
    },

    async get(id) {
      return await api.call(`/api/products/${id}`);
    },

    async create(productData) {
      return await api.call('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    },

    async update(id, productData) {
      return await api.call(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    },

    async delete(id) {
      return await api.call(`/api/products/${id}`, {
        method: 'DELETE'
      });
    },

    async uploadImage(id, formData) {
      // For FormData uploads, don't set headers - let browser set Content-Type with boundary
      const token = JSON.parse(localStorage.getItem('auth') || '{}').access_token;
      
      const options = {
        method: 'POST',
        body: formData,
        ...(token && { 
          headers: { 'Authorization': `Bearer ${token}` }
        })
      };

      const response = await fetch(`${API_BASE_URL}/api/products/${id}/upload-image`, options);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Network error' } }));
        throw new Error(error.error?.message || 'Upload failed');
      }
      
      return await response.json();
    }
  },

  categories: {
    async list() {
      return await api.call('/api/categories');
    },

    async create(categoryData) {
      return await api.call('/api/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      });
    },

    async update(id, categoryData) {
      return await api.call(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData)
      });
    },

    async delete(id) {
      return await api.call(`/api/categories/${id}`, {
        method: 'DELETE'
      });
    }
  }
};

export { API_BASE_URL, api };
