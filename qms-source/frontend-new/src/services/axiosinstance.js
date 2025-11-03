import axios from "axios";
import { BASE_API_URL } from "../utils/Constants";

const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
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
