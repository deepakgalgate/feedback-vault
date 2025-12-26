import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('feedbackvault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('feedbackvault_token');
      localStorage.removeItem('feedbackvault_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories/all'),
  getRoot: () => api.get('/categories'),
  getChildren: (parentId) => api.get(`/categories?parent_id=${parentId}`),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
};

// Item APIs
export const itemAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/items${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/items/${id}`),
  getTrending: (limit = 10) => api.get(`/items/trending?limit=${limit}`),
  create: (data) => api.post('/items', data),
  search: (query, params = {}) => {
    const queryString = new URLSearchParams({ q: query, ...params }).toString();
    return api.get(`/search?${queryString}`);
  },
};

// Variant APIs
export const variantAPI = {
  getByItem: (itemId) => api.get(`/variants?item_id=${itemId}`),
  getById: (id) => api.get(`/variants/${id}`),
  create: (data) => api.post('/variants', data),
};

// Review APIs
export const reviewAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/reviews${queryString ? `?${queryString}` : ''}`);
  },
  getMyReviews: () => api.get('/reviews/my-reviews'),
  create: (data) => api.post('/reviews', data),
  markHelpful: (reviewId) => api.post(`/reviews/${reviewId}/helpful`),
};

// Business APIs
export const businessAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/businesses${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/businesses/${id}`),
  getMyBusiness: () => api.get('/businesses/my-business'),
  create: (data) => api.post('/businesses', data),
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getItemAnalytics: (itemId) => api.get(`/analytics/items/${itemId}`),
};

// AI Insights APIs
export const aiAPI = {
  getItemInsights: (itemId) => api.get(`/ai/insights/${itemId}`),
  getVariantInsights: (variantId) => api.get(`/ai/insights/variant/${variantId}`),
};

// Business Item Management APIs
export const businessItemAPI = {
  getItems: () => api.get('/business/items'),
  updateItem: (itemId, data) => api.put(`/business/items/${itemId}`, data),
  deleteItem: (itemId) => api.delete(`/business/items/${itemId}`),
  getVariants: (itemId) => api.get(`/business/items/${itemId}/variants`),
  updateVariant: (variantId, data) => api.put(`/business/variants/${variantId}`, data),
  deleteVariant: (variantId) => api.delete(`/business/variants/${variantId}`),
};

// Seed data
export const seedData = () => api.post('/seed');

// Health check
export const healthCheck = () => api.get('/health');

export default api;
