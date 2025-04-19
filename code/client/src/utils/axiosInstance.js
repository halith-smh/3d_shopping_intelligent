import axios from 'axios'

const SERVER_URI = import.meta.env.VITE_SERVER_URI;

const axiosInstance = axios.create({
  baseURL: SERVER_URI,
  // timeout: 25000, // 10 seconds
  headers: {
    'Content-Type': 'application/json', // Default headers
  },
});

export default axiosInstance;