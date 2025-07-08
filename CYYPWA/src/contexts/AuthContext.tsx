import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, db } from '../db/database';
import { authAPI, realtimeService } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
  }, []);

  useEffect(() => {
    // Connect to realtime service when authenticated
    if (isAuthenticated && user) {
      const token = localStorage.getItem('authToken');
      if (token) {
        realtimeService.connect(token);
      }
    } else {
      realtimeService.disconnect();
    }

    return () => {
      realtimeService.disconnect();
    };
  }, [isAuthenticated, user]);

  const checkAuth = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        
        // Save to local database
        const existingUser = await db.user.where('userId').equals(currentUser.userId).first();
        if (!existingUser) {
          await db.user.add(currentUser);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      // Save token and user
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Save to local database
      await db.user.clear(); // Clear any existing user
      await db.user.add(response.user);
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.signup(name, email, password);
      
      // Save token and user
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      
      // Update state
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Save to local database
      await db.user.clear(); // Clear any existing user
      await db.user.add(response.user);
      
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      // Clear user from database
      await db.user.clear();
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};