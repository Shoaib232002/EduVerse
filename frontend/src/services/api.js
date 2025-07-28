import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Remove /api from here since it's added in the requests
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// Optionally, export helper methods
export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;