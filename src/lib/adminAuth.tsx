import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { adminApi } from './api';
import type { Admin } from '../types';

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fh_admin_token');
    if (!token) { setLoading(false); return; }
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.type === 'admin') {
          setAdmin({
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            role: payload.role || 'staff',
          });
        } else {
          localStorage.removeItem('fh_admin_token');
        }
      }
    } catch {
      localStorage.removeItem('fh_admin_token');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await adminApi.post('/auth.php?action=admin_login', { email, password });
    if (!data?.success) throw new Error(data?.message || 'Admin login failed');
    localStorage.setItem('fh_admin_token', data.token);
    setAdmin(data.admin);
  };

  const logout = () => {
    localStorage.removeItem('fh_admin_token');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
