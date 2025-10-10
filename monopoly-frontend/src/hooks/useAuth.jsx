import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { storage } from '../utils/storage';
import { authAPI } from '../api/auth.api';
import toast from 'react-hot-toast';

// Tạo context
export const AuthContext = createContext(null);

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Khởi tạo
  useEffect(() => {
    const initAuth = () => {
      const token = storage.getAccessToken();
      const savedUser = storage.getUser();
      if (token && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Đăng ký
  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      return { success: true, message: response.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Đăng nhập
  const login = async (data) => {
    try {
      const response = await authAPI.login(data);
      const { user: loggedUser, token } = response;
      storage.setAccessToken(token);
      storage.setUser(loggedUser);
      setUser(loggedUser);
      setIsAuthenticated(true);
      toast.success(`Chào mừng ${loggedUser.name}!`);
      return { success: true, user: loggedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storage.clearAll();
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Đã đăng xuất');
    }
  };

  const value = { user, loading, isAuthenticated, register, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
