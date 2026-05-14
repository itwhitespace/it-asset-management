"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check session on load
    const session = localStorage.getItem('admin_session');
    if (session) {
      const { expiry } = JSON.parse(session);
      if (new Date().getTime() < expiry) {
        setIsAdmin(true);
      } else {
        localStorage.removeItem('admin_session');
      }
    }
  }, []);

  const login = () => {
    const expiry = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
    localStorage.setItem('admin_session', JSON.stringify({ isAdmin: true, expiry }));
    setIsAdmin(true);
  };

  const logout = () => {
    localStorage.removeItem('admin_session');
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
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
