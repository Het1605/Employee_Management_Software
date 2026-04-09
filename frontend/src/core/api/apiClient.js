import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
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

// Auto-logout if token expires or is invalid
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export default API;