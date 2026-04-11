'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = localStorage.getItem('citysync_token');
      const savedUser = localStorage.getItem('citysync_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));

        // Verify token is still valid
        const res = await authAPI.getMe();
        setUser(res.data.data);
        localStorage.setItem('citysync_user', JSON.stringify(res.data.data));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('citysync_token');
      localStorage.removeItem('citysync_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('citysync_token', authToken);
    localStorage.setItem('citysync_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('citysync_token');
    localStorage.removeItem('citysync_user');
    router.push('/auth/login');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('citysync_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
      updateUser,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
