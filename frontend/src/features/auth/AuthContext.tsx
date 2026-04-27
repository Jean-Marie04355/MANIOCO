"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('afrigari_jwt');
        if (storedToken) {
          setToken(storedToken);
          try {
            // Fetch user data if we have a token
            const response = await api.get('/auth/me');
            setUser(response.data);
          } catch (error) {
            console.error("Failed to fetch user with stored token", error);
            localStorage.removeItem('afrigari_jwt');
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, userData?: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('afrigari_jwt', newToken);
    }
    setToken(newToken);
    if (userData) {
      setUser(userData);
    } else {
      fetchUser();
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('afrigari_jwt');
    }
    setToken(null);
    setUser(null);
    window.location.href = '/auth/login';
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
