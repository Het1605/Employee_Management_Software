import axios from "axios";


const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Attach Authorization Token to every API request globally
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Prevent passing "undefined" mapping which causes JWT crashes
    if (token && token !== 'undefined' && token !== 'null') {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      
      // ONLY redirect if the user isn't already on an auth page, to prevent reload loops
      const path = window.location.pathname;
      if (path !== '/' && path !== '/forgot-password' && path !== '/reset-password') {
        window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default API;