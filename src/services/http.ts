import axios from 'axios';

export const http = axios.create({
  baseURL: '/api'
});

http.interceptors.request.use((config) => {
  const raw = localStorage.getItem('hcms_user');
  const token = raw ? JSON.parse(raw).token : localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

