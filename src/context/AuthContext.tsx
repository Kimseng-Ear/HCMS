import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { Api } from '../services/api';
import { permissionService } from '../services/permissionService';
import { userService } from '../services/userService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password?: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ devOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  forgotPassword: (phone: string) => Promise<{ devOtp?: string }>;
  resetPassword: (phone: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
  hasPermission: (permissionKey: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const refreshUser = async () => {
      if (!user) return;
      try {
          const updatedUser = await userService.getById(user.id);
          if (updatedUser) {
              const userWithToken = { ...updatedUser, token: user.token };
              setUser(userWithToken);
              localStorage.setItem('hcms_user', JSON.stringify(userWithToken));
          }
      } catch (error) {
          console.error("Failed to refresh user", error);
      }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('hcms_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user', error);
          localStorage.removeItem('hcms_user');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (phone: string, password?: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, token } = await Api.auth.login(phone, password);
      const userWithToken = { ...loggedInUser, token };
      setUser(userWithToken);
      localStorage.setItem('hcms_user', JSON.stringify(userWithToken));
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestOtp = async (phone: string) => {
    setIsLoading(true);
    try {
      const res = await Api.auth.requestOtp(phone);
      return res;
    } catch (error) {
      console.error('Failed to request OTP', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser, token } = await Api.auth.verifyOtp(phone, otp);
      const userWithToken = { ...loggedInUser, token };
      setUser(userWithToken);
      localStorage.setItem('hcms_user', JSON.stringify(userWithToken));
    } catch (error) {
      console.error('OTP verification failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (phone: string) => {
    setIsLoading(true);
    try {
      const res = await Api.auth.forgotPassword(phone);
      return res;
    } catch (error) {
      console.error('Failed to request forgot password OTP', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (phone: string, otp: string, newPassword: string) => {
    setIsLoading(true);
    try {
      await Api.auth.resetPassword(phone, otp, newPassword);
    } catch (error) {
      console.error('Password reset failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hcms_user');
    window.location.href = '/#/login';
  };

  const hasRole = (roles: Role | Role[]) => {
    if (!user) return false;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    return requiredRoles.includes(user.role);
  };

  const hasPermission = (permissionKey: string) => {
    if (!user) return false;
    
    // Admins always have all permissions
    if (user.role === Role.ADMIN) return true;
    
    // Check role-based permissions
    const rolePerms = permissionService.getRolePermissions(user.role);
    const perm = rolePerms.find(p => p.permission_key === permissionKey);
    
    return perm ? perm.granted : false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, isAuthenticated, isLoading, login, requestOtp, verifyOtp, 
      forgotPassword, resetPassword, logout, hasRole, hasPermission, refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
