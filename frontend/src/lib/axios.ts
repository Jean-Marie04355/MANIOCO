import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
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
    const details = {
      message: error?.message,
      code: error?.code,
      url: error?.config?.url,
      method: error?.config?.method,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data:
        typeof responseData === 'string'
          ? responseData
          : responseData ?? undefined,
      headers: error?.config?.headers,
      isAxiosError: error?.isAxiosError,
      requestPresent: Boolean(error?.request),
    };

    if (process.env.NODE_ENV !== 'production') {
      console.groupCollapsed('AXIOS ERROR DETAILS');
      console.log(details);
      if (typeof error?.toJSON === 'function') {
        console.log('AXIOS ERROR JSON', error.toJSON());
      }
      console.groupEnd();
    } else {
      console.warn('AXIOS ERROR DETAILS:', details);
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
