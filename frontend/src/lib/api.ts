
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add params serializer to ensure arrays are properly formatted
  paramsSerializer: {
    indexes: null, // 'null' for the newer axios versions
  }
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log the error but don't modify it
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Create a dedicated logs API object with specific methods
export const logsApi = {
  // Get logs with optional filters
  getLogs: (page = 1, limit = 100, filters = {}) => {
    // Build query parameters from filters
    const params = {
      skip: (page - 1) * limit,
      limit,
      ...filters
    };

    // Only include non-empty filter values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });

    // Make a GET request - ensuring we're not accidentally using DELETE
    return api.get('/logs', { params });
  },

  // Get a specific log by ID
  getLogById: (id: string) => {
    return api.get(`/logs/${id}`);
  },

  // Update a log
  updateLog: (id: string, data: any) => {
    return api.put(`/logs/${id}`, data);
  },

  // Explicitly define the delete method to avoid confusion
  deleteLog: (id: string) => {
    return api.delete(`/logs/${id}`);
  }
};

export default api;
