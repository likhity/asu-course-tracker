import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponseDto, User } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
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

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (token && userId) {
        // You could validate the token here or fetch fresh user data
        // For now, we'll just set a basic user object
        const email = await AsyncStorage.getItem('userEmail');
        const lastLoginAt = await AsyncStorage.getItem('lastLoginAt');
        if (email) {
          setUser({
            id: parseInt(userId),
            email,
            lastLoginAt: lastLoginAt || undefined,
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Starting login process');
      const response: AuthResponseDto = await apiService.login({ email, password });
      console.log('AuthContext: Login API call successful', response);
      
      // Store tokens and user data
      await AsyncStorage.multiSet([
        ['accessToken', response.token],
        ['refreshToken', response.refreshToken],
        ['userId', response.userId.toString()],
        ['userEmail', response.email],
        ['lastLoginAt', response.lastLoginAt || new Date().toISOString()],
      ]);
      console.log('AuthContext: Tokens stored in AsyncStorage');

      // Set user in state
      const userData = {
        id: response.userId,
        email: response.email,
        lastLoginAt: response.lastLoginAt || new Date().toISOString(),
      };
      console.log('AuthContext: Setting user state to:', userData);
      setUser(userData);
      console.log('AuthContext: User state updated, isAuthenticated should be:', !!userData);
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response: AuthResponseDto = await apiService.signup({ email, password });
      
      // Store tokens and user data
      await AsyncStorage.multiSet([
        ['accessToken', response.token],
        ['refreshToken', response.refreshToken],
        ['userId', response.userId.toString()],
        ['userEmail', response.email],
        ['lastLoginAt', response.lastLoginAt || new Date().toISOString()],
      ]);

      // Set user in state
      setUser({
        id: response.userId,
        email: response.email,
        lastLoginAt: response.lastLoginAt || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear stored data
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'userId',
        'userEmail',
        'lastLoginAt',
      ]);
      
      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    // This could fetch fresh user data from the API
    // For now, we'll just re-check the auth status
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
