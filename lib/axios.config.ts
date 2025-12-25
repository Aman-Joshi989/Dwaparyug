import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL + "/api"; 

export const api = axios.create({
  baseURL,
  withCredentials: true, // CRITICAL: Enables cookies for NextAuth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);