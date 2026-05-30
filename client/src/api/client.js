import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  try {
    const user = JSON.parse(localStorage.getItem('wc2026_user'));
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wc2026_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
