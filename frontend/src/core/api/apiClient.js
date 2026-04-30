import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Attach Authorization Token to every API request globally
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => {
    console.log(`✅ API SUCCESS: [${response.config.method.toUpperCase()}] ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors and try refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(`🔒 AUTH ALERT: 401 Unauthorized detected for ${originalRequest.url}`);
      
      const refreshToken = localStorage.getItem('refresh_token');
      const path = window.location.pathname;

      // Don't try to refresh if we're on login or have no refresh token
      if (!refreshToken || path === '/' || originalRequest.url.includes('/auth/refresh')) {
        console.error("🚫 AUTH ERROR: No refresh token available or already on auth page. Logging out.");
        handleLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        console.log("⏳ AUTH LOG: Refresh already in progress. Queuing this request...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return API(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          console.log("🔄 AUTH LOG: Access token expired. Sending REFRESH request to backend...");
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/refresh`, {}, {
            headers: { 'refresh-token': `Bearer ${refreshToken}` }
          });

          const { access_token, refresh_token } = response.data;
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('token', access_token); // Compatibility
          if (refresh_token) localStorage.setItem('refresh_token', refresh_token);

          console.log("✨ AUTH LOG: Refresh SUCCESSFUL. New tokens stored. Retrying original request...");
          
          API.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
          
          processQueue(null, access_token);
          resolve(API(originalRequest));
        } catch (refreshError) {
          console.error("❌ AUTH ERROR: Refresh Token has also EXPIRED. Forced logout.", refreshError);
          processQueue(refreshError, null);
          handleLogout();
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }

    console.error(`❌ API ERROR: [${error.response?.status}] ${originalRequest.url}`);
    return Promise.reject(error);
  }
);

const handleLogout = () => {
  console.warn("🧹 SESSION CLEANUP: Clearing storage and redirecting to login.");
  localStorage.clear();
  const path = window.location.pathname;
  if (path !== '/' && path !== '/forgot-password' && path !== '/reset-password') {
    window.location.href = '/?session=expired'; 
  }
};

export default API;