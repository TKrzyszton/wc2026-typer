import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('wc2026_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('wc2026_user', JSON.stringify(data));
    setUser(data);
  }, []);

  const register = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/register', { username, password });
    localStorage.setItem('wc2026_user', JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wc2026_user');
    setUser(null);
  }, []);

  const updateUser = useCallback(async (newPassword) => {
    const { data } = await api.post('/auth/change-password', { password: newPassword });
    localStorage.setItem('wc2026_user', JSON.stringify(data));
    setUser(data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
