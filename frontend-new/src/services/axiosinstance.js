import axios from "axios";
import { BASE_API_URL } from "../utils/Constants";

// Fix for Replit environment: use window.location.origin for relative API calls
const baseURL = BASE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : '/api');

const axiosInstance = axios.create({
    baseURL: baseURL,
});

// Add Authorization Header to Every Request
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

export default axiosInstance;
