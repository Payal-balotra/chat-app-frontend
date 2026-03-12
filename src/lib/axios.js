import axios from "axios";
console.log("import.meta.env.VITE_BACKEND_API", import.meta.env.VITE_BACKEND_API)
export const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_BACKEND_API || "http://localhost:5000") + "/api/v1",
  withCredentials: true,
});

// Automatically attach token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});