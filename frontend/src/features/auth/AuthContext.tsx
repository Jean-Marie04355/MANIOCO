"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'REJECTED' | 'APPROVED';
  kycRejectionReasons: string | null;
  dob: string | null;
  nationality: string | null;
  phoneNumber: string | null;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  socket: Socket | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken) {
          setToken(storedToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          try {
            const response = await api.get('/auth/me');
            setUser(response.data);
          } catch (error) {
            console.error("Session invalide");
            localStorage.removeItem('accessToken');
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (token && user) {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000/realtime';
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket']
        });
        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    } else if (socket) {
        socket.disconnect();
        setSocket(null);
    }
  }, [token, user]);

  const login = (newToken: string, userData?: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', newToken);
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    if (userData) {
      setUser(userData);
    } else {
      fetchUser();
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    api.defaults.headers.common['Authorization'] = '';
    setToken(null);
    setUser(null);
    window.location.href = '/auth/login';
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {}
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, fetchUser, socket }}>
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
