// API utility functions
const API_BASE_URL = 'http://31.97.179.227/api';

// Get the stored token
const getToken = () => localStorage.getItem('token');

// Set the stored token
const setToken = (token) => localStorage.setItem('token', token);

// Remove the stored token
const removeToken = () => localStorage.removeItem('token');

// Get the stored association ID
const getAssociationId = () => localStorage.getItem('associationId');

// Set the stored association ID
const setAssociationId = (id) => localStorage.setItem('associationId', id);

// Remove the stored association ID
const removeAssociationId = () => localStorage.removeItem('associationId');

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Auth API functions
const auth = {
  login: async (nationalId, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nationalId, password })
    });
    setToken(data.token);
    return data;
  },

  register: async (formData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  logout: () => {
    removeToken();
    removeAssociationId();
  }
};

// Associations API functions
const associations = {
  getAll: () => apiRequest('/associations'),
  
  getById: (id) => apiRequest(`/associations/${id}`),
  
  join: async (id) => {
    const data = await apiRequest(`/associations/${id}/join`, {
      method: 'POST'
    });
    setAssociationId(id);
    return data;
  },

  setAmount: (id, amount) => apiRequest(`/associations/${id}/amount`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  }),

  setDuration: (id, duration) => apiRequest(`/associations/${id}/duration`, {
    method: 'POST',
    body: JSON.stringify({ duration })
  })
};

// Turns API functions
const turns = {
  getAll: (associationId) => apiRequest(`/turns?associationId=${associationId}`),
  
  select: (associationId, turnNumber) => apiRequest(`/turns/${associationId}/select`, {
    method: 'POST',
    body: JSON.stringify({ turnNumber })
  })
};

// Payments API functions
const payments = {
  getAll: (associationId) => apiRequest(`/payments?associationId=${associationId}`),
  
  create: (associationId, amount) => apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify({ associationId, amount })
  })
};

// Export all functions
window.api = {
  auth,
  associations,
  turns,
  payments,
  getToken,
  setToken,
  removeToken,
  getAssociationId,
  setAssociationId,
  removeAssociationId
}; 