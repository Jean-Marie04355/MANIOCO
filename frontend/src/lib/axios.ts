import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error?.response?.data;
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Request Error: See Network tab for details');
    }

    if (error.response?.status === 401) {
      if (typeof globalThis.window !== 'undefined') {
        localStorage.removeItem('accessToken');
        if (!globalThis.location.pathname.startsWith('/auth')) {
          globalThis.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
