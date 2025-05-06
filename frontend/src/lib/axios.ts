
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Change port if you changed the backend port
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
