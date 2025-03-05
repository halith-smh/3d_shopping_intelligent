import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json', // Default headers
  },
});

export default axiosInstance;