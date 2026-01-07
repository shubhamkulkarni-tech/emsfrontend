import axios from "axios";

const API = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;