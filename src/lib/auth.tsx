import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import type { Customer } from '../types';

interface AuthContextType {
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Customer>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fh_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth.php?action=me')
      .then(({ data }) => {
        if (data?.success && data.customer) setCustomer(data.customer);
        else localStorage.removeItem('fh_token');
      })
      .catch(() => localStorage.removeItem('fh_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth.php?action=login', { email, password });
    if (!data?.success) throw new Error(data?.message || 'Login failed');
    localStorage.setItem('fh_token', data.token);
    setCustomer(data.customer);
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    const { data } = await api.post('/auth.php?action=register', { name, email, phone, password });
    if (!data?.success) throw new Error(data?.message || 'Registration failed');
    localStorage.setItem('fh_token', data.token);
    setCustomer(data.customer);
  };

  const logout = () => {
    localStorage.removeItem('fh_token');
    setCustomer(null);
  };

  const updateProfile = async (updates: Partial<Customer>) => {
    const { data } = await api.put('/customers.php', updates);
    if (!data?.success) throw new Error(data?.message || 'Update failed');
    setCustomer(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ customer, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
